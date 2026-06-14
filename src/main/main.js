const { app, BrowserWindow, desktopCapturer, ipcMain, Menu, screen } = require('electron');
const path = require('path');
const P2PServer = require('./p2p-server');
const Config = require('./config');

// 绿色便携模式：将所有数据目录重定向到程序自身目录，避免写入 AppData
const appDir = path.dirname(app.getPath('exe'));
const portableDataDir = path.join(appDir, 'data');
app.setPath('userData', portableDataDir);
app.setPath('appData', appDir);
app.setPath('temp', path.join(portableDataDir, 'temp'));
app.setPath('cache', path.join(portableDataDir, 'cache'));
app.setPath('logs', path.join(portableDataDir, 'logs'));

// 布局常量
const LEFT_PANEL_WIDTH = 520;
const LEFT_MIN_WIDTH = 400;
const RIGHT_PANEL_WIDTH = 440; // 含分隔条(10px)，右栏内容区=430px
const DEFAULT_WINDOW_WIDTH = RIGHT_PANEL_WIDTH; // 默认仅右栏（紧凑模式）

let mainWindow = null;
let p2pServer = null;
let streaming = false;
let currentRoomId = null;
let cameraWindow = null;
let toolbarWindow = null; // 共享浮动工具栏窗口

function createWindow() {
  // Remove default menu
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
    width: DEFAULT_WINDOW_WIDTH,
    height: 750,
    minWidth: RIGHT_PANEL_WIDTH + 10,
    minHeight: 540,
    title: 'SyncSight - 屏幕共享发送端',
    icon: path.join(__dirname, '../assets/syncsight.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // 隐藏滚动条但保留滚动功能
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.insertCSS(`
      ::-webkit-scrollbar { display: none; }
      html { scrollbar-width: none; }
      body { -ms-overflow-style: none; }
    `);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    closeCameraWindow();
    closeToolbarWindow();
    stopSharing();
  });

}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// ============ Config (portable, saved to app directory) ============
Config.load();

ipcMain.handle('config-get', (event, key) => {
  return Config.get(key);
});

ipcMain.handle('config-get-all', () => {
  return Config.get();
});

ipcMain.handle('config-set', (event, key, value) => {
  Config.set(key, value);
  return true;
});

ipcMain.handle('config-set-all', (event, obj) => {
  Config.setAll(obj);
  return true;
});

app.on('window-all-closed', () => {
  console.log('All windows closed, stopping sharing...');
  stopSharing();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 确保程序退出时释放所有资源
app.on('before-quit', () => {
  console.log('Application quitting, stopping sharing...');
  stopSharing();
});

function getBroadcastAddress() {
  const nets = require('os').networkInterfaces();
  const validIps = [];
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        if (!net.address.startsWith('169.254.')) {
          validIps.push(net.address);
        }
      }
    }
  }
  
  return validIps.length > 0 ? validIps[0] : 'localhost';
}

async function startServer(port, mode = 'star') {
  try {
    if (!p2pServer) {
      p2pServer = new P2PServer();
    }
    
    const result = await p2pServer.start(port);
    const address = getBroadcastAddress();
    
    // 创建房间 - 先创建 socket 并保存到全局变量
    global.hostSocket = require('socket.io-client')(`http://localhost:${result.port}`);
    
    return new Promise((resolve, reject) => {
      global.hostSocket.on('connect', () => {
        console.log('[Main] Host socket connected, ID:', global.hostSocket.id);
        global.hostSocket.emit('CREATE_ROOM', { mode }, (response) => {
          if (response.success) {
            currentRoomId = response.roomId;
            console.log(`[Main] Room created: ${response.roomId}, mode: ${response.mode}`);
            
            // 设置事件监听
            setupHostSocketListeners(global.hostSocket);
            
            resolve({ address, port: result.port, roomId: response.roomId, mode: response.mode });
          } else {
            global.hostSocket.disconnect();
            global.hostSocket = null;
            reject(new Error('Failed to create room'));
          }
        });
      });
      
      global.hostSocket.on('connect_error', (err) => {
        console.error('[Main] Host socket connect error:', err);
        global.hostSocket.disconnect();
        global.hostSocket = null;
        reject(err);
      });
      
      setTimeout(() => {
        if (global.hostSocket && !global.hostSocket.connected) {
          global.hostSocket.disconnect();
          global.hostSocket = null;
          reject(new Error('Timeout creating room'));
        }
      }, 5000);
    });
  } catch (err) {
    console.error('[Main] Failed to start server:', err);
    throw err;
  }
}

