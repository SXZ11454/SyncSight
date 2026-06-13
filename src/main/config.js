// ============ Portable Config Module ============
// Saves/loads config.json in the app's own directory (green/portable mode)
// Excludes window layout (position, size, preview state)

const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  language: 'zh-CN',
  darkMode: false,
  port: 3000,
  mode: 'bt',
  logLevel: 'info',
  frameRate: 30
};

let _configPath = null;
let _config = null;

function getConfigPath() {
  if (!_configPath) {
    // Use app directory (portable mode) - same folder as the executable
    if (process.env.PORTABLE_EXECUTABLE_DIR) {
      // electron-builder portable mode
      _configPath = path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'config.json');
    } else if (process.resourcesPath) {
      // Development or installed mode
      const baseDir = process.env.ELECTRON_IS_DEV === 'true'
        ? path.join(__dirname, '..')
        : process.resourcesPath;
      _configPath = path.join(baseDir, 'config.json');
    } else {
      _configPath = path.join(process.cwd(), 'config.json');
    }
  }
  return _configPath;
}

function load() {
  try {
    const filePath = getConfigPath();
    if (!fs.existsSync(filePath)) {
      _config = { ...DEFAULTS };
      save(); // Create default config file
      console.log('[CONFIG] Created default config at:', filePath);
    } else {
      const raw = fs.readFileSync(filePath, 'utf-8');
      _config = JSON.parse(raw);
      // Merge with defaults for any missing keys
      for (const key of Object.keys(DEFAULTS)) {
        if (!(key in _config)) {
          _config[key] = DEFAULTS[key];
        }
      }
      console.log('[CONFIG] Loaded from:', filePath);
    }
  } catch (err) {
    console.error('[CONFIG] Failed to load, using defaults:', err.message);
    _config = { ...DEFAULTS };
  }
  return _config;
}

function get(key) {
  if (!_config) load();
  if (key) return _config[key];
  return { ..._config };
}

function set(key, value) {
  if (!_config) load();
  _config[key] = value;
  save();
}

function setAll(obj) {
  if (!_config) load();
  Object.assign(_config, obj);
  save();
}

function save() {
  try {
    const filePath = getConfigPath();
    fs.writeFileSync(filePath, JSON.stringify(_config, null, 2), 'utf-8');
  } catch (err) {
    console.error('[CONFIG] Failed to save:', err.message);
  }
}

module.exports = { load, get, set, setAll, DEFAULTS };
