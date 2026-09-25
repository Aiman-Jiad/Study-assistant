const ChatPage = {
  currentSessionId: null,
  abortController: null,

  async render(root, params = {}) {
    await State.refreshSettings();

    if (!State.settings.selectedModel) {
      root.innerHTML = `
        ${UI.pageHeader('AI Chat', 'Talk to your local model.')}
        ${UI.emptyState({
          icon: '◔',
          title: 'No model selected',
          desc: 'Pick an Ollama model in Settings before starting a chat.',
          actionHtml: `<a href="#/settings" class="btn btn-primary" style="margin-top:14px;">Go to Settings</a>`
        })}
      `;
      return;
    }

    const { sessions } = await Api.listSessions();

    root.innerHTML = `
      ${UI.pageHeader('AI Chat', `Model: ${UI.escapeHtml(State.settings.selectedModel)}`)}
      <div class="two-col" style="height:calc(100vh - 150px);">
        <div>
          <button class="btn btn-primary" id="new-chat-btn" style="width:100%; margin-bottom:12px;">+ New chat</button>
          <div class="session-list" id="session-list"></div>
        </div>
        <div class="chat-layout">
          <div class="chat-messages" id="chat-messages"></div>
          <form class="chat-input-bar" id="chat-form">
            <textarea id="chat-input" placeholder="Ask anything…" rows="1"></textarea>
            <button type="submit" class="btn btn-primary" id="chat-send">Send</button>
          </form>
        </div>
      </div>
    `;

    this.renderSessionList(sessions, params.session || null);

    document.getElementById('new-chat-btn').addEventListener('click', () => this.startNewChat());

    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage(input.value.trim());
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.requestSubmit();
      }
    });

    if (params.session) {
      await this.openSession(params.session);
    } else if (sessions.length > 0) {
      await this.openSession(sessions[0].id);
    } else {
      this.currentSessionId = null;
      this.renderEmptyChat();
    }
  },

  renderSessionList(sessions, activeId) {
    const el = document.getElementById('session-list');
    if (!el) return;
    if (sessions.length === 0) {
      el.innerHTML = `<div style="color:var(--text-faint); font-size:12px; padding:8px;">No chats yet</div>`;
      return;
    }
    el.innerHTML = sessions
      .map(
        (s) => `
      <div class="session-item ${s.id === activeId ? 'active' : ''}" data-id="${s.id}">
        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${UI.escapeHtml(s.title)}</span>
        <button class="btn" data-delete="${s.id}" style="padding:2px 6px; font-size:11px;">✕</button>
      </div>`
      )
      .join('');

    el.querySelectorAll('.session-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('[data-delete]')) return;
        this.openSession(item.dataset.id);
      });
    });
    el.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await Api.deleteSession(btn.dataset.delete);
        const { sessions: fresh } = await Api.listSessions();
        this.renderSessionList(fresh, this.currentSessionId);
        if (btn.dataset.delete === this.currentSessionId) {
          this.currentSessionId = null;
          if (fresh.length > 0) await this.openSession(fresh[0].id);
          else this.renderEmptyChat();
        }
      });
    });
  },

  renderEmptyChat() {
    const el = document.getElementById('chat-messages');
    if (!el) return;
    el.innerHTML = UI.emptyState({
      icon: '◔',
      title: 'Start a new conversation',
      desc: 'Your message goes straight to your local Ollama model. Nothing leaves your machine.'
    });
  },

  async startNewChat() {
    const session = await Api.createSession({ title: 'New chat', model: State.settings.selectedModel });
    const { sessions } = await Api.listSessions();
    this.renderSessionList(sessions, session.id);
    await this.openSession(session.id);
  },

  async openSession(id) {
    this.currentSessionId = id;
    const messagesEl = document.getElementById('chat-messages');
    messagesEl.innerHTML = `<div style="display:flex; justify-content:center; padding:30px;"><span class="spinner"></span></div>`;
    try {
      const session = await Api.getSession(id);
      const { sessions } = await Api.listSessions();
      this.renderSessionList(sessions, id);
      this.renderMessages(session.messages);
    } catch (err) {
      UI.toast('Could not load chat: ' + err.message, 'error');
    }
  },

  renderMessages(messages) {
    const el = document.getElementById('chat-messages');
    if (!el) return;
    if (messages.length === 0) {
      this.renderEmptyChat();
      return;
    }
    el.innerHTML = messages
      .map((m) => `<div class="chat-msg ${m.role}">${UI.escapeHtml(m.content)}</div>`)
      .join('');
    el.scrollTop = el.scrollHeight;
  },

  async sendMessage(text) {
    if (!text) return;
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const messagesEl = document.getElementById('chat-messages');

    if (!this.currentSessionId) {
      const session = await Api.createSession({ title: text.slice(0, 60), model: State.settings.selectedModel });
      this.currentSessionId = session.id;
      const { sessions } = await Api.listSessions();
      this.renderSessionList(sessions, session.id);
    }

    input.value = '';
    sendBtn.disabled = true;

    const userMsg = { role: 'user', content: text };
    if (messagesEl.querySelector('.empty-state')) messagesEl.innerHTML = '';
    messagesEl.insertAdjacentHTML('beforeend', `<div class="chat-msg user">${UI.escapeHtml(text)}</div>`);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    const typingEl = document.createElement('div');
    typingEl.className = 'chat-msg assistant';
    typingEl.innerHTML = `<span class="typing-dots"><span></span><span></span><span></span></span>`;
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    let session;
    try {
      session = await Api.getSession(this.currentSessionId);
    } catch (err) {
      UI.toast('Could not load session history: ' + err.message, 'error');
      sendBtn.disabled = false;
      return;
    }

    const priorMessages = [...session.messages, userMsg];
    let assistantText = '';
    this.abortController = new AbortController();

    await Api.streamChat({
      model: State.settings.selectedModel,
      messages: priorMessages,
      signal: this.abortController.signal,
      onToken: (_token, full) => {
        assistantText = full;
        typingEl.textContent = assistantText;
      },
      onDone: async (full) => {
        assistantText = full;
        try {
          await Api.appendMessages(this.currentSessionId, [userMsg, { role: 'assistant', content: assistantText }]);
          const { sessions } = await Api.listSessions();
          this.renderSessionList(sessions, this.currentSessionId);
        } catch (err) {
          UI.toast('Failed to save chat history: ' + err.message, 'error');
        }
        sendBtn.disabled = false;
      },
      onError: (message) => {
        typingEl.className = 'chat-msg error';
        typingEl.textContent = `Error: ${message}`;
        UI.toast(message, 'error');
        sendBtn.disabled = false;
      }
    });
  }
};
