const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSources: () => ipcRenderer.invoke('get-sources'),
  startSharing: (sourceId, options, port) => ipcRenderer.invoke('start-sharing', sourceId, options, port),
  stopSharing: () => ipcRenderer.invoke('stop-sharing'),
  getStreamStatus: () => ipcRenderer.invoke('get-stream-status'),
  sendSignaling: (targetId, type, data) => ipcRenderer.invoke('send-signaling', targetId, type, data),
  setRoomMode: (mode) => ipcRenderer.invoke('set-room-mode', mode),
  
  // 摄像头窗口
  openCameraWindow: (cameraId) => ipcRenderer.invoke('open-camera-window', cameraId),
  closeCameraWindow: () => ipcRenderer.invoke('close-camera-window'),
  isCameraWindowOpen: () => ipcRenderer.invoke('is-camera-window-open'),
  sendCameraStreamToWindow: (streamId) => ipcRenderer.send('send-camera-stream-to-window', streamId),
  
  // 窗口大小动画
  resizeToExpanded: () => ipcRenderer.invoke('resize-to-expanded'),
  resizeToCompact: () => ipcRenderer.invoke('resize-to-compact'),

  // 工具栏窗口
  showToolbar: () => ipcRenderer.invoke('show-toolbar'),
  hideToolbar: () => ipcRenderer.invoke('hide-toolbar'),
  syncToolbarState: (state) => ipcRenderer.send('toolbar-sync-state', state),
  setToolbarLang: (labels) => ipcRenderer.send('set-toolbar-lang', labels),
  onToolbarAction: (callback) => {
    ipcRenderer.on('toolbar-action-from-main', (_event, action) => callback(action));
  },
  onToolbarClosed: (callback) => {
    ipcRenderer.on('toolbar-closed-from-main', () => callback());
  },

  // 配置文件（便携模式，保存在程序目录下）
  configGet: (key) => ipcRenderer.invoke('config-get', key),
  configGetAll: () => ipcRenderer.invoke('config-get-all'),
  configSet: (key, value) => ipcRenderer.invoke('config-set', key, value),
  configSetAll: (obj) => ipcRenderer.invoke('config-set-all', obj),
  
  // 事件监听
  onSignalingMessage: (callback) => {
    ipcRenderer.on('signaling-message', (event, data) => {
      console.log('[PRELOAD] Received signaling-message:', data.type, 'from:', data.fromSocketID);
      callback(data);
    });
  },
  onClientJoined: (callback) => {
    ipcRenderer.on('client-joined', (event, data) => {
      console.log('[PRELOAD] Received client-joined:', data.client?.socketId);
      callback(data);
    });
  },
  onClientLeft: (callback) => {
    ipcRenderer.on('client-left', (event, data) => callback(data));
  },
  onStopCapture: (callback) => {
    ipcRenderer.on('stop-capture', () => callback());
  },
  onCameraWindowClosed: (callback) => {
    ipcRenderer.on('camera-window-closed', () => callback());
  },
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
