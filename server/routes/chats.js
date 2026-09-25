const express = require('express');
const store = require('../lib/chatStore');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ sessions: store.listSessions() });
});

router.get('/:id', (req, res) => {
  const session = store.getSession(req.params.id);
  if (!session) return res.status(404).json({ error: 'Chat session not found' });
  res.json(session);
});

router.post('/', (req, res) => {
  const { title, model, documentId } = req.body;
  if (!model) return res.status(400).json({ error: 'model is required to start a chat session' });
  const session = store.createSession({ title, model, documentId });
  res.status(201).json(session);
});

router.post('/:id/messages', (req, res) => {
  const { messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }
  try {
    const session = store.appendMessages(req.params.id, messages);
    res.json(session);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const ok = store.deleteSession(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Chat session not found' });
  res.status(204).end();
});

module.exports = router;
