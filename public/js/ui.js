const UI = (() => {
  function toast(message, type = 'default') {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    root.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function emptyState({ icon, title, desc, actionHtml }) {
    return `
      <div class="empty-state">
        <div class="empty-icon">${icon}</div>
        <div class="empty-title">${escapeHtml(title)}</div>
        <div class="empty-desc">${escapeHtml(desc)}</div>
        ${actionHtml || ''}
      </div>
    `;
  }

  async function updateStatusPill() {
    const pill = document.getElementById('ollama-status-pill');
    const dot = pill.querySelector('.status-dot');
    const text = pill.querySelector('.status-text');
    try {
      const status = await State.refreshOllamaStatus();
      if (status.connected) {
        dot.className = 'status-dot status-dot--connected';
        text.textContent = 'Ollama connected';
      } else {
        dot.className = 'status-dot status-dot--disconnected';
        text.textContent = 'Ollama offline';
      }
    } catch (err) {
      dot.className = 'status-dot status-dot--disconnected';
      text.textContent = 'Ollama offline';
    }
  }

  function pageHeader(title, subtitle) {
    return `
      <div class="page-header">
        <h1 class="page-title">${escapeHtml(title)}</h1>
        <p class="page-subtitle">${escapeHtml(subtitle || '')}</p>
      </div>
    `;
  }

  return { toast, escapeHtml, emptyState, updateStatusPill, pageHeader };
})();