function setupHostSocketListeners(socket) {
  // 监听客户端加入
  socket.on('CLIENT_JOINED', (data) => {
    console.log('[Main] === CLIENT_JOINED event ===');
    console.log('[Main] Data:', JSON.stringify(data, null, 2));
    if (mainWindow && !mainWindow.isDestroyed()) {
      console.log('[Main] Forwarding client-joined to renderer');
      mainWindow.webContents.send('client-joined', data);
    } else {
      console.warn('[Main] mainWindow is destroyed or destroyed, cannot forward');
    }
  });
  
  // 监听客户端离开
  socket.on('CLIENT_LEFT', (data) => {
    console.log('[Main] Client left:', data);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('client-left', data);
    }
  });
  
  // 监听信令消息（从接收端来的）
  socket.on('SIGNALING', (message) => {
    console.log('[Main] === SIGNALING message received ===');
    console.log('[Main] Type:', message.type);
    console.log('[Main] From:', message.fromId);
    console.log('[Main] Data:', JSON.stringify(message.data, null, 2));
    if (mainWindow && !mainWindow.isDestroyed()) {
      const payload = {
        type: message.type,
        payload: message.data,
        fromSocketID: message.fromId
      };
      console.log('[Main] Forwarding to renderer:', JSON.stringify(payload, null, 2));
      mainWindow.webContents.send('signaling-message', payload);
    } else {
      console.warn('[Main] mainWindow is destroyed, cannot forward signaling');
    }
  });
  
  // 监听主机离开（不应该发生）
  socket.on('HOST_LEFT', (data) => {
    console.log('[Main] Host left:', data);
  });
  
  socket.on('disconnect', () => {
    console.log('[Main] Host socket disconnected');
  });
  
  socket.on('connect_error', (err) => {
    console.error('[Main] Host socket error:', err);
  });
}

function stopSharing() {
  console.log('Stopping sharing...');
  streaming = false;
  currentRoomId = null;

  // 关闭房主 socket 连接
  if (global.hostSocket) {
    global.hostSocket.disconnect();
    global.hostSocket = null;
  }

  if (p2pServer) {
    p2pServer.stop().then(() => {
      p2pServer = null;
    });
  }
  
  // 通知渲染进程停止捕获
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('stop-capture');
  }
}

async function getScreenSources() {
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
    thumbnailSize: { width: 320, height: 180 },
    fetchWindowIcons: false
  });

  return sources.map(source => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail.toDataURL()
  }));
}

ipcMain.handle('get-sources', async () => {
  return await getScreenSources();
});

ipcMain.handle('start-sharing', async (event, sourceId, options, port) => {
  try {
    const serverInfo = await startServer(port, options.mode);
    streaming = true;
    return { success: true, serverInfo };
  } catch (err) {
    console.error('Start sharing error:', err);
    stopSharing();
    return { success: false, error: err.message };
  }
});

ipcMain.handle('send-signaling', async (event, targetId, type, data) => {
  if (global.hostSocket && global.hostSocket.connected && currentRoomId) {
    return new Promise((resolve, reject) => {
      // 房主发送信令不需要等待回调
      global.hostSocket.emit('SIGNALING', {
        roomId: currentRoomId,
        targetId,
        type,
        data
      });
      
      // 立即成功，不等待响应
      resolve({ success: true });
      
      // 移除超时
    });
  } else {
    console.warn('[IPC] Cannot send signaling: host socket not connected or no room');
    return { success: false, error: 'Host socket not connected' };
  }
});

ipcMain.handle('set-room-mode', async (event, mode) => {
  if (global.hostSocket && global.hostSocket.connected && currentRoomId) {
    global.hostSocket.emit('SET_ROOM_MODE', { roomId: currentRoomId, mode });
    console.log('[Main] Room mode changed to:', mode);
    return { success: true };
  } else {
    console.warn('[IPC] Cannot set room mode: host socket not connected or no room');
    return { success: false, error: 'Host socket not connected' };
  }
});

ipcMain.handle('stop-sharing', async () => {
  stopSharing();
  return { success: true };
});

ipcMain.handle('get-stream-status', async () => {
  return { streaming, roomId: currentRoomId };
});

