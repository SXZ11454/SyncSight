const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');
const path = require('path');

class P2PServer {
  constructor() {
    this.server = null;
    this.io = null;
    this.rooms = new Map(); // roomId -> { host, clients: Map<socketId, info>, mode: 'star'|'bt', seeds: Set<socketId> }
    this.port = null;
  }

  start(port = 3000) {
    return new Promise((resolve, reject) => {
      const app = express();
      
      // 静态文件服务
      app.use('/assets', express.static(path.join(__dirname, '../assets')));
      app.use('/js', express.static(path.join(__dirname, '../renderer/js')));
      app.use('/i18n', express.static(path.join(__dirname, '../renderer/i18n')));
      app.use('/socket.io.min.js', express.static(path.join(__dirname, '../renderer/socket.io.min.js')));
      
      // CORS 配置 - 允许所有来源（P2P 场景）
      app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') {
          return res.sendStatus(200);
        }
        next();
      });

      // 测试端点 - 验证手机能否访问服务器
      app.get('/test', (req, res) => {
        console.log('[P2P] /test endpoint accessed from:', req.ip);
        res.json({ 
          status: 'ok', 
          rooms: Array.from(this.rooms.keys()),
          roomCount: this.rooms.size,
          timestamp: Date.now()
        });
      });

      // 根目录直接返回接收端页面
      app.get('/', (req, res) => {
        console.log('[P2P] Root path accessed from:', req.ip);
        res.sendFile(path.join(__dirname, '../renderer/receiver.html'));
      });
      
      // 兼容旧路由
      app.get('/watch', (req, res) => {
        res.sendFile(path.join(__dirname, '../renderer/receiver.html'));
      });
      
      app.get('/room/:roomId', (req, res) => {
        res.sendFile(path.join(__dirname, '../renderer/receiver.html'));
      });
      
      // 加入页面路由（保留）
      app.get('/join', (req, res) => {
        res.send(this.getJoinHTML());
      });

      this.server = http.createServer(app);
      
