// ============ UI 模块 ============

// DOM 引用
const UI = {
  screenList: document.getElementById('screenList'),
  windowList: document.getElementById('windowList'),
  shareVideo: document.getElementById('shareVideo'),
  shareAudio: document.getElementById('shareAudio'),
  shareCamera: document.getElementById('shareCamera'),
  shareMic: document.getElementById('shareMic'),
  micSelect: document.getElementById('micSelect'),
  micSelectSection: document.getElementById('micSelectSection'),
  cameraSelect: document.getElementById('cameraSelect'),
  cameraSelectSection: document.getElementById('cameraSelectSection'),
  cameraResolution: document.getElementById('cameraResolution'),
  portInput: document.getElementById('portInput'),
  serverUrl: document.getElementById('serverUrl'),
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  roomIdEl: document.getElementById('roomId'),
  addressRow: document.getElementById('addressRow'),
  roomIdRow: document.getElementById('roomIdRow'),
  copyUrlBtn: document.getElementById('copyUrlBtn'),
  startBtn: document.getElementById('startBtn'),
  stopBtn: document.getElementById('stopBtn'),
  logContainer: document.getElementById('logContainer'),
  refreshBtn: document.getElementById('refreshBtn'),
  modeGroup: document.getElementById('modeGroup'),
  modeDesc: document.getElementById('modeDesc'),
  previewVideo: document.getElementById('previewVideo'),
  previewEmpty: document.getElementById('previewEmpty'),
  previewInfo: document.getElementById('previewInfo'),
  videoStatus: document.getElementById('videoStatus'),
  audioStatus: document.getElementById('audioStatus'),
  cameraStatus: document.getElementById('cameraStatus'),
  micStatus: document.getElementById('micStatus'),
  resizer: document.getElementById('resizer'),
  leftPanel: document.querySelector('.left-panel'),
  rightPanel: document.querySelector('.right-panel'),
  darkModeSwitch: document.getElementById('darkModeSwitch'),
  togglePreviewBtn: document.getElementById('togglePreviewBtn'),
  logLevelSelect: document.getElementById('logLevelSelect'),
  logSection: document.getElementById('logSection'),
  logResizeHandle: document.getElementById('logResizeHandle'),
  frameRateSelect: document.getElementById('frameRateSelect'),
  langSelect: document.getElementById('langSelect'),
  previewVideo: document.getElementById('previewVideo'),
  previewInfo: document.getElementById('previewInfo')
};

// ============ 布局常量 ============
const RIGHT_MIN_WIDTH = 440;
const LEFT_MIN_WIDTH = RIGHT_MIN_WIDTH;

// ============ 配置加载/保存（便携模式） ============
async function loadConfig() {
  try {
    const cfg = await window.electronAPI.configGetAll();

    // 语言
    if (cfg.language) {
      I18n.setLanguage(cfg.language);
      UI.langSelect.value = cfg.language;
    }

    // 深色模式
    if (cfg.darkMode) {
      UI.darkModeSwitch.checked = true;
      UI.darkModeSwitch.dispatchEvent(new Event('change'));
    }

    // 端口
    if (cfg.port) UI.portInput.value = cfg.port;
    UI.portInput.addEventListener('change', () => {
      saveConfig('port', parseInt(UI.portInput.value) || 3000);
    });

    // 转发模式
    if (cfg.mode) {
      UI.modeGroup.value = cfg.mode;
      AppState.currentMode = cfg.mode;
      updateModeUI();
    }

    // 日志级别
    if (cfg.logLevel) {
      UI.logLevelSelect.value = cfg.logLevel;
      setLogLevel(cfg.logLevel, false);
    }

    // 帧率
    if (cfg.frameRate) {
      UI.frameRateSelect.value = cfg.frameRate;
      AppState.frameRate = parseInt(cfg.frameRate);
    }
  } catch (err) {
    console.warn('[CONFIG] Failed to load:', err.message);
  }
}

