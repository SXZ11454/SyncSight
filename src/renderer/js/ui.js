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
  previewInfo: document.getElementById('previewInfo'),
  floatingToolbarSwitch: document.getElementById('floatingToolbarSwitch'),
  // 访问控制
  accessModeGroup: document.getElementById('accessModeGroup'),
  inviteSettings: document.getElementById('inviteSettings'),
  inviteCountSlider: document.getElementById('inviteCountSlider'),
  inviteCountLabel: document.getElementById('inviteCountLabel'),
  inviteLinksContainer: document.getElementById('inviteLinksContainer'),
  passwordSettings: document.getElementById('passwordSettings'),
  accessPasswordField: document.getElementById('accessPasswordField'),
  approvalSettings: document.getElementById('approvalSettings'),
  approvalList: document.getElementById('approvalList'),
  approvalEmpty: document.getElementById('approvalEmpty')
};

// ============ 布局常量 ============
const LEFT_PANEL_WIDTH = 520;
const RIGHT_PANEL_WIDTH = 440;
const RESIZER_WIDTH = 10;
const RIGHT_CONTENT_WIDTH = RIGHT_PANEL_WIDTH - RESIZER_WIDTH; // 右栏内容区 = 右栏总宽 - 分隔条
const LEFT_MIN_WIDTH = 400;

// ============ 配置加载/保存（便携模式） ============
async function loadConfig() {
  try {
    const cfg = await window.electronAPI.configGetAll();

    // 语言
    if (cfg.language) {
      I18n.setLanguage(cfg.language);
      UI.langSelect.value = cfg.language;
      if (window.updateLangAutoLabel) window.updateLangAutoLabel();
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

    // 浮动工具栏
    if (cfg.floatingToolbar !== undefined) {
      UI.floatingToolbarSwitch.checked = cfg.floatingToolbar;
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
let rightPanelUserWidth = RIGHT_PANEL_WIDTH; // 用户自定义的右栏宽度
const RIGHT_MIN_WIDTH = RIGHT_PANEL_WIDTH;   // 右栏最小宽度

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
  const totalW = rect.width;

  // 左栏宽度 = 鼠标位置，但受双边最小宽度限制
  const leftWidth = Math.min(Math.max(offsetX, LEFT_MIN_WIDTH), totalW - RIGHT_MIN_WIDTH);
  const rightWidth = totalW - leftWidth;

  UI.leftPanel.style.flex = 'none';
  UI.leftPanel.style.width = leftWidth + 'px';
  UI.rightPanel.style.flex = 'none';
  UI.rightPanel.style.width = rightWidth + 'px';
  rightPanelUserWidth = rightWidth;
});

document.addEventListener('mouseup', () => {
  if (!AppState.isResizing) return;
  AppState.isResizing = false;
  UI.resizer.classList.remove('active');
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  // 拖拽结束后保持用户设定的宽度
  const layout = document.querySelector('.main-layout');
  UI.leftPanel.style.flex = 'none';
  UI.leftPanel.style.width = (layout.offsetWidth - rightPanelUserWidth) + 'px';
  UI.rightPanel.style.flex = 'none';
  UI.rightPanel.style.width = rightPanelUserWidth + 'px';
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
  panel.style.flex = 'none';
  panel.style.width = '0px';
  resizer.style.display = 'flex';

  // 右栏保持用户设定的宽度
  UI.rightPanel.style.flex = 'none';
  UI.rightPanel.style.width = rightPanelUserWidth + 'px';
  UI.rightPanel.style.minWidth = RIGHT_PANEL_WIDTH + 'px';

  // 展开后按钮图标改为向右折叠
  UI.togglePreviewBtn.setAttribute('icon', 'chevron_right');
  UI.togglePreviewBtn.setAttribute('title', I18n.t('action.collapsePreview'));

  // 左栏宽度动画：0 -> LEFT_PANEL_WIDTH
  const targetWidth = LEFT_PANEL_WIDTH;
  const duration = 350;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentWidth = Math.round(targetWidth * eased);
    panel.style.width = currentWidth + 'px';
    panel.style.opacity = Math.min(eased * 1.5, 1);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      panel.style.overflow = '';
    }
  }
  requestAnimationFrame(step);

  window.electronAPI.resizeToExpanded();
}

function animatePreviewCollapse(callback) {
  const panel = UI.leftPanel;
  const resizer = UI.resizer;

  panel.style.overflow = 'hidden';
  resizer.style.display = 'none';

  // 折叠后按钮图标改为向左展开
  UI.togglePreviewBtn.setAttribute('icon', 'chevron_left');
  UI.togglePreviewBtn.setAttribute('title', I18n.t('action.expandPreview'));

  // 左栏宽度动画：当前宽度 -> 0
  const startWidth = panel.offsetWidth;
  const duration = 350;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const currentWidth = Math.round(startWidth * (1 - eased));
    panel.style.width = currentWidth + 'px';
    panel.style.opacity = 1 - eased;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      panel.style.display = 'none';
      panel.style.width = '';
      panel.style.opacity = '';
      panel.style.overflow = '';
      // 折叠后右栏自适应窗口宽度，取消最小宽度限制
      UI.rightPanel.style.flex = '1';
      UI.rightPanel.style.width = '';
      UI.rightPanel.style.minWidth = '';
      if (callback) callback();
    }
  }
  requestAnimationFrame(step);

  window.electronAPI.resizeToCompact();
}

