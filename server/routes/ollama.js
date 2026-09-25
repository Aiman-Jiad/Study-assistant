const express = require('express');
const { readSettings } = require('../lib/settings');
const ollama = require('../lib/ollama');

const router = express.Router();

// GET /api/ollama/status - is Ollama reachable right now?
router.get('/status', async (req, res) => {
  const { ollamaUrl } = readSettings();
  const result = await ollama.checkConnection(ollamaUrl);
  res.json({ ollamaUrl, ...result });
});

// GET /api/ollama/models - real list of locally pulled Ollama models
router.get('/models', async (req, res) => {
  const { ollamaUrl } = readSettings();
  try {
    const models = await ollama.listModels(ollamaUrl);
    res.json({ models });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// POST /api/ollama/chat - streams a real chat completion back to the client
// as newline-delimited JSON (NDJSON), passthrough of Ollama's own chunk shape
// plus a final { done: true } marker.
router.post('/chat', async (req, res) => {
  const { ollamaUrl, selectedModel } = readSettings();
  const { messages, model } = req.body;

  const useModel = model || selectedModel;
  if (!useModel) {
    return res.status(400).json({ error: 'No model selected. Choose a model in Settings first.' });
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required.' });
  }

  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');

  const controller = new AbortController();
  req.on('close', () => controller.abort());

  try {
    await ollama.streamChat(ollamaUrl, {
      model: useModel,
      messages,
      signal: controller.signal,
      onChunk: (chunk) => {
        res.write(JSON.stringify(chunk) + '\n');
      }
    });
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(502);
    }
    res.write(JSON.stringify({ error: err.message, done: true }) + '\n');
    res.end();
  }
});

module.exports = router;