function saveConfig(key, value) {
  try {
    window.electronAPI.configSet(key, value);
  } catch (err) {
    console.warn('[CONFIG] Failed to save', key + ':', err.message);
  }
}

// ============ 帧率选择 ============
UI.frameRateSelect.addEventListener('change', () => {
  AppState.frameRate = parseInt(UI.frameRateSelect.value);
  if (UI.previewInfo) {
    UI.previewInfo.textContent = I18n.t('preview.videoInfoNoStream', { fps: AppState.frameRate });
  }
  addLog(I18n.t('log.rateSet', { fps: AppState.frameRate }), 'info');
  saveConfig('frameRate', AppState.frameRate);
});

// ============ 复制地址 ============
UI.copyUrlBtn.addEventListener('click', () => {
  const url = UI.serverUrl.textContent;
  if (url) {
    navigator.clipboard.writeText(url).then(() => {
      addLog(I18n.t('server.copied'), 'success');
    }).catch(() => {
      addLog(I18n.t('server.copyFailed'), 'error');
    });
  }
});

// ============ 分隔条拖拽 ============
UI.resizer.addEventListener('mousedown', (e) => {
  AppState.isResizing = true;
  UI.resizer.classList.add('active');
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!AppState.isResizing) return;
  const layout = document.querySelector('.main-layout');
  const rect = layout.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const resizerW = UI.resizer.offsetWidth;
  const totalW = rect.width;
  const maxLeft = totalW - RIGHT_MIN_WIDTH - resizerW;

  const leftWidth = Math.min(Math.max(offsetX, LEFT_MIN_WIDTH), maxLeft);

  // 左栏设为固定宽度，右栏保持 440px
  UI.leftPanel.style.flex = 'none';
  UI.leftPanel.style.width = leftWidth + 'px';
  UI.rightPanel.style.flex = 'none';
  UI.rightPanel.style.width = '';
});

document.addEventListener('mouseup', () => {
  if (!AppState.isResizing) return;
  AppState.isResizing = false;
  UI.resizer.classList.remove('active');
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  // 拖拽结束后：左栏恢复 flex:1 自动撑满，右栏保持 440px
  UI.leftPanel.style.flex = '1';
  UI.leftPanel.style.width = '';
  UI.rightPanel.style.flex = 'none';
  UI.rightPanel.style.width = '';
});

// ============ 收起/展开预览按钮 ============
UI.togglePreviewBtn.addEventListener('click', () => {
  if (UI.leftPanel.style.display === 'none' || UI.leftPanel.style.display === '') {
    animatePreviewExpand();
  } else {
    animatePreviewCollapse();
  }
});

// ============ 预览区动画（与窗口劈裂同步） ============
function animatePreviewExpand() {
  const panel = UI.leftPanel;
  const resizer = UI.resizer;

  panel.style.display = 'flex';
  panel.style.overflow = 'hidden';
  panel.style.opacity = '0';
  panel.style.flex = '1';
  panel.style.width = '';
  resizer.style.display = 'block';

  // 右栏始终 440px
  UI.rightPanel.style.flex = 'none';
  UI.rightPanel.style.width = '';
  UI.rightPanel.style.minWidth = '';

  UI.togglePreviewBtn.setAttribute('icon', 'chevron_right');
    UI.togglePreviewBtn.setAttribute('title', I18n.t('action.collapsePreview'));

  requestAnimationFrame(() => {
    panel.style.transition = 'opacity 0.3s ease';
    panel.style.opacity = '1';

    setTimeout(() => {
      panel.style.transition = '';
      panel.style.overflow = '';
    }, 320);
  });

  window.electronAPI.resizeToExpanded();
}

