# SyncSight

SyncSight is a real-time screen sharing application built with WebRTC and Electron, supporting both Star (P2P) and Mesh (BT) forwarding modes.

## Features

### Core Features
- 🖥️ **Screen/Window Sharing** - Share entire screen or individual application windows
- 📹 **Camera Preview Window** - Independent borderless camera window with aspect ratio preservation and always-on-top display
- 🎤 **Audio Capture** - Support for system audio and microphone input
- 🔌 **Multi-Client Connection** - Multiple clients can receive streams simultaneously

### Network Modes
- **Star Mode (P2P)** - Host sends stream directly to each client, ideal for small number of clients
- **Mesh Mode (BT)** - Clients relay streams to new clients after receiving, reducing host bandwidth pressure

### Interface Features
- 🎨 **Material Design 3** - Modern interface based on MDUI 3
- 🌓 **Dark Mode** - Support for dark/light theme switching
- 📐 **Adjustable Layout** - Draggable divider to adjust preview area size
- ✨ **Smooth Animations** - Split animation effects for window expand/collapse

## Tech Stack

- **Electron** - Cross-platform desktop application framework
- **WebRTC** - Real-time audio/video communication
- **Socket.IO** - Signaling server
- **MDUI 3** - Material Design component library

## Development Guide

### Requirements
- Node.js >= 18.x
- npm >= 9.x

### Install Dependencies
```bash
npm install
```

### Start Development
```bash
npm start
```

### Build Application
```bash
npm run build
```

## Usage Instructions

### Sender (Host)
1. Select the screen or window to share
2. Configure sharing options (system audio, camera, microphone)
3. Choose forwarding mode (Star/Mesh)
4. Click "Start Sharing"
5. Share the server address with receivers

### Receiver
1. Open the receiver page
2. Enter the server address provided by the sender
3. Automatically connect and watch the video stream

## Camera Window

- Independent preview window automatically pops up when camera is enabled
- Window stays on top and supports drag-to-move
- Automatically maintains camera resolution aspect ratio when resizing
- Close window via camera toggle or window close button

## Notes

- Screen recording and camera/microphone permissions are required for first-time use
- In mesh mode, latency may increase with more clients
- Cannot switch screen/window source during sharing; stop sharing and reselect if needed

## License

MIT License