// ============ 窗口大小变化时自适应 ============
// 展开状态：横向调整优先影响左栏，右栏保持用户设定宽度
// 折叠状态：只调节右栏（左栏隐藏）
window.addEventListener('resize', () => {
  const isLeftVisible = UI.leftPanel.style.display !== 'none' && UI.leftPanel.style.display !== '';
  if (isLeftVisible) {
    const layout = document.querySelector('.main-layout');
    const totalW = layout.offsetWidth;
    // 双边最小宽度约束
    const leftWidth = Math.min(Math.max(totalW - rightPanelUserWidth, LEFT_MIN_WIDTH), totalW - RIGHT_MIN_WIDTH);
    const rightWidth = totalW - leftWidth;

    UI.leftPanel.style.flex = 'none';
    UI.leftPanel.style.width = leftWidth + 'px';
    UI.rightPanel.style.flex = 'none';
    UI.rightPanel.style.width = rightWidth + 'px';
    UI.rightPanel.style.minWidth = RIGHT_MIN_WIDTH + 'px';
    rightPanelUserWidth = rightWidth;
  } else {
    // 折叠状态：右栏自适应填满窗口
    UI.rightPanel.style.flex = '1';
    UI.rightPanel.style.width = '';
    UI.rightPanel.style.minWidth = '';
  }
});

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

// ============ 访问控制 ============
let inviteLinks = [];
let pendingApprovals = new Map();

async function loadAccessConfig() {
  try {
    const cfg = await window.electronAPI.configGetAll();
    if (cfg.accessMode) UI.accessModeGroup.value = cfg.accessMode;
    if (cfg.accessPassword) UI.accessPasswordField.value = cfg.accessPassword;
    if (cfg.inviteCount) {
      UI.inviteCountSlider.value = cfg.inviteCount;
      UI.inviteCountLabel.textContent = cfg.inviteCount;
    }
    updateAccessModeUI();
  } catch (err) {
    console.warn('[ACCESS] Failed to load config:', err.message);
  }
}

function updateAccessModeUI() {
  const mode = UI.accessModeGroup.value;
  UI.inviteSettings.style.display = mode === 'invite' ? '' : 'none';
  UI.passwordSettings.style.display = mode === 'password' ? '' : 'none';
  UI.approvalSettings.style.display = mode === 'approval' ? '' : 'none';
}