      this.io = new Server(this.server, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST']
        },
        pingInterval: 25000,
        pingTimeout: 5000,
        transports: ['websocket', 'polling'],
        allowEIO3: true
      });

      // 监听所有连接（调试用）
      this.server.on('upgrade', (req, socket, head) => {
        console.log('[P2P] WebSocket upgrade request from:', req.socket.remoteAddress, 'URL:', req.url);
      });

      this.setupSocketHandlers();

      this.server.listen(port, '0.0.0.0', (err) => {
        if (err) {
          reject(err);
          return;
        }
        this.port = port;
        console.log(`[P2P Server] Started on port ${port}`);
        console.log(`[P2P Server] Listening on all interfaces (0.0.0.0)`);
        resolve({ port });
      });

      this.server.on('error', (err) => {
        console.error('[P2P Server] Error:', err);
        reject(err);
      });
    });
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      const clientIp = socket.request.socket.remoteAddress;
      console.log(`[P2P] Client connected: ${socket.id} from ${clientIp}`);

      // 创建房间（发送端）
      socket.on('CREATE_ROOM', ({ mode } = {}, callback) => {
        const roomId = this.generateRoomId();
        this.rooms.set(roomId, {
          host: socket.id,
          hostInfo: {
            ip: clientIp,
            createdAt: Date.now()
          },
          clients: new Map(),
          mode: mode || 'star', // 'star' 或 'bt'
          seeds: new Set()       // BT 模式下已拥有流的客户端
        });
        
        socket.join(roomId);
        console.log(`[P2P] Room created: ${roomId} by ${socket.id}, mode: ${mode || 'star'}`);
        
        if (callback) {
          callback({ roomId, success: true, mode: mode || 'star' });
        }
      });

      // 加入房间（接收端）- 无验证，自动创建或加入
      socket.on('JOIN_ROOM', ({ roomId, username }, callback) => {
        let room = this.rooms.get(roomId);
        
        console.log('[P2P] JOIN_ROOM request:', { 
          roomId, 
          username, 
          socketId: socket.id, 
          roomExists: !!room
        });
        
        // 如果房间不存在，检查是否有主机在线
        // 如果没有主机，拒绝加入
        if (!room) {
          // 检查是否有主机 socket 连接
          let hasHost = false;
          for (const [rId, r] of this.rooms.entries()) {
            if (r.host) {
              hasHost = true;
              break;
            }
          }
          
          if (!hasHost) {
            console.warn('[P2P] No host available, cannot join room:', roomId);
            if (callback) callback({ success: false, error: '没有可用的主机，请先启动发送端' });
            socket.emit('ERROR', { message: '没有可用的主机，请先启动发送端' });
            return;
          }
          
          // 房间不存在但有主机在线，可能是房间信息丢失，创建一个临时房间
          console.log('[P2P] Creating temporary room for:', roomId);
          room = {
            host: null, // 未知主机
            clients: new Map()
          };
          this.rooms.set(roomId, room);
        }

        // 检查房间是否已满（可选限制）
        if (room.clients.size >= 10) {
          if (callback) callback({ success: false, error: '房间已满' });
          socket.emit('ROOM_FULL', { roomId });
          return;
        }

        socket.join(roomId);
        
        const clientInfo = {
          socketId: socket.id,
          username: username || `User-${socket.id.slice(0, 4)}`,
          ip: clientIp,
          joinedAt: Date.now()
        };
        
        room.clients.set(socket.id, clientInfo);
        console.log('[P2P] Client added to room:', roomId);
        console.log('[P2P] Room', roomId, 'now has', room.clients.size, 'client(s)');
        console.log('[P2P] Room host:', room.host);
        
        // 如果有房主，通知房主有新用户加入
        if (room.host) {
          console.log('[P2P] Emitting CLIENT_JOINED to host:', room.host);
          console.log('[P2P] Client info:', clientInfo);
          this.io.to(room.host).emit('CLIENT_JOINED', {
            roomId,
            client: clientInfo
          });
        } else {
          console.warn('[P2P] No host in room', roomId, '- cannot notify CLIENT_JOINED');
        }

        // 通知房间内其他人
        socket.to(roomId).emit('USER_ENTER', {
          roomId,
          user: clientInfo,
          users: Array.from(room.clients.values())
        });

        console.log(`[P2P] ${clientInfo.username} joined room ${roomId}`);
        
        if (callback) {
          callback({ 
            success: true, 
            roomId,
            hostId: room.host,
            users: Array.from(room.clients.values())
          });
        }
      });

      // 加入任意可用房间（自动加入第一个有主机的房间）
      socket.on('JOIN_ANY_ROOM', ({ username }, callback) => {
        console.log('[P2P] === JOIN_ANY_ROOM request ===');
        console.log('[P2P] Username:', username);
        console.log('[P2P] Socket ID:', socket.id);
        console.log('[P2P] Available rooms:', Array.from(this.rooms.keys()));
        
        // 查找第一个有主机的房间
        let targetRoom = null;
        let targetRoomId = null;
        
        for (const [roomId, room] of this.rooms.entries()) {
          console.log('[P2P] Checking room:', roomId, 'Host:', room.host, 'Clients:', room.clients.size);
          if (room.host) {
            targetRoom = room;
            targetRoomId = roomId;
            console.log('[P2P] Found room with host:', roomId);
            break;
          }
        }
        
        if (!targetRoom) {
          console.warn('[P2P] No available rooms with host');
          if (callback) callback({ success: false, error: '没有可用的主机，请先启动发送端' });
          socket.emit('ERROR', { message: '没有可用的主机，请先启动发送端' });
          return;
        }

        // 检查房间是否已满
        if (targetRoom.clients.size >= 10) {
          console.warn('[P2P] Room is full:', targetRoomId);
          if (callback) callback({ success: false, error: '房间已满' });
          socket.emit('ROOM_FULL', { roomId: targetRoomId });
          return;
        }

        socket.join(targetRoomId);
        
        const clientInfo = {
          socketId: socket.id,
          username: username || `User-${socket.id.slice(0, 4)}`,
          ip: clientIp,
          joinedAt: Date.now()
        };
        
        targetRoom.clients.set(socket.id, clientInfo);
        console.log('[P2P] Client added to room:', targetRoomId, 'Client:', clientInfo.socketId);
        console.log('[P2P] Room', targetRoomId, 'now has', targetRoom.clients.size, 'client(s)');
        console.log('[P2P] Room host:', targetRoom.host);
        
        // 通知房主有新用户加入
        console.log('[P2P] Emitting CLIENT_JOINED to host:', targetRoom.host);
        this.io.to(targetRoom.host).emit('CLIENT_JOINED', {
          roomId: targetRoomId,
          client: clientInfo,
          mode: targetRoom.mode,        // 告知房主当前模式
          relayFrom: targetRoom.mode === 'bt' && targetRoom.seeds.size > 0 
            ? this.selectSeed(targetRoom) 
            : null  // BT 模式下指定由哪个 seed 转发
        });

        // 通知房间内其他人
        socket.to(targetRoomId).emit('USER_ENTER', {
          roomId: targetRoomId,
          user: clientInfo,
          users: Array.from(targetRoom.clients.values())
        });

        console.log(`[P2P] ${clientInfo.username} auto-joined room ${targetRoomId} (mode: ${targetRoom.mode})`);
        
        if (callback) {
          callback({ 
            success: true, 
            roomId: targetRoomId,
            hostId: targetRoom.host,
            mode: targetRoom.mode,
            relayFrom: targetRoom.mode === 'bt' && targetRoom.seeds.size > 0 
              ? this.selectSeed(targetRoom) 
              : null,
            users: Array.from(targetRoom.clients.values())
          });
        }
      });

      // P2P 信令消息转发
      socket.on('SIGNALING', ({ roomId, targetId, type, data }) => {
        const room = this.rooms.get(roomId);
        if (!room) {
          console.warn(`[P2P] Room ${roomId} not found for signaling`);
          return;
        }

        // 统一转发：任何客户端都可以发给任何其他客户端或房主
        console.log(`[P2P] Signaling: ${type} from ${socket.id} to ${targetId}`);
        this.io.to(targetId).emit('SIGNALING', {
          roomId,
          fromId: socket.id,
          type,
          data
        });
      });

      // 客户端注册为 seed（BT 模式下，客户端收到流后注册）
      socket.on('REGISTER_SEED', ({ roomId }) => {
        const room = this.rooms.get(roomId);
        if (!room) {
          console.warn(`[P2P] Room ${roomId} not found for REGISTER_SEED`);
          return;
        }
        
        if (room.mode !== 'bt') {
          console.log(`[P2P] Room ${roomId} is not in BT mode, ignoring REGISTER_SEED`);
          return;
        }
        
        room.seeds.add(socket.id);
        console.log(`[P2P] Client ${socket.id} registered as seed in room ${roomId}`);
        console.log(`[P2P] Room ${roomId} now has ${room.seeds.size} seed(s)`);
      });

      // 切换房间模式
      socket.on('SET_ROOM_MODE', ({ roomId, mode }) => {
        const room = this.rooms.get(roomId);
        if (!room) {
          console.warn(`[P2P] Room ${roomId} not found for SET_ROOM_MODE`);
          return;
        }
        
        // 只有房主可以切换模式
        if (room.host !== socket.id) {
          console.warn(`[P2P] Only host can change room mode`);
          return;
        }
        
        room.mode = mode;
        room.seeds.clear(); // 切换模式时清空 seed 列表
        console.log(`[P2P] Room ${roomId} mode changed to ${mode}`);
        
        // 通知所有客户端模式变更
        this.io.to(roomId).emit('MODE_CHANGED', { mode });
      });

      // 离开房间
      socket.on('LEAVE_ROOM', ({ roomId }) => {
        this.removeUserFromRoom(roomId, socket.id);
        socket.leave(roomId);
        console.log(`[P2P] ${socket.id} left room ${roomId}`);
      });

      // 断开连接
      socket.on('disconnect', () => {
        console.log(`[P2P] Client disconnected: ${socket.id}`);
        
        // 从所有房间中移除
        for (const [roomId, room] of this.rooms.entries()) {
          if (room.host === socket.id) {
            // 房主断开，通知所有客户端并关闭房间
            this.io.to(roomId).emit('HOST_LEFT', { roomId });
            this.rooms.delete(roomId);
          } else {
            // 从 seed 列表中移除
            if (room.seeds) {
              room.seeds.delete(socket.id);
            }
            this.removeUserFromRoom(roomId, socket.id);
          }
        }
      });

      // 获取网络信息
      socket.on('GET_NETWORK_INFO', (callback) => {
        callback({
          ip: clientIp,
          socketId: socket.id
        });
      });
    });
  }

  removeUserFromRoom(roomId, socketId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    if (room.clients.has(socketId)) {
      const client = room.clients.get(socketId);
      room.clients.delete(socketId);
      
      // 从 seed 列表中移除
      if (room.seeds) {
        room.seeds.delete(socketId);
      }

      // 通知房间内其他人
      this.io.to(roomId).emit('USER_EXIT', {
        roomId,
        userId: socketId,
        username: client.username
      });

      // 通知房主
      if (room.host) {
        this.io.to(room.host).emit('CLIENT_LEFT', {
          roomId,
          clientId: socketId
        });
      }
    }
  }

  // BT 模式：选择一个 seed 来为新客户端提供流
  selectSeed(room) {
    if (!room.seeds || room.seeds.size === 0) {
      return room.host; // 没有 seed 时回退到房主
    }
    
    // 选择 seed 数量最少的（负载均衡）
    // 简单实现：随机选择一个 seed
    const seeds = Array.from(room.seeds);
    return seeds[Math.floor(Math.random() * seeds.length)];
  }

  generateRoomId() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  getBroadcastAddress() {
    const os = require('os');
    const nets = os.networkInterfaces();
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

  getJoinHTML() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>加入房间 - SyncSight</title>
  <link rel="stylesheet" href="/assets/mdui.css" />
  <script src="/assets/mdui.global.js"></script>
  <script src="/socket.io.min.js"></script>
  <style>
    body { 
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      width: 100%;
      max-width: 400px;
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      text-align: center;
    }
    p {
      color: #666;
      text-align: center;
      margin-bottom: 30px;
    }
    .input-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 500;
    }
    mdui-text-field {
      width: 100%;
    }
    mdui-button {
      width: 100%;
      margin-top: 10px;
    }
    .error {
      color: #f44336;
      text-align: center;
      margin-top: 10px;
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎬 SyncSight</h1>
    <p>输入房间号加入会议</p>
    
    <div class="input-group">
      <label>房间号</label>
      <mdui-text-field id="roomIdInput" variant="outlined" placeholder="请输入房间号"></mdui-text-field>
    </div>
    
    <div class="input-group">
      <label>昵称（可选）</label>
      <mdui-text-field id="usernameInput" variant="outlined" placeholder="请输入您的昵称"></mdui-text-field>
    </div>
    
    <mdui-button id="joinBtn" variant="filled" color="primary">加入房间</mdui-button>
    <p class="error" id="errorMsg"></p>
  </div>

  <script>
    const joinBtn = document.getElementById('joinBtn');
    const roomIdInput = document.getElementById('roomIdInput');
    const usernameInput = document.getElementById('usernameInput');
    const errorMsg = document.getElementById('errorMsg');

    joinBtn.addEventListener('click', async () => {
      const roomId = roomIdInput.value.trim().toUpperCase();
      const username = usernameInput.value.trim() || '访客';

      if (!roomId) {
        showError('请输入房间号');
        return;
      }

      try {
        const socket = io();
        
        socket.on('connect', () => {
          socket.emit('JOIN_ROOM', { roomId, username }, (response) => {
            if (response.success) {
              console.log('Joined room:', roomId, 'Host:', response.hostId);
              window.location.href = '/room/' + roomId;
            } else {
              console.error('Failed to join room:', response.error);
              showError(response.error || '加入失败，请检查房间号是否正确');
            }
          });
        });

        socket.on('connect_error', (err) => {
          showError('无法连接到服务器');
          console.error(err);
        });
      } catch (err) {
        showError('发生错误：' + err.message);
      }
    });

    function showError(msg) {
      errorMsg.textContent = msg;
      errorMsg.style.display = 'block';
    }
  </script>
</body>
</html>`;
  }

  stop() {
    return new Promise((resolve) => {
      if (this.io) {
        this.io.disconnectSockets();
        this.io = null;
      }
      
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          this.port = null;
          this.rooms.clear();
          console.log('[P2P Server] Stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getPort() {
    return this.port;
  }

  getRooms() {
    return Array.from(this.rooms.entries()).map(([id, room]) => ({
      id,
      host: room.host,
      clientCount: room.clients.size
    }));
  }
}

module.exports = P2PServer;
