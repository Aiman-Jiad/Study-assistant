const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CHATS_PATH = path.join(DATA_DIR, 'chats.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readAll() {
  ensureDataDir();
  if (!fs.existsSync(CHATS_PATH)) {
    fs.writeFileSync(CHATS_PATH, JSON.stringify({ sessions: [] }, null, 2));
    return { sessions: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(CHATS_PATH, 'utf-8'));
  } catch (err) {
    console.error('Failed to read chats.json:', err.message);
    return { sessions: [] };
  }
}

function writeAll(data) {
  ensureDataDir();
  fs.writeFileSync(CHATS_PATH, JSON.stringify(data, null, 2));
}

function listSessions() {
  const { sessions } = readAll();
  return sessions
    .map((s) => ({
      id: s.id,
      title: s.title,
      model: s.model,
      documentId: s.documentId || null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      messageCount: s.messages.length
    }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

function getSession(id) {
  const { sessions } = readAll();
  return sessions.find((s) => s.id === id) || null;
}

function createSession({ title, model, documentId }) {
  const data = readAll();
  const now = new Date().toISOString();
  const session = {
    id: crypto.randomUUID(),
    title: title || 'New chat',
    model,
    documentId: documentId || null,
    messages: [],
    createdAt: now,
    updatedAt: now
  };
  data.sessions.push(session);
  writeAll(data);
  return session;
}

function appendMessages(id, newMessages) {
  const data = readAll();
  const session = data.sessions.find((s) => s.id === id);
  if (!session) throw new Error('Chat session not found');
  session.messages.push(...newMessages);
  session.updatedAt = new Date().toISOString();
  if (session.title === 'New chat' && newMessages[0] && newMessages[0].role === 'user') {
    session.title = newMessages[0].content.slice(0, 60);
  }
  writeAll(data);
  return session;
}

function deleteSession(id) {
  const data = readAll();
  const before = data.sessions.length;
  data.sessions = data.sessions.filter((s) => s.id !== id);
  writeAll(data);
  return data.sessions.length < before;
}

module.exports = { listSessions, getSession, createSession, appendMessages, deleteSession };