UI.accessModeGroup.addEventListener('change', () => {
  const mode = UI.accessModeGroup.value;
  saveConfig('accessMode', mode);
  updateAccessModeUI();
  if (mode === 'invite' && inviteLinks.length === 0) generateInviteLinks();
  if (AppState.isStreaming) window.electronAPI.setAccessMode(mode);
  addLog(I18n.t('log.accessModeChanged', { mode: I18n.t(`access.${mode}`) }), 'info');
});

UI.inviteCountSlider.addEventListener('input', () => {
  UI.inviteCountLabel.textContent = UI.inviteCountSlider.value;
});

UI.inviteCountSlider.addEventListener('change', () => {
  saveConfig('inviteCount', parseInt(UI.inviteCountSlider.value));
  generateInviteLinks();
});

function generateInviteLinks() {
  const count = parseInt(UI.inviteCountSlider.value) || 5;
  const roomId = AppState.roomId || '';
  // 优先使用服务器返回的真实 IP，其次使用端口输入框的值
  const address = (AppState.serverInfo && AppState.serverInfo.address) || 'localhost';
  const port = (AppState.serverInfo && AppState.serverInfo.port) || parseInt(UI.portInput.value) || 3000;
  const baseUrl = `http://${address}:${port}`;
  inviteLinks = [];
  for (let i = 0; i < count; i++) {
    const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2) + Date.now().toString(36);
    inviteLinks.push({ token, url: `${baseUrl}/room/${roomId}?token=${token}`, used: false });
  }
  renderInviteLinks();
}

function renderInviteLinks() {
  const container = UI.inviteLinksContainer;
  const count = inviteLinks.length;
  const shouldCollapse = count > 5;
  const disabled = !AppState.isStreaming;
  let html = '';
  inviteLinks.forEach((link, i) => {
    html += `<div class="invite-link-item" data-index="${i}">
      <span class="link-text">${link.url}</span>
      <mdui-button variant="text" size="small" data-copy-index="${i}" icon="content_copy" data-i18n="access.copyLink"${disabled ? ' disabled' : ''}>${I18n.t('access.copyLink')}</mdui-button>
    </div>`;
  });
  if (shouldCollapse) {
    container.innerHTML = `<div class="invite-links-collapsed" id="inviteLinksList">${html}</div>
      <mdui-button variant="text" id="expandLinksBtn" style="width:100%;margin-top:4px;">${I18n.t('access.showAll', { count })}</mdui-button>`;
    const expandBtn = document.getElementById('expandLinksBtn');
    if (expandBtn) expandBtn.addEventListener('click', expandInviteLinks);
  } else {
    container.innerHTML = `<div id="inviteLinksList">${html}</div>`;
  }
}

// 更新复制按钮状态
function updateCopyButtonsState() {
  const disabled = !AppState.isStreaming;
  document.querySelectorAll('mdui-button[data-copy-index]').forEach(btn => {
    if (disabled) {
      btn.setAttribute('disabled', '');
    } else {
      btn.removeAttribute('disabled');
    }
  });
}

// 事件委托：处理复制按钮点击
UI.inviteLinksContainer.addEventListener('click', (e) => {
  const btn = e.target.closest('mdui-button[data-copy-index]');
  if (btn) {
    e.stopPropagation();
    const index = parseInt(btn.getAttribute('data-copy-index'));
    copyInviteLink(index);
  }
});

function showCopyToast(success, index) {
  const msg = success ? I18n.t('access.linkCopied', { n: index + 1 }) : I18n.t('access.copyFailed');
  // 使用 MDUI snackbar
  if (typeof mdui !== 'undefined' && mdui.snackbar) {
    mdui.snackbar({
      message: msg,
      placement: 'bottom',
      duration: 1500
    });
  }
}

window.copyInviteLink = function(index) {
  const link = inviteLinks[index];
  if (link) {
    window.electronAPI.copyToClipboard(link.url).then(() => {
      addLog(I18n.t('access.linkCopied', { n: index + 1 }), 'success');
      showCopyToast(true, index);
    }).catch(() => {
      addLog(I18n.t('access.copyFailed'), 'error');
      showCopyToast(false, index);
    });
  }
};

