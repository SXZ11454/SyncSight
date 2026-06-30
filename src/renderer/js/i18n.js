// ============ i18n Internationalization Module ============
// Translation data is embedded inline (no fetch needed for file:// protocol)
// To add/modify languages, edit the TRANSLATIONS object below or the JSON files in i18n/
//
// Language files (reference for users to modify):
//   src/renderer/i18n/zh.json  - Chinese
//   src/renderer/i18n/en.json  - English

const I18n = {
  _currentLang: 'zh-CN',
  _fallback: 'zh-CN',
  _listeners: [],

  // Available languages: { code: displayName }
  languages: {
    'auto': '自动',
    'zh-CN': '中文',
    'en-US': 'English'
  },

  /**
   * Detect system language: zh* → zh-CN, others → en-US
   */
  detectSystemLang() {
    const nav = navigator.language || navigator.userLanguage || 'en-US';
    if (nav.startsWith('zh')) return 'zh-CN';
    return 'en-US';
  },

  /**
   * Resolve effective language code (auto → system lang)
   */
  resolveLang(code) {
    if (code === 'auto') return this.detectSystemLang();
    return code;
  },

  // ========== Embedded Translations (nested structure) ==========
  TRANSLATIONS: {
    'zh-CN': {
      "app": { "title": "SyncSight - 屏幕共享发送端", "subtitle": "屏幕共享发送端" },
      "edit": { "cut": "剪切", "copy": "复制", "paste": "粘贴", "selectAll": "全选" },
      "preview": { "title": "预览", "notShared": "未共享", "loading": "正在加载预览...", "previewing": "预览中（未共享）", "videoInfo": "{v} 视频 | {a} 音频 | {fps} fps", "videoInfoNoStream": "未共享 | {fps} fps" },
      "source": { "title": "共享源", "tabScreen": "屏幕", "tabWindow": "窗口", "loading": "加载中...", "noneFound": "未检测到", "selected": "已选择：{id}" },
      "options": { "title": "共享选项", "shareVideo": "共享画面", "shareAudio": "系统声音", "shareCamera": "摄像头", "shareMic": "麦克风", "running": "运行中", "notStarted": "未启动", "frameRate": "帧率", "resolution": "分辨率", "cameraN": "摄像头 {n}", "micN": "麦克风 {n}" },
      "mode": { "title": "转发模式", "star": "星型", "bt": "网状", "starDesc": "星型：主机直接向每个客户端发送流", "btDesc": "网状：客户端接收流后自动中继给新客户端，减轻主机带宽压力", "switchedTo": "切换为{mode}模式", "modeStar": "星型", "modeBT": "网状(BT)" },
      "personalize": { "title": "个性化", "darkMode": "深色模式", "language": "语言", "floatingToolbar": "浮动工具栏", "langAuto": "自动选择", "langZh": "简体中文", "langEn": "English" },
      "server": { "title": "服务器", "port": "端口", "address": "地址", "room": "房间", "status": "状态", "statusNotRunning": "未运行", "statusRunning": "运行中", "copied": "已复制地址到剪贴板", "copyFailed": "复制失败" },
      "action": { "start": "开始共享", "stop": "停止共享", "starting": "启动中...", "sharing": "共享中", "expandPreview": "展开预览", "collapsePreview": "收起预览", "refresh": "刷新源列表" },
      "log": { "title": "日志", "waiting": "等待启动...", "levelError": "ERROR", "levelWarn": "WARN", "levelInfo": "INFO", "levelDebug": "DEBUG", "copied": "已复制选中内容", "copy": "复制", "selectAll": "全选", "rateSet": "帧率设置为 {fps} fps", "sourcesLoaded": "{screens} 屏幕, {windows} 窗口, {cameras} 摄像头", "autoPreviewStarted": "自动预览已启动", "autoPreviewFailed": "选择共享源后开始预览", "sharingStarted": "共享已开始", "sharingStopped": "共享已停止", "startFailed": "启动失败: {error}", "startError": "启动出错: {error}", "stopError": "停止出错: {error}", "selectSource": "请选择共享源", "selectContent": "请至少选择一项共享内容", "invalidPort": "端口无效", "clientConnected": "客户端 {id} 已连接", "clientDisconnected": "客户端 {id} 断开", "cameraStarted": "摄像头流已启动", "cameraStopped": "摄像头流已停止", "cameraStartFailed": "摄像头启动失败: {error}", "micStarted": "麦克风流已启动", "micStopped": "麦克风流已停止", "micStartFailed": "麦克风启动失败: {error}", "relayFromSeed": "客户端 {id} 由 seed 中继", "offerSent": "向客户端 {id} 发送 Offer", "toolbarEnabled": "浮动工具栏已启用", "toolbarDisabled": "浮动工具栏已禁用", "accessModeChanged": "访问模式切换为: {mode}", "passwordSet": "访问密码已设置", "approvalRequest": "{name} 请求访问", "approvalApproved": "已批准 {id} 访问", "approvalRejected": "已拒绝 {id} 访问" },
      "access": { "title": "访问控制", "public": "公开", "invite": "邀请", "password": "密码", "approval": "许可", "inviteCount": "生成链接数", "showAll": "展开全部 {count} 个链接", "copyLink": "复制链接", "linkCopied": "已复制第 {n} 个链接", "copyFailed": "复制失败", "setPassword": "设置访问密码（最长32字符）", "noPendingRequests": "暂无待审批请求", "verifyTitle": "需要验证", "passwordTitle": "输入密码", "passwordDesc": "该房间需要密码才能访问", "enterPassword": "请输入密码", "submit": "提交", "approvalTitle": "申请访问", "approvalDesc": "该房间需要主机批准才能访问", "enterName": "请输入您的昵称", "requestAccess": "发送申请", "inviteTitle": "邀请无效", "inviteDesc": "该邀请链接无效或已过期", "invalidInvite": "无效的邀请链接", "contactHost": "请联系主机获取有效邀请", "passwordRequired": "请输入密码", "nameRequired": "请输入昵称", "verifying": "验证中...", "waitingApproval": "等待主机批准...", "approved": "已批准，正在加入...", "rejected": "访问被拒绝", "wrongPassword": "密码错误，请重试" },
      "toolbar": { "mic": "麦克风", "video": "共享画面", "camera": "摄像头", "audio": "系统声音", "stop": "停止共享" },
      "cameraWindow": { "title": "摄像头预览", "connecting": "正在连接摄像头...", "startFailed": "摄像头启动失败", "close": "关闭" },
      "receiver": { "title": "SyncSight - 屏幕接收端", "connecting": "正在连接...", "connected": "已连接到信令服务器，正在加入...", "waitingStream": "等待视频流...", "btRelaying": "BT 模式 - 连接中继节点...", "disconnected": "连接已断开", "connectError": "无法连接到服务器：{error}", "joinFailed": "加入失败：{error}", "playing": "正在播放...", "clickToPlay": "点击画面开始播放", "connectedStatus": "已连接", "connectionFailed": "连接失败，请刷新页面重试", "senderDisconnected": "发送端断开连接", "hostLeft": "主机已离开房间", "streamError": "处理视频流失败：{error}", "socketNotLoaded": "错误：Socket.IO 未加载", "seedBadge": "SEED 中继", "langAuto": "自动选择", "langZh": "简体中文", "langEn": "English", "username": "接收端", "errorTitle": "错误" }
    },
    'en-US': {
      "app": { "title": "SyncSight - Screen Share Sender", "subtitle": "Screen Sharing Sender" },
      "edit": { "cut": "Cut", "copy": "Copy", "paste": "Paste", "selectAll": "Select All" },
      "preview": { "title": "Preview", "notShared": "Not Shared", "loading": "Loading preview...", "previewing": "Preview (not sharing)", "videoInfo": "{v} Video | {a} Audio | {fps} fps", "videoInfoNoStream": "Not Shared | {fps} fps" },
      "source": { "title": "Share Source", "tabScreen": "Screen", "tabWindow": "Window", "loading": "Loading...", "noneFound": "None Found", "selected": "Selected: {id}" },
      "options": { "title": "Sharing Options", "shareVideo": "Share Screen", "shareAudio": "System Audio", "shareCamera": "Camera", "shareMic": "Microphone", "running": "Active", "notStarted": "Inactive", "frameRate": "Frame Rate", "resolution": "Resolution", "cameraN": "Camera {n}", "micN": "Mic {n}" },
      "mode": { "title": "Forward Mode", "star": "Star", "bt": "Mesh", "starDesc": "Star: Host sends stream directly to each client", "btDesc": "Mesh: Clients relay stream to new clients, reducing host bandwidth", "switchedTo": "Switched to {mode} mode", "modeStar": "Star", "modeBT": "Mesh(BT)" },
      "personalize": { "title": "Personalization", "darkMode": "Dark Mode", "language": "Language", "floatingToolbar": "Floating Toolbar", "langAuto": "Auto Select", "langZh": "Simplified Chinese", "langEn": "English" },
      "server": { "title": "Server", "port": "Port", "address": "Address", "room": "Room", "status": "Status", "statusNotRunning": "Not Running", "statusRunning": "Running", "copied": "Address copied to clipboard", "copyFailed": "Copy failed" },
      "action": { "start": "Start Sharing", "stop": "Stop Sharing", "starting": "Starting...", "sharing": "Sharing", "expandPreview": "Expand Preview", "collapsePreview": "Collapse Preview", "refresh": "Refresh Sources" },
      "log": { "title": "Log", "waiting": "Waiting for start...", "levelError": "ERROR", "levelWarn": "WARN", "levelInfo": "INFO", "levelDebug": "DEBUG", "copied": "Copied selected content", "copy": "Copy", "selectAll": "Select All", "rateSet": "Frame rate set to {fps} fps", "sourcesLoaded": "{screens} screen(s), {windows} window(s), {cams} camera(s)", "autoPreviewStarted": "Auto preview started", "autoPreviewFailed": "Select a source to start preview", "sharingStarted": "Sharing started", "sharingStopped": "Sharing stopped", "startFailed": "Start failed: {error}", "startError": "Start error: {error}", "stopError": "Stop error: {error}", "selectSource": "Please select a source", "selectContent": "Please select at least one sharing option", "invalidPort": "Invalid port", "clientConnected": "Client {id} connected", "clientDisconnected": "Client {id} disconnected", "cameraStarted": "Camera stream started", "cameraStopped": "Camera stream stopped", "cameraStartFailed": "Camera start failed: {error}", "micStarted": "Microphone stream started", "micStopped": "Microphone stream stopped", "micStartFailed": "Microphone start failed: {error}", "relayFromSeed": "Client {id} relayed from seed", "offerSent": "Sent Offer to client {id}", "toolbarEnabled": "Floating toolbar enabled", "toolbarDisabled": "Floating toolbar disabled", "accessModeChanged": "Access mode changed to: {mode}", "passwordSet": "Access password set", "approvalRequest": "{name} requests access", "approvalApproved": "Approved access for {id}", "approvalRejected": "Rejected access for {id}" },
      "access": { "title": "Access Control", "public": "Public", "invite": "Invite", "password": "Password", "approval": "Approval", "inviteCount": "Number of Links", "showAll": "Show all {count} links", "copyLink": "Copy Link", "linkCopied": "Copied link #{n}", "copyFailed": "Copy failed", "setPassword": "Set access password (max 32 characters)", "noPendingRequests": "No pending requests", "verifyTitle": "Verification Required", "passwordTitle": "Enter Password", "passwordDesc": "This room requires a password to access", "enterPassword": "Enter password", "submit": "Submit", "approvalTitle": "Request Access", "approvalDesc": "This room requires host approval to access", "enterName": "Enter your name", "requestAccess": "Send Request", "inviteTitle": "Invalid Invite", "inviteDesc": "This invite link is invalid or expired", "invalidInvite": "Invalid invite link", "contactHost": "Contact the host for a valid invite", "passwordRequired": "Please enter a password", "nameRequired": "Please enter your name", "verifying": "Verifying...", "waitingApproval": "Waiting for host approval...", "approved": "Approved, joining...", "rejected": "Access denied", "wrongPassword": "Wrong password, please try again" },
      "toolbar": { "mic": "Microphone", "video": "Screen Share", "camera": "Camera", "audio": "System Audio", "stop": "Stop Sharing" },
      "cameraWindow": { "title": "Camera Preview", "connecting": "Connecting camera...", "startFailed": "Camera start failed", "close": "Close" },
      "receiver": { "title": "SyncSight - Screen Receiver", "connecting": "Connecting...", "connected": "Connected to signaling server, joining...", "waitingStream": "Waiting for stream...", "btRelaying": "BT mode - Connecting to relay node...", "disconnected": "Disconnected", "connectError": "Cannot connect to server: {error}", "joinFailed": "Join failed: {error}", "playing": "Playing...", "clickToPlay": "Click video to play", "connectedStatus": "Connected", "connectionFailed": "Connection failed, please refresh page", "senderDisconnected": "Sender disconnected", "hostLeft": "Host has left the room", "streamError": "Stream processing error: {error}", "socketNotLoaded": "Error: Socket.IO not loaded", "seedBadge": "SEED Relay", "langAuto": "Auto Select", "langZh": "Simplified Chinese", "langEn": "English", "username": "Receiver", "errorTitle": "Error" }
    }
  },

  /**
   * Initialize i18n system (synchronous)
   */
  init(defaultLang) {
    const saved = localStorage.getItem('syncsight-lang');
    const rawLang = saved || defaultLang;
    this._currentLang = this.resolveLang(rawLang);
    this._rawLang = rawLang;
    document.documentElement.lang = this._currentLang;
    return rawLang;
  },

  /**
   * Switch language
   */
  setLanguage(langCode) {
    this._rawLang = langCode;
    const resolved = this.resolveLang(langCode);
    if (!this.TRANSLATIONS[resolved]) {
      console.warn('[I18N] Language not available:', resolved);
      return false;
    }
    this._currentLang = resolved;
    localStorage.setItem('syncsight-lang', langCode);
    document.documentElement.lang = resolved;
    this.updateDOM();
    this._listeners.forEach(fn => fn(resolved));
    return true;
  },

  getLanguage() {
    return this._currentLang;
  },

  getRawLanguage() {
    return this._rawLang || this._currentLang;
  },

  /**
   * Get translation by dot-notation key with placeholder substitution
   */
  t(key, params) {
    let value = this._resolveKey(this._currentLang, key);
    if (!value && this._fallback !== this._currentLang) {
      value = this._resolveKey(this._fallback, key);
    }
    if (!value) return key;
    return value.replace(/\{(\w+)\}/g, (_, name) =>
      params[name] !== undefined ? params[name] : `{${name}}`
    );
  },

  /** Resolve dot-notation key against nested translation object */
  _resolveKey(lang, key) {
    const keys = key.split('.');
    let obj = this.TRANSLATIONS[lang];
    for (const k of keys) {
      if (obj && typeof obj === 'object' && k in obj) {
        obj = obj[k];
      } else {
        return null;
      }
    }
    return typeof obj === 'string' ? obj : null;
  },

  /**
   * Update all DOM elements with data-i18n attributes
   */
  updateDOM() {
    // text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = this.t(key);
      if (text) el.textContent = text;
    });
    // placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const text = this.t(key);
      if (text) el.placeholder = text;
    });
    // title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const text = this.t(key);
      if (text) el.title = text;
    });
    // value attribute
    document.querySelectorAll('[data-i18n-value]').forEach(el => {
      const key = el.getAttribute('data-i18n-value');
      const text = this.t(key);
      if (text) el.setAttribute('value', text);
    });
  },

  onChange(callback) {
    this._listeners.push(callback);
  }
};