const DashboardPage = {
  async render(root) {
    root.innerHTML = `
      ${UI.pageHeader('Dashboard', 'A quick look at your local study setup.')}
      <div class="grid grid-4" id="dash-stats" style="margin-bottom:20px;">
        <div class="card stat-card"><div class="stat-label">Chat sessions</div><div class="stat-value">—</div></div>
        <div class="card stat-card"><div class="stat-label">Documents in library</div><div class="stat-value">—</div></div>
        <div class="card stat-card"><div class="stat-label">Ollama models available</div><div class="stat-value">—</div></div>
        <div class="card stat-card"><div class="stat-label">Ollama connection</div><div class="stat-value">—</div></div>
      </div>
      <h3 class="section-title">Recent chats</h3>
      <div id="dash-recent"></div>
    `;

    const statsEl = document.getElementById('dash-stats');
    const recentEl = document.getElementById('dash-recent');

    const [sessionsResult, statusResult, modelsResult] = await Promise.allSettled([
      Api.listSessions(),
      Api.getOllamaStatus(),
      Api.getModels()
    ]);

    const sessions = sessionsResult.status === 'fulfilled' ? sessionsResult.value.sessions : [];
    const connected = statusResult.status === 'fulfilled' ? statusResult.value.connected : false;
    const models = modelsResult.status === 'fulfilled' ? modelsResult.value.models : [];

    const cards = statsEl.querySelectorAll('.stat-card');
    cards[0].querySelector('.stat-value').textContent = sessions.length;
    cards[1].querySelector('.stat-value').innerHTML = `0<span class="pill" style="margin-left:8px;">coming next</span>`;
    cards[1].insertAdjacentHTML('beforeend', '<div class="stat-hint">Document Library ships in the next build stage</div>');
    cards[2].querySelector('.stat-value').textContent = models.length;
    cards[3].querySelector('.stat-value').innerHTML = connected
      ? '<span style="color:var(--success)">Online</span>'
      : '<span style="color:var(--danger)">Offline</span>';
    if (!connected) {
      cards[3].insertAdjacentHTML('beforeend', '<div class="stat-hint">Run `ollama serve` and check Settings</div>');
    }

    if (sessions.length === 0) {
      recentEl.innerHTML = UI.emptyState({
        icon: '◔',
        title: 'No chats yet',
        desc: 'Start a conversation with your local model to see it appear here.',
        actionHtml: `<a href="#/chat" class="btn btn-primary" style="margin-top:14px;">Open AI Chat</a>`
      });
      return;
    }

    recentEl.innerHTML = `
      <div class="session-list">
        ${sessions
          .slice(0, 6)
          .map(
            (s) => `
          <a href="#/chat?session=${s.id}" class="session-item" style="padding:12px 14px; border:1px solid var(--border); border-radius:10px;">
            <span>${UI.escapeHtml(s.title)}</span>
            <span style="color:var(--text-faint)">${s.messageCount} msgs · ${new Date(s.updatedAt).toLocaleString()}</span>
          </a>`
          )
          .join('')}
      </div>
    `;
  }
};