window.expandInviteLinks = function() {
  const list = document.getElementById('inviteLinksList');
  if (list) list.classList.remove('invite-links-collapsed');
  const btn = list?.parentElement?.querySelector('mdui-button');
  if (btn) btn.style.display = 'none';
};

UI.accessPasswordField.addEventListener('change', () => {
  saveConfig('accessPassword', UI.accessPasswordField.value);
  if (AppState.isStreaming) window.electronAPI.setAccessPassword(UI.accessPasswordField.value);
  addLog(I18n.t('log.passwordSet'), 'info');
});

window.electronAPI.onApprovalRequest((data) => {
  pendingApprovals.set(data.socketId, data);
  renderApprovalList();
  addLog(I18n.t('log.approvalRequest', { name: data.username }), 'info');
});

function renderApprovalList() {
  const list = UI.approvalList;
  const empty = UI.approvalEmpty;
  if (pendingApprovals.size === 0) {
    list.innerHTML = '';
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';
  let html = '';
  pendingApprovals.forEach((data, socketId) => {
    html += `<div class="approval-item" data-socket-id="${socketId}">
      <div class="user-info">
        <div class="user-name">${data.username}</div>
        <div class="user-ip">${data.ip}</div>
      </div>
      <div class="approval-actions">
        <button class="approval-btn approve-btn" data-action="approve" data-socket-id="${socketId}">
          <i class="material-icons">check</i>
        </button>
        <button class="approval-btn reject-btn" data-action="reject" data-socket-id="${socketId}">
          <i class="material-icons">close</i>
        </button>
      </div>
    </div>`;
  });
  list.innerHTML = html;
}

// 事件委托：处理审批按钮点击
UI.approvalList.addEventListener('click', (e) => {
  const btn = e.target.closest('.approval-btn');
  if (!btn) return;
  const socketId = btn.getAttribute('data-socket-id');
  const action = btn.getAttribute('data-action');
  if (action === 'approve') {
    window.electronAPI.approveAccess(socketId);
    pendingApprovals.delete(socketId);
    renderApprovalList();
    addLog(I18n.t('log.approvalApproved', { id: socketId.slice(0, 6) }), 'success');
  } else if (action === 'reject') {
    window.electronAPI.rejectAccess(socketId);
    pendingApprovals.delete(socketId);
    renderApprovalList();
    addLog(I18n.t('log.approvalRejected', { id: socketId.slice(0, 6) }), 'warn');
  }
});

// ============ 语言切换 ============
UI.langSelect.addEventListener('change', () => {
  I18n.setLanguage(UI.langSelect.value);
  saveConfig('language', UI.langSelect.value);
  if (window.updateLangAutoLabel) window.updateLangAutoLabel();
});

// Re-render dynamic text on language change
I18n.onChange(() => {
  updateStreamStatuses();
  updatePreview();
  updateModeUI();
  // 更新展开/折叠按钮提示
  const isLeftVisible = UI.leftPanel.style.display !== 'none' && UI.leftPanel.style.display !== '';
  UI.togglePreviewBtn.setAttribute('title', I18n.t(isLeftVisible ? 'action.collapsePreview' : 'action.expandPreview'));
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

// ============ 浮动工具栏开关 ============
UI.floatingToolbarSwitch.addEventListener('change', () => {
  const enabled = UI.floatingToolbarSwitch.checked;
  saveConfig('floatingToolbar', enabled);

  // 如果正在共享，立即显示/隐藏工具栏
  if (AppState.isStreaming) {
    if (enabled) {
      window.electronAPI.showToolbar();
    } else {
      window.electronAPI.hideToolbar();
    }
  }

  addLog(I18n.t(enabled ? 'log.toolbarEnabled' : 'log.toolbarDisabled'), 'info');
});

// 工具栏窗口关闭时同步开关状态
window.electronAPI.onToolbarClosed(() => {
  if (UI.floatingToolbarSwitch.checked) {
    UI.floatingToolbarSwitch.checked = false;
    saveConfig('floatingToolbar', false);
  }
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

// 日志区右键菜单（使用mdui-dropdown）
const logDropdown = document.getElementById('logDropdown');
const ctxCopy = document.getElementById('ctxCopy');
const ctxSelectAll = document.getElementById('ctxSelectAll');

// 监听dropdown打开事件，根据是否有选中文本控制复制按钮显示
logDropdown.addEventListener('open', (e) => {
  const selection = window.getSelection();
  const hasSelection = selection.toString().length > 0;
  ctxCopy.style.display = hasSelection ? '' : 'none';
});

// 复制菜单项点击
ctxCopy.addEventListener('click', () => {
  const selection = window.getSelection();
  const selectedText = selection.toString();
  if (selectedText) {
    window.electronAPI.copyToClipboard(selectedText);
    addLog(I18n.t('log.copied'), 'info');
  }
});

// 全选菜单项点击
ctxSelectAll.addEventListener('click', () => {
  const range = document.createRange();
  range.selectNodeContents(UI.logContainer);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
});

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

// ============ 共享浮动工具栏（独立窗口，通过IPC通信） ============
const ToolbarBridge = {

  // 将当前开关状态同步到工具栏窗口
  syncState() {
    window.electronAPI.syncToolbarState({
      mic: UI.shareMic.checked,
      video: UI.shareVideo.checked,
      camera: UI.shareCamera.checked,
      audio: UI.shareAudio.checked
    });
  },

  // 接收来自独立工具栏窗口的操作指令
  init() {
    window.electronAPI.onToolbarAction((action) => {
      switch (action) {
        case 'toggle-mic':
          UI.shareMic.checked = !UI.shareMic.checked;
          UI.shareMic.dispatchEvent(new Event('change'));
          break;
        case 'toggle-video':
          UI.shareVideo.checked = !UI.shareVideo.checked;
          UI.shareVideo.dispatchEvent(new Event('change'));
          break;
        case 'toggle-camera':
          UI.shareCamera.checked = !UI.shareCamera.checked;
          UI.shareCamera.dispatchEvent(new Event('change'));
          break;
        case 'toggle-audio':
          UI.shareAudio.checked = !UI.shareAudio.checked;
          UI.shareAudio.dispatchEvent(new Event('change'));
          break;
        case 'stop-sharing':
          SignalingManager.stopSharing();
          break;
      }
      // 操作后立即同步状态到工具栏
      this.syncState();
    });

    // 右侧面板开关变化时同步到工具栏
    UI.shareMic.addEventListener('change', () => { if (AppState.isStreaming) this.syncState(); });
    UI.shareVideo.addEventListener('change', () => { if (AppState.isStreaming) this.syncState(); });
    UI.shareCamera.addEventListener('change', () => { if (AppState.isStreaming) this.syncState(); });
    UI.shareAudio.addEventListener('change', () => { if (AppState.isStreaming) this.syncState(); });
  },

  // 同步i18n翻译到工具栏窗口
  syncI18n() {
    const labels = {
      'tbMic': I18n.t('toolbar.mic'),
      'tbVideo': I18n.t('toolbar.video'),
      'tbCamera': I18n.t('toolbar.camera'),
      'tbAudio': I18n.t('toolbar.audio'),
      'tbStop': I18n.t('toolbar.stop')
    };
    window.electronAPI.setToolbarLang(labels);
  }
};

ToolbarBridge.init();

// 初始化时同步一次i18n
setTimeout(() => ToolbarBridge.syncI18n(), 100);

// 语言切换时同步i18n到工具栏
I18n.onChange(() => {
  ToolbarBridge.syncI18n();
});

// ============ 输入框右键菜单（使用mdui-dropdown） ============
// 辅助函数：获取mdui-text-field内部的input元素
function getInputElement(mduiTextField) {
  return mduiTextField.querySelector('input') || mduiTextField.input;
}

// 端口输入框右键菜单
const portDropdown = document.getElementById('portDropdown');
const portInput = document.getElementById('portInput');
const portCut = document.getElementById('portCut');
const portCopy = document.getElementById('portCopy');
const portPaste = document.getElementById('portPaste');
const portSelectAll = document.getElementById('portSelectAll');

portDropdown?.addEventListener('open', () => {
  const input = getInputElement(portInput);
  if (input) {
    const hasSelection = input.selectionStart !== input.selectionEnd;
    const hasValue = input.value.length > 0;
    portCut.style.display = hasSelection ? '' : 'none';
    portCopy.style.display = hasSelection ? '' : 'none';
    portSelectAll.style.display = hasValue ? '' : 'none';
  }
});

portCut?.addEventListener('click', () => {
  const input = getInputElement(portInput);
  if (input && input.selectionStart !== input.selectionEnd) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value.substring(start, end);
    window.electronAPI.copyToClipboard(text);
    input.value = input.value.substring(0, start) + input.value.substring(end);
    input.selectionStart = input.selectionEnd = start;
    input.dispatchEvent(new Event('input'));
  }
});

portCopy?.addEventListener('click', () => {
  const input = getInputElement(portInput);
  if (input) {
    const text = input.value.substring(input.selectionStart, input.selectionEnd);
    window.electronAPI.copyToClipboard(text);
  }
});

portPaste?.addEventListener('click', async () => {
  const input = getInputElement(portInput);
  if (input) {
    try {
      const text = await navigator.clipboard.readText();
      const start = input.selectionStart;
      const end = input.selectionEnd;
      input.value = input.value.substring(0, start) + text + input.value.substring(end);
      input.selectionStart = input.selectionEnd = start + text.length;
      input.dispatchEvent(new Event('input'));
    } catch (err) {
      console.warn('Paste failed:', err);
    }
  }
});

portSelectAll?.addEventListener('click', () => {
  const input = getInputElement(portInput);
  if (input) input.select();
});

// 密码输入框右键菜单
const passwordDropdown = document.getElementById('passwordDropdown');
const accessPasswordField = document.getElementById('accessPasswordField');
const pwdCut = document.getElementById('pwdCut');
const pwdCopy = document.getElementById('pwdCopy');
const pwdPaste = document.getElementById('pwdPaste');
const pwdSelectAll = document.getElementById('pwdSelectAll');

passwordDropdown?.addEventListener('open', () => {
  const input = getInputElement(accessPasswordField);
  if (input) {
    const hasSelection = input.selectionStart !== input.selectionEnd;
    const hasValue = input.value.length > 0;
    pwdCut.style.display = hasSelection ? '' : 'none';
    pwdCopy.style.display = hasSelection ? '' : 'none';
    pwdSelectAll.style.display = hasValue ? '' : 'none';
  }
});

pwdCut?.addEventListener('click', () => {
  const input = getInputElement(accessPasswordField);
  if (input && input.selectionStart !== input.selectionEnd) {
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value.substring(start, end);
    window.electronAPI.copyToClipboard(text);
    input.value = input.value.substring(0, start) + input.value.substring(end);
    input.selectionStart = input.selectionEnd = start;
    input.dispatchEvent(new Event('input'));
  }
});

pwdCopy?.addEventListener('click', () => {
  const input = getInputElement(accessPasswordField);
  if (input) {
    const text = input.value.substring(input.selectionStart, input.selectionEnd);
    window.electronAPI.copyToClipboard(text);
  }
});

pwdPaste?.addEventListener('click', async () => {
  const input = getInputElement(accessPasswordField);
  if (input) {
    try {
      const text = await navigator.clipboard.readText();
      const start = input.selectionStart;
      const end = input.selectionEnd;
      input.value = input.value.substring(0, start) + text + input.value.substring(end);
      input.selectionStart = input.selectionEnd = start + text.length;
      input.dispatchEvent(new Event('input'));
    } catch (err) {
      console.warn('Paste failed:', err);
    }
  }
});

pwdSelectAll?.addEventListener('click', () => {
  const input = getInputElement(accessPasswordField);
  if (input) input.select();
});
