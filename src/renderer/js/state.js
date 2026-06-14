// ============ 共享状态 ============
const AppState = {
  sources: [],
  screenSources: [],
  windowSources: [],
  cameraSources: [],
  selectedSourceId: null,
  isStreaming: false,
  screenStream: null,
  cameraStream: null,
  micStream: null,
  compositeStream: null,
  peerConnections: new Map(),
  dataChannel: null,
  serverInfo: null,
  currentMode: 'bt',
  cameraWindowOpen: false,
  previewStream: null,
  isResizing: false,
  hasAutoExpanded: false, // 是否已自动展开过（防止重复展开）
  logLevel: 'info', // 'error' | 'warn' | 'info' | 'debug'
  frameRate: 30 // 15 | 30 | 60
};
