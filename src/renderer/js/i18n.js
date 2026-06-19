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
    'auto': '\u81ea\u52a8',
    'zh-CN': '\u4e2d\u6587',
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
      "app": { "title": "SyncSight - \u5c4f\u5e55\u5171\u4eab\u53d1\u9001\u7aef", "subtitle": "\u5c4f\u5e55\u5171\u4eab\u53d1\u9001\u7aef" },
      "preview": { "title": "\u9884\u89c8", "notShared": "\u672a\u5171\u4eab", "loading": "\u6b63\u5728\u52a0\u8f7d\u9884\u89c8...", "previewing": "\u9884\u89c8\u4e2d\uff08\u672a\u5171\u4eab\uff09", "videoInfo": "{v} \u89c6\u9891 | {a} \u97f3\u9891 | {fps} fps", "videoInfoNoStream": "\u672a\u5171\u4eab | {fps} fps" },
      "source": { "title": "\u5171\u4eab\u6e90", "tabScreen": "\u5c4f\u5e55", "tabWindow": "\u7a97\u53e3", "loading": "\u52a0\u8f7d\u4e2d...", "noneFound": "\u672a\u68c0\u6d4b\u5230", "selected": "\u5df2\u9009\u62e9\uff1a{id}" },
      "options": { "title": "\u5171\u4eab\u9009\u9879", "shareVideo": "\u5171\u4eab\u753b\u9762", "shareAudio": "\u7cfb\u7edf\u58f0\u97f3", "shareCamera": "\u6444\u50cf\u5934", "shareMic": "\u9ea6\u514b\u98ce", "running": "\u8fd0\u884c\u4e2d", "notStarted": "\u672a\u542f\u52a8", "frameRate": "\u5e27\u7387", "resolution": "\u5206\u8fa8\u7387", "cameraN": "\u6444\u50cf\u5934 {n}", "micN": "\u9ea6\u514b\u98ce {n}" },
      "mode": { "title": "\u8f6c\u53d1\u6a21\u5f0f", "star": "\u661f\u578b", "bt": "\u7f51\u72b6", "starDesc": "\u661f\u578b\uff1a\u4e3b\u673a\u76f4\u63a5\u5411\u6bcf\u4e2a\u5ba2\u6237\u7aef\u53d1\u9001\u6d41", "btDesc": "\u7f51\u72b6\uff1a\u5ba2\u6237\u7aef\u63a5\u6536\u6d41\u540e\u81ea\u52a8\u4e2d\u7ee7\u7ed9\u65b0\u5ba2\u6237\u7aef\uff51\u51cf\u8f7b\u4e3b\u673a\u5e26\u5bbd\u538b\u529b", "switchedTo": "\u5207\u6362\u4e3a{mode}\u6a21\u5f0f", "modeStar": "\u661f\u578b", "modeBT": "\u7f51\u72b6(BT)" },
      "personalize": { "title": "\u4e2a\u6027\u5316", "darkMode": "\u6df1\u8272\u6a21\u5f0f", "language": "\u8bed\u8a00", "floatingToolbar": "\u6d6e\u52a8\u5de5\u5177\u680f", "langAuto": "\u81ea\u52a8\u9009\u62e9" },
      "server": { "title": "\u670d\u52a1\u5668", "port": "\u7aef\u53e3", "address": "\u5730\u5740", "room": "\u623f\u95f4", "status": "\u72b6\u6001", "statusNotRunning": "\u672a\u8fd0\u884c", "statusRunning": "\u8fd0\u884c\u4e2d", "copied": "\u5df2\u590d\u5236\u5730\u5740\u5230\u526a\u8d34\u677f", "copyFailed": "\u590d\u5236\u5931\u8d25" },
      "action": { "start": "\u5f00\u59cb\u5171\u4eab", "stop": "\u505c\u6b62\u5171\u4eab", "starting": "\u542f\u52a8\u4e2d...", "sharing": "\u5171\u4eab\u4e2d", "expandPreview": "\u5c55\u5f00\u9884\u89c8", "collapsePreview": "\u6536\u8d77\u9884\u89c8", "refresh": "\u5237\u65b0\u6e90\u5217\u8868" },
      "log": { "title": "\u65e5\u5fd7", "waiting": "\u7b49\u5f85\u542f\u52a8...", "levelError": "ERROR", "levelWarn": "WARN", "levelInfo": "INFO", "levelDebug": "DEBUG", "rateSet": "\u5e27\u7387\u8bbe\u7f6e\u4e3a {fps} fps", "sourcesLoaded": "{screens} \u5c4f\u5e55, {windows} \u7a97\u53e3, {cameras} \u6444\u50cf\u5934", "autoPreviewStarted": "\u81ea\u52a8\u9884\u89c8\u5df2\u542f\u52a8", "autoPreviewFailed": "\u9009\u62e9\u5171\u4eab\u6e90\u540e\u5f00\u59cb\u9884\u89c8", "sharingStarted": "\u5171\u4eab\u5df2\u5f00\u59cb", "sharingStopped": "\u5171\u4eab\u5df2\u505c\u6b62", "startFailed": "\u542f\u52a8\u5931\u8d25: {error}", "startError": "\u542f\u52a1\u51fa\u9519: {error}", "stopError": "\u505c\u6b62\u51fa\u9519: {error}", "selectSource": "\u8bf7\u9009\u62e9\u5171\u4eab\u6e90", "selectContent": "\u8bf7\u81f3\u5c11\u9009\u62e9\u4e00\u9879\u5171\u4eab\u5185\u5bb9", "invalidPort": "\u7aef\u53e3\u65e0\u6548", "clientConnected": "\u5ba2\u6237\u7aef {id} \u5df2\u8fde\u63a5", "clientDisconnected": "\u5ba2\u6237\u7aef {id} \u65ad\u5f00", "cameraStarted": "\u6444\u50cf\u5934\u6d41\u5df2\u542f\u52a8", "cameraStopped": "\u6444\u50cf\u5934\u6d41\u5df2\u505c\u6b62", "cameraStartFailed": "\u6444\u50cf\u5934\u542f\u52a8\u5931\u8d25: {error}", "micStarted": "\u9ea6\u514b\u98ce\u6d41\u5df2\u542f\u52a8", "micStopped": "\u9ea6\u514b\u98ce\u6d41\u5df2\u505c\u6b62", "micStartFailed": "\u9ea6\u514b\u98ce\u542f\u52a8\u5931\u8d25: {error}", "relayFromSeed": "\u5ba2\u6237\u7aef {id} \u7531 seed \u4e2d\u7ee7", "offerSent": "\u5411\u5ba2\u6237\u7aef {id} \u53d1\u9001 Offer", "toolbarEnabled": "\u6d6e\u52a8\u5de5\u5177\u680f\u5df2\u542f\u7528", "toolbarDisabled": "\u6d6e\u52a8\u5de5\u5177\u680f\u5df2\u7981\u7528" },
      "toolbar": { "mic": "\u9ea6\u514b\u98ce", "video": "\u5171\u4eab\u753b\u9762", "camera": "\u6444\u50cf\u5934", "audio": "\u7cfb\u7edf\u58f0\u97f3", "stop": "\u505c\u6b62\u5171\u4eab" },
      "cameraWindow": { "title": "\u6444\u50cf\u5934\u9884\u89c8", "connecting": "\u6b63\u5728\u8fde\u63a5\u6444\u50cf\u5934...", "startFailed": "\u6444\u50cf\u5934\u542f\u52a8\u5931\u8d25", "close": "\u5173\u95ed" },
      "receiver": { "title": "SyncSight - \u5c4f\u5e55\u63a5\u6536\u7aef", "connecting": "\u6b63\u5728\u8fde\u63a5...", "connected": "\u5df2\u8fde\u63a5\u5230\u4fe1\u4ee4\u670d\u52a1\u5668\uff0c\u6b63\u5728\u52a0\u5165...", "waitingStream": "\u7b49\u5f85\u89c6\u9891\u6d41...", "btRelaying": "BT \u6a21\u5f0f - \u8fde\u63a5\u4e2d\u7ee7\u8282\u70b9...", "disconnected": "\u8fde\u63a5\u5df2\u65ad\u5f00", "connectError": "\u65e0\u6cd5\u8fde\u63a5\u5230\u670d\u52a1\u5668\uff1a{error}", "joinFailed": "\u52a0\u5165\u5931\u8d25\uff1a{error}", "playing": "\u6b63\u5728\u64ad\u653e...", "clickToPlay": "\u70b9\u51fb\u753b\u9762\u5f00\u59cb\u64ad\u653e", "connectedStatus": "\u5df2\u8fde\u63a5", "connectionFailed": "\u8fde\u63a5\u5931\u8d25\uff0c\u8bf7\u5237\u65b0\u9875\u91cd\u8bd5", "senderDisconnected": "\u53d1\u9001\u7aef\u65ad\u5f00\u8fde\u63a5", "hostLeft": "\u4e3b\u673a\u5df2\u79bb\u5f00\u623f\u95f4", "streamError": "\u5904\u7406\u89c6\u9891\u6d41\u5931\u8d25\uff1a{error}", "socketNotLoaded": "\u9519\u8bef\uff1aSocket.IO \u672a\u52a0\u8f7d", "seedBadge": "SEED \u4e2d\u7ee7", "langAuto": "\u81ea\u52a8\u9009\u62e9" }
    },
    'en-US': {
      "app": { "title": "SyncSight - Screen Share Sender", "subtitle": "Screen Sharing Sender" },
      "preview": { "title": "Preview", "notShared": "Not Shared", "loading": "Loading preview...", "previewing": "Preview (not sharing)", "videoInfo": "{v} Video | {a} Audio | {fps} fps", "videoInfoNoStream": "Not Shared | {fps} fps" },
      "source": { "title": "Share Source", "tabScreen": "Screen", "tabWindow": "Window", "loading": "Loading...", "noneFound": "None Found", "selected": "Selected: {id}" },
      "options": { "title": "Sharing Options", "shareVideo": "Share Screen", "shareAudio": "System Audio", "shareCamera": "Camera", "shareMic": "Microphone", "running": "Active", "notStarted": "Inactive", "frameRate": "Frame Rate", "resolution": "Resolution", "cameraN": "Camera {n}", "micN": "Mic {n}" },
      "mode": { "title": "Forward Mode", "star": "Star", "bt": "Mesh", "starDesc": "Star: Host sends stream directly to each client", "btDesc": "Mesh: Clients relay stream to new clients, reducing host bandwidth", "switchedTo": "Switched to {mode} mode", "modeStar": "Star", "modeBT": "Mesh(BT)" },
      "personalize": { "title": "Personalization", "darkMode": "Dark Mode", "language": "Language", "floatingToolbar": "Floating Toolbar", "langAuto": "Auto Select" },
      "server": { "title": "Server", "port": "Port", "address": "Address", "room": "Room", "status": "Status", "statusNotRunning": "Not Running", "statusRunning": "Running", "copied": "Address copied to clipboard", "copyFailed": "Copy failed" },
      "action": { "start": "Start Sharing", "stop": "Stop Sharing", "starting": "Starting...", "sharing": "Sharing", "expandPreview": "Expand Preview", "collapsePreview": "Collapse Preview", "refresh": "Refresh Sources" },
      "log": { "title": "Log", "waiting": "Waiting for start...", "levelError": "ERROR", "levelWarn": "WARN", "levelInfo": "INFO", "levelDebug": "DEBUG", "rateSet": "Frame rate set to {fps} fps", "sourcesLoaded": "{screens} screen(s), {windows} window(s), {cams} camera(s)", "autoPreviewStarted": "Auto preview started", "autoPreviewFailed": "Select a source to start preview", "sharingStarted": "Sharing started", "sharingStopped": "Sharing stopped", "startFailed": "Start failed: {error}", "startError": "Start error: {error}", "stopError": "Stop error: {error}", "selectSource": "Please select a source", "selectContent": "Please select at least one sharing option", "invalidPort": "Invalid port", "clientConnected": "Client {id} connected", "clientDisconnected": "Client {id} disconnected", "cameraStarted": "Camera stream started", "cameraStopped": "Camera stream stopped", "cameraStartFailed": "Camera start failed: {error}", "micStarted": "Microphone stream started", "micStopped": "Microphone stream stopped", "micStartFailed": "Microphone start failed: {error}", "relayFromSeed": "Client {id} relayed from seed", "offerSent": "Sent Offer to client {id}", "toolbarEnabled": "Floating toolbar enabled", "toolbarDisabled": "Floating toolbar disabled" },
      "toolbar": { "mic": "Microphone", "video": "Screen Share", "camera": "Camera", "audio": "System Audio", "stop": "Stop Sharing" },
      "cameraWindow": { "title": "Camera Preview", "connecting": "Connecting camera...", "startFailed": "Camera start failed", "close": "Close" },
      "receiver": { "title": "SyncSight - Screen Receiver", "connecting": "Connecting...", "connected": "Connected to signaling server, joining...", "waitingStream": "Waiting for stream...", "btRelaying": "BT mode - Connecting to relay node...", "disconnected": "Disconnected", "connectError": "Cannot connect to server: {error}", "joinFailed": "Join failed: {error}", "playing": "Playing...", "clickToPlay": "Click video to play", "connectedStatus": "Connected", "connectionFailed": "Connection failed, please refresh page", "senderDisconnected": "Sender disconnected", "hostLeft": "Host has left the room", "streamError": "Stream processing error: {error}", "socketNotLoaded": "Error: Socket.IO not loaded", "seedBadge": "SEED Relay", "langAuto": "Auto Select" }
    }
  },

  /**
   * Initialize i18n system (synchronous)
   */
  init(defaultLang) {
    const saved = localStorage.getItem('syncsight-lang');
    const rawLang = saved || defaultLang;
    this._currentLang = this.resolveLang(rawLang);
    this._rawLang = rawLang; // 保存原始值（可能是 'auto'）
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
