# SyncSight P2P 架构说明

## 概述
基于未加密 HTTP WebRTC P2P 实现多设备之间的音视频传输。

## 架构组件

### 1. P2P 信令服务器 (p2p-server.js)
- **位置**: `src/main/p2p-server.js`
- **功能**: 
  - 使用 Socket.IO 进行信令交换
  - 支持多房间（Multi-Room）
  - 每个房间支持 1 个主机（发送端）+ 多个客户端（接收端）
  - 转发 WebRTC 信令消息（Offer/Answer/ICE Candidate）
- **端口**: 默认 3000（可配置）

### 2. 发送端 (Sender)
- **主进程**: `src/main/main.js`
  - 创建 Electron 窗口
  - 启动 P2P 信令服务器
  - 创建房间
  - 管理屏幕/窗口/摄像头捕获
  
- **渲染进程**: `src/renderer/renderer.js`
  - 获取媒体源（屏幕/窗口/摄像头/麦克风）
  - 创建 WebRTC PeerConnection
  - 发送媒体流给接收端
  - 处理信令消息

### 3. 接收端 (Receiver)
- **访问方式**: 浏览器访问 `http://<sender-ip>:3000/room/<roomId>`
- **功能**:
  - 通过 Socket.IO 加入房间
  - 创建 WebRTC PeerConnection
  - 接收并播放媒体流
  - 支持多流显示（未来扩展）

## 连接流程

```
发送端 (Sender)                    信令服务器                    接收端 (Receiver)
    |                                  |                              |
    |-- 1. 创建房间 ------------------>|                              |
    |                                  |                              |
    |                                  |<-- 2. 加入房间 --------------|
    |                                  |                              |
    |<-- 3. CLIENT_JOINED -------------|                              |
    |                                  |                              |
    |-- 4. 创建 Offer ---------------->|                              |
    |                                  |-- 5. 转发 OFFER ------------>|
    |                                  |                              |
    |                                  |<-- 6. 创建 Answer -----------|
    |                                  |                              |
    |<-- 7. 转发 ANSWER ---------------|                              |
    |                                  |                              |
    |    === P2P 连接建立，开始传输媒体流 ===                          |
    |                                  |                              |
    |--------------------------------->|------------------------------|
    |         WebRTC Media Stream (P2P Direct)                        |
```

## 信令消息类型

### CLIENT_JOINED
当新接收端加入房间时，发送给发送端：
```javascript
{
  roomId: string,
  client: {
    socketId: string,
    username: string,
    ip: string,
    joinedAt: number
  }
}
```

### SIGNALING
P2P 信令消息转发：
```javascript
{
  roomId: string,
  targetId: string,      // 目标 Socket ID
  type: string,          // 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE'
  data: any              // SDP 或 ICE 候选
}
```

### USER_EXIT
用户离开房间：
```javascript
{
  roomId: string,
  userId: string,
  username: string
}
```

## WebRTC 配置

### STUN 服务器
使用 Google 公共 STUN 服务器：
```javascript
{
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]
}
```

### TURN 服务器（可选，用于复杂网络）
如需支持对称 NAT，可配置 TURN：
```javascript
{
  iceServers: [
    {
      urls: 'turn:your-turn-server.com:3478',
      username: 'user',
      credential: 'pass'
    }
  ]
}
```

## 媒体捕获

### 屏幕/窗口共享
使用 `desktopCapturer` API：
```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    mandatory: {
      chromeMediaSource: 'desktop',
      chromeMediaSourceId: sourceId,
      maxFrameRate: 30,
      minFrameRate: 15
    }
  },
  audio: {
    mandatory: {
      chromeMediaSource: 'desktop',
      chromeMediaSourceId: sourceId
    }
  }
});
```

### 摄像头共享
使用 `getUserMedia`：
```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    deviceId: deviceId ? { exact: deviceId } : undefined
  },
  audio: true
});
```

### 麦克风（叠加到屏幕共享）
```javascript
const micStream = await navigator.mediaDevices.getUserMedia({
  audio: {
    deviceId: deviceId ? { exact: deviceId } : undefined
  }
});
screenStream.addTrack(micStream.getAudioTracks()[0]);
```

## 多设备支持

### 当前实现
- ✅ 1 个发送端
- ✅ 1 个信令服务器（嵌入发送端）
- ✅ 多个接收端（理论无限制，建议≤10）
- ✅ 每个接收端独立的 P2P 连接

### 未来扩展
- ⬜ 多发送端（多房间）
- ⬜ 接收端之间的 P2P Mesh
- ⬜ SFU/MCU 架构
- ⬜ 端到端加密

## 安全性说明

⚠️ **警告**: 当前实现使用未加密的 HTTP 传输

### 风险
1. 信令消息明文传输
2. 媒体流未加密（DTLS 保护 WebRTC 流量）
3. 无身份验证机制
4. 易受中间人攻击

### 建议
- 仅在受信任的局域网使用
- 生产环境应使用 HTTPS + WSS
- 添加房间密码验证
- 实现端到端加密

## 使用方法

### 启动发送端
```bash
npm start
```

### 加入接收端
1. 打开浏览器访问显示的房间地址
2. 输入房间号（8 位）
3. 点击"加入房间"

### 停止共享
- 发送端点击"停止共享"
- 或直接关闭窗口

## 故障排查

### 连接失败
1. 检查防火墙是否开放端口
2. 确认 IP 地址正确（非 169.254.x.x）
3. 检查 STUN 服务器可达性

### 无媒体流
1. 确认已授予屏幕录制权限
2. 检查源是否被其他程序占用
3. 查看浏览器控制台错误

### NAT 穿透失败
1. 检查是否需要 TURN 服务器
2. 尝试在同一局域网内测试
3. 查看 ICE 连接状态

## 性能优化

### 发送端
- 限制帧率（15-30 FPS）
- 调整分辨率
- 使用硬件编码（未来）

### 接收端
- 自适应码率
- 动态调整视频质量
- 懒加载视频流

### 网络
- ICE 候选 trickle
- 连接复用
- 心跳检测

## 文件结构
```
SyncSight/
├── src/
│   ├── main/
│   │   ├── main.js           # Electron 主进程
│   │   ├── preload.js        # 预加载脚本
│   │   └── p2p-server.js     # P2P 信令服务器
│   └── renderer/
│       ├── index.html        # 发送端 UI
│       └── renderer.js       # 发送端逻辑
├── package.json
└── electron-builder.yml
```

## 依赖
- Electron: ^37.3.0
- Socket.IO: ^4.5.1
- Express: ^4.18.2
- MDUI: ^2.0.0

## 许可证
GPL-3.0-or-later