function animatePreviewCollapse(callback) {
  const panel = UI.leftPanel;
  const resizer = UI.resizer;

  panel.style.transition = 'opacity 0.2s ease';
  panel.style.overflow = 'hidden';
  panel.style.opacity = '0';
  resizer.style.display = 'none';

  UI.togglePreviewBtn.setAttribute('icon', 'chevron_left');
    UI.togglePreviewBtn.setAttribute('title', I18n.t('action.expandPreview'));

  window.electronAPI.resizeToCompact().then(() => {
    panel.style.transition = '';
    panel.style.display = 'none';
    if (callback) callback();
  });
}

function updateModeUI() {
  const mode = UI.modeGroup.value || AppState.currentMode;
  if (mode === 'star') {
    UI.modeDesc.textContent = I18n.t('mode.starDesc');
  } else {
    UI.modeDesc.textContent = I18n.t('mode.btDesc');
  }
}

// ============ 模式切换（mdui-segmented-button-group） ============
UI.modeGroup.addEventListener('change', () => {
  const mode = UI.modeGroup.value;
  AppState.currentMode = mode;
  if (mode === 'star') {
    UI.modeDesc.textContent = I18n.t('mode.starDesc');
  } else {
    UI.modeDesc.textContent = I18n.t('mode.btDesc');
  }
  if (AppState.isStreaming) {
    window.electronAPI.setRoomMode(mode);
    addLog(I18n.t('log.switchedTo', { mode: mode === 'bt' ? I18n.t('mode.modeBT') : I18n.t('mode.modeStar') }), 'info');
  }
  saveConfig('mode', mode);
});

// ============ 语言切换 ============
UI.langSelect.addEventListener('change', () => {
  I18n.setLanguage(UI.langSelect.value);
  saveConfig('language', UI.langSelect.value);
});

// Re-render dynamic text on language change
I18n.onChange(() => {
  updateStreamStatuses();
  updatePreview();
  updateModeUI();
});

// ============ 主题切换 ============
UI.darkModeSwitch.addEventListener('change', () => {
  const isDark = UI.darkModeSwitch.checked;
  document.body.classList.toggle('mdui-theme-dark', isDark);
  document.body.classList.toggle('mdui-theme-light', !isDark);
  if (isDark) {
    document.documentElement.style.setProperty('--md-sys-color-surface', '#1c1b1f');
    document.documentElement.style.setProperty('--md-sys-color-surface-container', '#211f26');
    document.documentElement.style.setProperty('--md-sys-color-surface-container-low', '#1d1b20');
    document.documentElement.style.setProperty('--md-sys-color-surface-container-high', '#2b2930');
    document.documentElement.style.setProperty('--md-sys-color-on-surface', '#e6e0e9');
    document.documentElement.style.setProperty('--md-sys-color-on-surface-variant', '#cac4d0');
    document.documentElement.style.setProperty('--md-sys-color-outline-variant', '#49454f');
  } else {
    document.documentElement.style.removeProperty('--md-sys-color-surface');
    document.documentElement.style.removeProperty('--md-sys-color-surface-container');
    document.documentElement.style.removeProperty('--md-sys-color-surface-container-low');
    document.documentElement.style.removeProperty('--md-sys-color-surface-container-high');
    document.documentElement.style.removeProperty('--md-sys-color-on-surface');
    document.documentElement.style.removeProperty('--md-sys-color-on-surface-variant');
    document.documentElement.style.removeProperty('--md-sys-color-outline-variant');
  }
  saveConfig('darkMode', isDark);
});

// ============ 日志等级选择 ============
UI.logLevelSelect.addEventListener('change', () => {
  setLogLevel(UI.logLevelSelect.value);
});

// ============ 日志区拖拽调整大小 ============
const LOG_MIN_HEIGHT = 80;
let logResizing = false;
let logResizeStartY = 0;
let logResizeStartHeight = 0;