// 摄像头预览窗口
ipcMain.handle('open-camera-window', async (event, cameraId) => {
  if (cameraWindow && !cameraWindow.isDestroyed()) {
    cameraWindow.focus();
    return { success: true, exists: true };
  }

  cameraWindow = new BrowserWindow({
    width: 320,
    height: 240,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    title: 'SyncSight - 摄像头',
    // 定位到屏幕右上角
    x: screen.getPrimaryDisplay().workAreaSize.width - 320 - 16,
    y: screen.getPrimaryDisplay().workArea.y + 16,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload-camera.js'),
      sandbox: false
    }
  });

  // 摄像头窗口按比例调整大小
  let cameraAspect = 4 / 3;
  cameraWindow.on('will-resize', (event, newBounds) => {
    const w = newBounds.width;
    const h = Math.round(w / cameraAspect);
    newBounds.height = h;
    event.newBounds = newBounds;
  });

  // 接收摄像头实际分辨率比例，调整窗口大小
  ipcMain.removeAllListeners('camera-aspect-ratio');
  ipcMain.on('camera-aspect-ratio', (event, ratio) => {
    cameraAspect = ratio;
    // 按实际比例调整窗口
    if (cameraWindow && !cameraWindow.isDestroyed()) {
      const bounds = cameraWindow.getBounds();
      const newH = Math.round(bounds.width / ratio);
      cameraWindow.setBounds({ width: bounds.width, height: newH });
    }
  });

  cameraWindow.loadFile(path.join(__dirname, '../renderer/camera-preview.html'));
  
  cameraWindow.on('closed', () => {
    cameraWindow = null;
    // 通知主窗口摄像头窗口已关闭
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('camera-window-closed');
    }
  });

  return { success: true, exists: false };
});

ipcMain.handle('close-camera-window', async () => {
  closeCameraWindow();
  return { success: true };
});

ipcMain.handle('is-camera-window-open', async () => {
  return cameraWindow && !cameraWindow.isDestroyed();
});

function closeCameraWindow() {
  if (cameraWindow && !cameraWindow.isDestroyed()) {
    cameraWindow.close();
    cameraWindow = null;
  }
}

// 将主窗口的摄像头流传给摄像头预览窗口
ipcMain.on('send-camera-stream-to-window', (event, data) => {
  if (cameraWindow && !cameraWindow.isDestroyed()) {
    cameraWindow.webContents.send('camera-stream-id', data);
  }
});

// ============ 共享浮动工具栏窗口 ============
// 工具栏标签翻译（主进程侧，用于初始化工具栏语言）
const TOOLBAR_LABELS = {
  'zh-CN': { tbMic: '麦克风', tbVideo: '共享画面', tbCamera: '摄像头', tbAudio: '系统声音', tbStop: '停止共享' },
  'en-US': { tbMic: 'Microphone', tbVideo: 'Screen Share', tbCamera: 'Camera', tbAudio: 'System Audio', tbStop: 'Stop Sharing' }
};
function getToolbarLabels(lang) {
  return TOOLBAR_LABELS[lang] || TOOLBAR_LABELS['zh-CN'];
}

function createToolbarWindow() {
  if (toolbarWindow && !toolbarWindow.isDestroyed()) {
    toolbarWindow.focus();
    return;
  }

  // 获取主显示器信息，定位到屏幕顶部居中
  const display = screen.getPrimaryDisplay();
  const { width: screenWidth } = display.workAreaSize;

  // 窗口尺寸（留边距）
  const margin = 24;
  const lang = Config.get('language') || 'zh-CN';
  const tbWidth = lang === 'en-US' ? 452 : 428;
  const tbHeight = 88;

  toolbarWindow = new BrowserWindow({
    width: tbWidth,
    height: tbHeight,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    // 屏幕顶部居中，留上边距
    x: Math.round((screenWidth - tbWidth) / 2),
    y: Math.round(display.workArea.y + margin),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false
    }
  });

  toolbarWindow.loadFile(path.join(__dirname, '../renderer/toolbar.html'));

  // 窗口加载完成后，同步初始语言
  toolbarWindow.webContents.on('did-finish-load', () => {
    const lang = Config.get('language') || 'zh-CN';
    // 从内嵌翻译数据获取工具栏标签
    const labels = getToolbarLabels(lang);
    if (labels) {
      toolbarWindow.webContents.send('toolbar-set-lang', labels);
    }
  });

  toolbarWindow.on('closed', () => {
    toolbarWindow = null;
    // 通知渲染器工具栏已关闭，同步开关状态
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('toolbar-closed-from-main');
    }
  });
}

function closeToolbarWindow() {
  if (toolbarWindow && !toolbarWindow.isDestroyed()) {
    // 先发退出动画信号，等动画完成后再销毁窗口
    toolbarWindow.webContents.send('toolbar-close');
    ipcMain.once('toolbar-closed', () => {
      if (toolbarWindow && !toolbarWindow.isDestroyed()) {
        toolbarWindow.close();
        toolbarWindow = null;
      }
    });
  }
}

