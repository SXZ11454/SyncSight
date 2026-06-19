# SyncSight

English | [简体中文](./README.md)

SyncSight is a real-time screen sharing application built with WebRTC and Electron, supporting both Star (P2P) and Mesh (BT) forwarding modes.

## Features

- 🖥️ **Screen/Window Sharing** — Share entire screen or a single application window
- 📹 **Camera Preview** — Independent frameless window, pinned top-right, resizable with aspect ratio
- 🎤 **Audio Capture** — System audio and microphone input supported
- 🔌 **Multi-client** — Multiple receivers can watch simultaneously
- 🛰️ **Star Mode (P2P)** — Host sends stream directly to each client
- 🌐 **Mesh Mode (BT)** — Clients relay stream to new clients, reducing host bandwidth
- 🎨 **Material Design 3** — Modern UI based on MDUI 3
- 🌓 **Dark Mode** — Light/dark theme switching
- 🌍 **Internationalization (i18n)** — Chinese/English with auto system language detection
- 🔧 **Floating Toolbar** — Hovering controls for mic, camera, system audio during sharing
- 📐 **Resizable Layout** — Drag divider to adjust preview area size

## Tech Stack

- **Electron** — Cross-platform desktop framework
- **WebRTC** — Real-time audio/video communication
- **Socket.IO** — Signaling server
- **MDUI 3** — Material Design component library

## Quick Start

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### Install & Run
```bash
npm install
npm start
```

### Build
```bash
npm run build    # Build unpacked
npm run dist     # Build NSIS installer
```

## Usage

### Sender (Host)
1. Select a screen or window to share
2. Configure sharing options (system audio, camera, microphone)
3. Choose forwarding mode (Star/Mesh)
4. Click "Start Sharing"
5. Share the server address with receivers

### Receiver
1. Open the address provided by the sender in a browser
2. Automatically connects and displays the video stream
3. Double-click the video for fullscreen

### Floating Toolbar
After sharing starts, a floating toolbar appears at the bottom of the screen for quick toggling:
- Microphone on/off
- Screen share on/off
- Camera on/off
- System audio on/off
- Stop sharing

## Project Structure

```
SyncSight/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.js             # Main entry & window management
│   │   ├── p2p-server.js       # Signaling server
│   │   ├── config.js           # Portable config management
│   │   ├── preload.js          # Main window preload script
│   │   ├── preload-camera.js   # Camera window preload script
│   │   └── preload-toolbar.js  # Toolbar preload script
│   ├── renderer/               # Renderer process (frontend)
│   │   ├── index.html          # Main interface
│   │   ├── receiver.html       # Receiver interface
│   │   ├── toolbar.html        # Floating toolbar
│   │   ├── camera-preview.html # Camera preview window
│   │   ├── assets/             # Static assets (CSS, JS, icons)
│   │   ├── js/                 # Frontend JavaScript modules
│   │   │   ├── i18n.js         # Internationalization module
│   │   │   ├── state.js        # Global state management
│   │   │   ├── ui.js           # UI interaction logic
│   │   │   ├── stream.js       # Media stream management
│   │   │   ├── signaling.js    # WebRTC signaling
│   │   │   └── toolbar.js      # Toolbar logic
│   │   └── i18n/               # Language files (zh.json, en.json)
│   └── assets/                 # Shared resources (icons, etc.)
├── .github/workflows/          # CI/CD auto build & release
├── package.json
└── README.md
```

## Notes

- Screen recording and camera/microphone permissions are required on first use
- In Mesh mode, higher client counts may increase latency
- Screen/window source cannot be changed during sharing — stop and restart to switch

## License

MIT License