UI.logResizeHandle.addEventListener('mousedown', (e) => {
  e.preventDefault();
  logResizing = true;
  logResizeStartY = e.clientY;
  logResizeStartHeight = UI.logSection.offsetHeight;
  UI.logResizeHandle.classList.add('active');
  document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', (e) => {
  if (!logResizing) return;
  const delta = logResizeStartY - e.clientY;
  const newHeight = Math.max(LOG_MIN_HEIGHT, logResizeStartHeight + delta);
  UI.logSection.style.height = Math.min(newHeight, window.innerHeight * 0.8) + 'px';
});

document.addEventListener('mouseup', () => {
  if (logResizing) {
    logResizing = false;
    UI.logResizeHandle.classList.remove('active');
    document.body.style.userSelect = '';
  }
});

// ============ 日志 ============
const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

function addLog(message, level = 'info') {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', { hour12: false }) + '.' + String(now.getMilliseconds()).padStart(3, '0');
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.dataset.level = level;
  entry.innerHTML = `<span class="log-time">${timeStr}</span><span class="log-level-${level}">[${level.toUpperCase()}]</span><span class="log-message">${String(message)}</span>`;

  // 根据当前日志等级决定是否显示
  const currentLevel = LOG_LEVELS[AppState.logLevel] ?? LOG_LEVELS.info;
  const entryLevel = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  entry.style.display = entryLevel <= currentLevel ? '' : 'none';

  UI.logContainer.appendChild(entry);
  UI.logContainer.scrollTop = UI.logContainer.scrollHeight;
  const entries = UI.logContainer.querySelectorAll('.log-entry');
  if (entries.length > 200) entries[0].remove();
}

function setLogLevel(level, save = true) {
  AppState.logLevel = level;
  const currentLevel = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  UI.logContainer.querySelectorAll('.log-entry').forEach(entry => {
    const entryLevel = LOG_LEVELS[entry.dataset.level] ?? LOG_LEVELS.info;
    entry.style.display = entryLevel <= currentLevel ? '' : 'none';
  });
  if (save) saveConfig('logLevel', level);
}

const originalConsoleLog = console.log;
console.log = function(...args) { originalConsoleLog.apply(console, args); addLog(args.join(' '), 'info'); };
const originalConsoleError = console.error;
console.error = function(...args) { originalConsoleError.apply(console, args); addLog(args.join(' '), 'error'); };
const originalConsoleWarn = console.warn;
console.warn = function(...args) { originalConsoleWarn.apply(console, args); addLog(args.join(' '), 'warn'); };

// ============ 流状态标签 ============
function updateStreamStatuses() {
  const cs = AppState.compositeStream;
  const hasVideo = cs && cs.getVideoTracks().some(t => t.readyState === 'live');
  const hasAudio = cs && cs.getAudioTracks().some(t => t.readyState === 'live');
  const hasCamera = AppState.cameraStream && AppState.cameraStream.getVideoTracks().some(t => t.readyState === 'live');
  const hasMic = AppState.micStream && AppState.micStream.getAudioTracks().some(t => t.readyState === 'live');

  setStreamBadge(UI.videoStatus, hasVideo);
  setStreamBadge(UI.audioStatus, hasAudio);
  setStreamBadge(UI.cameraStatus, hasCamera);
  setStreamBadge(UI.micStatus, hasMic);
}

function setStreamBadge(el, active) {
  el.className = active ? 'stream-status' : 'stream-status off';
  el.innerHTML = `<span class="dot"></span>${active ? I18n.t('options.running') : I18n.t('options.notStarted')}`;
}

