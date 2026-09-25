const express = require('express');
const path = require('path');

const ollamaRoutes = require('./routes/ollama');
const settingsRoutes = require('./routes/settings');
const chatRoutes = require('./routes/chats');

const app = express();
const PORT = process.env.PORT || 4173;

app.use(express.json({ limit: '2mb' }));

app.use('/api/ollama', ollamaRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/chats', chatRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\nLocal AI Study Assistant running at http://localhost:${PORT}`);
  console.log('Make sure Ollama is running (ollama serve) and you have at least one model pulled.\n');
});
