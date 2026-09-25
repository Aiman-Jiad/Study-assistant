const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');

const DEFAULTS = {
  ollamaUrl: 'http://localhost:11434',
  selectedModel: null,
  theme: 'dark'
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readSettings() {
  ensureDataDir();
  if (!fs.existsSync(SETTINGS_PATH)) {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULTS, null, 2));
    return { ...DEFAULTS };
  }
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8');
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to read settings.json, falling back to defaults:', err.message);
    return { ...DEFAULTS };
  }
}

function writeSettings(partial) {
  const current = readSettings();
  const merged = { ...current, ...partial };
  ensureDataDir();
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(merged, null, 2));
  return merged;
}

module.exports = { readSettings, writeSettings };
