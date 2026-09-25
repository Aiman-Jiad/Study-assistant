const express = require('express');
const { readSettings, writeSettings } = require('../lib/settings');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(readSettings());
});

router.put('/', (req, res) => {
  const { ollamaUrl, selectedModel, theme } = req.body;
  const patch = {};
  if (typeof ollamaUrl === 'string' && ollamaUrl.trim()) patch.ollamaUrl = ollamaUrl.trim().replace(/\/+$/, '');
  if (typeof selectedModel === 'string') patch.selectedModel = selectedModel;
  if (theme === 'dark' || theme === 'light') patch.theme = theme;

  const updated = writeSettings(patch);
  res.json(updated);
});

module.exports = router;
