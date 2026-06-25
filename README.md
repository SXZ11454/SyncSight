# SyncSight

[English](./README_EN.md) | 简体中文

SyncSight 是一个基于 WebRTC 和 Electron 的实时屏幕共享应用，支持星型 (P2P) 和网状 (BT) 两种转发模式。

## 功能特性

- 🖥️ **屏幕/窗口共享** — 支持共享整个屏幕或单个应用程序窗口
- 📹 **摄像头预览** — 独立无边框窗口，右上角置顶，支持按比例调整大小
- 🎤 **音频捕获** — 支持系统声音和麦克风输入
- 🔌 **多客户端连接** — 支持多个接收端同时观看
- 🛰️ **星型模式 (P2P)** — 主机直接向每个客户端发送流
- 🌐 **网状模式 (BT)** — 客户端接收流后自动中继给新客户端，减轻主机带宽压力
- 🎨 **Material Design 3** — 基于 MDUI 3 的现代化界面
- 🌓 **深色模式** — 支持深色/浅色主题切换
- 🌍 **国际化 (i18n)** — 支持中文/英文，可自动跟随系统语言
- 🔧 **浮动工具栏** — 共享时悬浮控制麦克风、摄像头、系统声音等
- 📐 **可调整布局** — 支持拖拽分隔条调整预览区大小

## 技术栈

- **Electron** — 跨平台桌面应用框架
- **WebRTC** — 实时音视频通信
- **Socket.IO** — 信令服务器
- **MDUI 3** — Material Design 组件库

## 快速开始

### 环境要求
- Node.js >= 18.x
- npm >= 9.x

### 安装与运行
```bash
npm install
npm start
```

### 构建
```bash
npm run build    # 构建未打包
npm run dist     # 构建 NSIS 安装程序
```

## 使用说明

### 发送端 (Host)
1. 选择要共享的屏幕或窗口
2. 配置共享选项（系统声音、摄像头、麦克风）
3. 选择转发模式（星型/网状）
4. 点击「开始共享」
5. 将服务器地址分享给接收端

### 接收端 (Receiver)
1. 在浏览器中打开发送端提供的地址
2. 自动连接并观看视频流
3. 双击画面可全屏观看

### 浮动工具栏
共享开始后，屏幕底部悬浮显示工具栏，可快速切换：
- 麦克风开关
- 共享画面开关
- 摄像头开关
- 系统声音开关
- 停止共享

## 项目结构

```
SyncSight/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── main.js             # 主进程入口 & 窗口管理
│   │   ├── p2p-server.js       # 信令服务器
│   │   ├── config.js           # 便携配置管理
│   │   ├── preload.js          # 主窗口预加载脚本
│   │   ├── preload-camera.js   # 摄像头窗口预加载脚本
│   │   └── preload-toolbar.js  # 工具栏预加载脚本
│   ├── renderer/               # 渲染进程 (前端)
│   │   ├── index.html          # 主界面
│   │   ├── receiver.html       # 接收端界面
│   │   ├── toolbar.html        # 浮动工具栏
│   │   ├── camera-preview.html # 摄像头预览窗口
│   │   ├── assets/             # 静态资源 (CSS, JS, 图标)
│   │   ├── js/                 # 前端 JavaScript 模块
│   │   │   ├── i18n.js         # 国际化模块
│   │   │   ├── state.js        # 全局状态管理
│   │   │   ├── ui.js           # UI 交互逻辑
│   │   │   ├── stream.js       # 媒体流管理
│   │   │   ├── signaling.js    # WebRTC 信令处理
│   │   │   └── toolbar.js      # 工具栏逻辑
│   │   └── i18n/               # 语言文件 (zh.json, en.json)
│   └── assets/                 # 共享资源 (图标等)
├── .github/workflows/          # CI/CD 自动构建发布
├── package.json
└── README.md
```

## 注意事项

- 首次使用需要授予屏幕录制和摄像头/麦克风权限
- 网状模式下，客户端数量越多，延迟可能越高
- 共享中无法切换屏幕/窗口源，需停止共享后重新选择

## 许可证

AGPL-3.0 License