// 工具栏位置固定在屏幕顶部，不再跟随主窗口
// （用户可通过拖动自行调整位置）

// 主进程接收工具栏按钮点击，转发给渲染器
ipcMain.on('toolbar-action', (_event, action) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('toolbar-action-from-main', action);
  }
});

// 渲染器请求显示/隐藏工具栏
ipcMain.handle('show-toolbar', () => {
  createToolbarWindow();
  return { success: true };
});

ipcMain.handle('hide-toolbar', () => {
  closeToolbarWindow();
  return { success: true };
});

// 渲染器同步开关状态到工具栏
ipcMain.on('toolbar-sync-state', (_event, state) => {
  if (toolbarWindow && !toolbarWindow.isDestroyed()) {
    toolbarWindow.webContents.send('toolbar-sync-state', state);
  }
});

// 渲染器同步i18n翻译到工具栏
ipcMain.on('set-toolbar-lang', (_event, labels) => {
  if (toolbarWindow && !toolbarWindow.isDestroyed()) {
    toolbarWindow.webContents.send('toolbar-set-lang', labels);
  }
});

// 工具栏窗口自适应内容大小
ipcMain.on('toolbar-resize', (_event, { width, height }) => {
  if (toolbarWindow && !toolbarWindow.isDestroyed()) {
    toolbarWindow.setSize(width, height);
  }
});

// ============ 窗口大小动画 ============
const ANIMATE_STEP = 16; // ms per frame (~60fps)
const ANIMATE_DURATION = 350; // total ms

ipcMain.handle('resize-to-expanded', async () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const [currentWidth, height] = mainWindow.getSize();
  // 展开目标：当前宽度 + 左栏宽度
  const expandedWidth = currentWidth + LEFT_PANEL_WIDTH;
  
  // 展开后最小宽度 = 左栏 + 右栏
  mainWindow.setMinimumSize(LEFT_MIN_WIDTH + RIGHT_PANEL_WIDTH, 540);
  
  const [startX, startY] = mainWindow.getPosition();
  const startWidth = currentWidth;
  const totalDiff = expandedWidth - startWidth;
  const halfDiff = totalDiff / 2;

  let targetX = startX - halfDiff;
  if (targetX < 0) targetX = 0;
  
  const actualLeftShift = startX - targetX;
  const finalWidth = startWidth + actualLeftShift * 2;
  
  const { width: screenWidth } = require('electron').screen.getPrimaryDisplay().workAreaSize;
  if (targetX + finalWidth > screenWidth) {
    const rightOverflow = targetX + finalWidth - screenWidth;
    const adjustedWidth = finalWidth - rightOverflow;
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      function step() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / ANIMATE_DURATION, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const newWidth = Math.round(startWidth + (adjustedWidth - startWidth) * eased);
        const newX = Math.round(startX - actualLeftShift * eased);
        mainWindow.setBounds({ x: newX, y: startY, width: newWidth, height });
        if (progress < 1) { setTimeout(step, ANIMATE_STEP); } else { resolve(); }
      }
      step();
    });
  }
  
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    function step() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ANIMATE_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const newWidth = Math.round(startWidth + totalDiff * eased);
      const newX = Math.round(startX - halfDiff * eased);
      mainWindow.setBounds({ x: newX, y: startY, width: newWidth, height });
      
      if (progress < 1) {
        setTimeout(step, ANIMATE_STEP);
      } else {
        resolve();
      }
    }
    step();
  });
});

ipcMain.handle('resize-to-compact', async () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const [currentWidth, height] = mainWindow.getSize();
  // 收缩目标：仅保留右栏宽度
  const targetWidth = RIGHT_PANEL_WIDTH;
  if (currentWidth <= targetWidth) return;
  
  mainWindow.setMinimumSize(RIGHT_PANEL_WIDTH + 10, 540);
  
  const [startX, startY] = mainWindow.getPosition();
  const startWidth = currentWidth;
  const totalDiff = startWidth - targetWidth;
  const halfDiff = totalDiff / 2;
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    function step() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / ANIMATE_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const newWidth = Math.round(startWidth - totalDiff * eased);
      const newX = Math.round(startX + halfDiff * eased);
      mainWindow.setBounds({ x: newX, y: startY, width: newWidth, height });
      
      if (progress < 1) {
        setTimeout(step, ANIMATE_STEP);
      } else {
        resolve();
      }
    }
    step();
  });
});
