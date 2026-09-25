const Api = (() => {
  async function request(path, options = {}) {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        if (body.error) message = body.error;
      } catch (_) {}
      throw new Error(message);
    }
    if (res.status === 204) return null;
    return res.json();
  }

  return {
    // Settings
    getSettings: () => request('/api/settings'),
    updateSettings: (patch) => request('/api/settings', { method: 'PUT', body: JSON.stringify(patch) }),

    // Ollama
    getOllamaStatus: () => request('/api/ollama/status'),
    getModels: () => request('/api/ollama/models'),

    // Chat sessions
    listSessions: () => request('/api/chats'),
    getSession: (id) => request(`/api/chats/${id}`),
    createSession: (payload) => request('/api/chats', { method: 'POST', body: JSON.stringify(payload) }),
    appendMessages: (id, messages) =>
      request(`/api/chats/${id}/messages`, { method: 'POST', body: JSON.stringify({ messages }) }),
    deleteSession: (id) => request(`/api/chats/${id}`, { method: 'DELETE' }),

    // Streaming chat - returns an object with an `onToken` you can set before calling `start`
    streamChat: async ({ model, messages, onToken, onDone, onError, signal }) => {
      try {
        const res = await fetch('/api/ollama/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, messages }),
          signal
        });

        if (!res.ok || !res.body) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `Chat request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx;
          while ((idx = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);
            if (!line) continue;
            const json = JSON.parse(line);
            if (json.error) {
              onError && onError(json.error);
              return;
            }
            if (json.message && json.message.content) {
              fullText += json.message.content;
              onToken && onToken(json.message.content, fullText);
            }
            if (json.done) {
              onDone && onDone(fullText);
            }
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          onError && onError(err.message);
        }
      }
    }
  };
})();