// ============ 预览 ============
function updatePreview() {
  const cs = AppState.compositeStream;
  const ps = AppState.previewStream;

  if (cs && cs.getVideoTracks().some(t => t.readyState === 'live')) {
    if (UI.previewVideo.srcObject !== cs) UI.previewVideo.srcObject = cs;
    UI.previewVideo.style.display = 'block';
    UI.previewEmpty.style.display = 'none';
    const tracks = cs.getTracks();
    const vTracks = tracks.filter(t => t.kind === 'video' && t.readyState === 'live').length;
    const aTracks = tracks.filter(t => t.kind === 'audio' && t.readyState === 'live').length;
    UI.previewInfo.textContent = I18n.t('preview.videoInfo', { v: vTracks, a: aTracks, fps: AppState.frameRate });
  } else if (ps && ps.getVideoTracks().some(t => t.readyState === 'live')) {
    if (UI.previewVideo.srcObject !== ps) UI.previewVideo.srcObject = ps;
    UI.previewVideo.style.display = 'block';
    UI.previewEmpty.style.display = 'none';
    UI.previewInfo.textContent = I18n.t('preview.previewing') + ` | ${AppState.frameRate} fps`;
  } else {
    UI.previewVideo.style.display = 'none';
    UI.previewEmpty.style.display = 'block';
    UI.previewInfo.textContent = I18n.t('preview.notShared') + ` | ${AppState.frameRate} fps`;
  }
  updateStreamStatuses();
}

// ============ 源列表渲染 ============
function renderSourceList(container, list) {
  if (list.length === 0) {
    container.innerHTML = '<div class="empty-state"><p style="color:var(--md-sys-color-on-surface-variant);font-size:12px;">' + I18n.t('source.noneFound') + '</p></div>';
    return;
  }
  container.innerHTML = '';
  list.forEach((source, index) => {
    const item = document.createElement('div');
    item.className = 'source-item' + (AppState.isStreaming ? ' disabled' : '');
    item.dataset.sourceId = source.id;
    const displayName = source.name.length > 18 ? source.name.substring(0, 18) + '...' : source.name;
    item.innerHTML = `
      <img src="${source.thumbnail}" alt="${source.name}">
      <div class="name-row">
        <mdui-radio name="source" value="${source.id}"></mdui-radio>
        <div class="name" title="${source.name}">${displayName}</div>
      </div>
    `;
    item.addEventListener('click', () => selectSource(source.id, item));
    container.appendChild(item);
    if (index === 0 && !AppState.selectedSourceId) selectSource(source.id, item);
  });
}

function selectSource(sourceId, element) {
  if (AppState.isStreaming) return;
  document.querySelectorAll('.source-item').forEach(item => {
    item.classList.remove('selected');
    const r = item.querySelector('mdui-radio');
    if (r) r.checked = false;
  });
  element.classList.add('selected');
  const r = element.querySelector('mdui-radio');
  if (r) r.checked = true;
  AppState.selectedSourceId = sourceId;
  UI.startBtn.disabled = false;
  addLog(I18n.t('source.selected', { id: sourceId }), 'info');

  if (!AppState.isStreaming) {
    StreamManager.updatePreviewForSource(sourceId);
  }
}

// ============ Switch 联动 ============
UI.shareCamera.addEventListener('change', () => {
  const checked = UI.shareCamera.checked;
  UI.cameraSelectSection.style.display = checked ? 'block' : 'none';
  if (checked) {
    // 开启摄像头 → 启动流 + 打开窗口
    StreamManager.openCameraWindow();
  } else {
    // 关闭摄像头 → 停止流 + 关闭窗口
    StreamManager.stopCameraStream();
    StreamManager.closeCameraWindow();
  }
  if (AppState.isStreaming) StreamManager.toggleCameraInComposite();
});

UI.shareMic.addEventListener('change', () => {
  const checked = UI.shareMic.checked;
  UI.micSelectSection.style.display = checked ? 'block' : 'none';
  if (!checked) StreamManager.stopMicStream();
  if (AppState.isStreaming) StreamManager.toggleMicInComposite();
});

UI.shareAudio.addEventListener('change', () => {
  if (AppState.isStreaming) StreamManager.rebuildCompositeStream();
});

UI.shareVideo.addEventListener('change', () => {
  if (AppState.isStreaming) StreamManager.rebuildCompositeStream();
});
