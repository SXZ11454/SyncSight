// ============ 工具栏窗口逻辑 ============

const { ipcRenderer } = require('electron');

// 按钮状态映射
const btnMap = {
  mic:   { el: document.getElementById('tbMic'),   icon: document.getElementById('tbMicIcon'),   onIcon: 'mic',     offIcon: 'mic_off' },
  video: { el: document.getElementById('tbVideo'), icon: document.getElementById('tbVideoIcon'), onIcon: 'videocam', offIcon: 'videocam_off' },
  camera:{ el: document.getElementById('tbCamera'),icon: document.getElementById('tbCameraIcon'),onIcon: 'videocam', offIcon: 'videocam_off' },
  audio: { el: document.getElementById('tbAudio'), icon: document.getElementById('tbAudioIcon'), onIcon: 'volume_up',offIcon: 'volume_off' }
};

// 更新单个按钮图标状态
function setBtnState(key, active) {
  const b = btnMap[key];
  if (!b) return;
  b.icon.className = 'tb-icon ' + (active ? 'on' : 'off');
  b.icon.querySelector('.material-icons').textContent = active ? b.onIcon : b.offIcon;
}

// 接收主进程发来的状态同步
ipcRenderer.on('toolbar-sync-state', (_event, state) => {
  setBtnState('mic', !!state.mic);
  setBtnState('video', !!state.video);
  setBtnState('camera', !!state.camera);
  setBtnState('audio', !!state.audio);
});

// 接收 i18n 语言切换
ipcRenderer.on('toolbar-set-lang', (_event, labels) => {
  Object.entries(labels).forEach(([id, text]) => {
    const parent = document.getElementById(id);
    if (!parent) return;
    const label = parent.querySelector('.tb-label');
    if (label) label.textContent = text;
  });
  // 等字体加载完成后通知主进程重新调整窗口大小
  document.fonts.ready.then(() => {
    requestAnimationFrame(() => {
      const toolbar = document.getElementById('toolbar');
      const rect = toolbar.getBoundingClientRect();
      ipcRenderer.send('toolbar-resize', { width: Math.ceil(rect.width), height: Math.ceil(rect.height) });
    });
  });
});

// ---- 绑定点击事件 ----
document.getElementById('tbMic').addEventListener('click', () => {
  ipcRenderer.send('toolbar-action', 'toggle-mic');
});
document.getElementById('tbVideo').addEventListener('click', () => {
  ipcRenderer.send('toolbar-action', 'toggle-video');
});
document.getElementById('tbCamera').addEventListener('click', () => {
  ipcRenderer.send('toolbar-action', 'toggle-camera');
});
document.getElementById('tbAudio').addEventListener('click', () => {
  ipcRenderer.send('toolbar-action', 'toggle-audio');
});
document.getElementById('tbStop').addEventListener('click', () => {
  ipcRenderer.send('toolbar-action', 'stop-sharing');
});

// 接收退出动画指令：播放动画后通知主进程销毁窗口
ipcRenderer.on('toolbar-close', () => {
  const tb = document.getElementById('toolbar');
  tb.classList.add('exit');
  tb.addEventListener('animationend', () => {
    ipcRenderer.send('toolbar-closed');
  }, { once: true });
});
