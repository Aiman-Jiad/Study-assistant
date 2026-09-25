const Router = {
  routes: {
    dashboard: DashboardPage,
    library: LibraryPage,
    workspace: WorkspacePage,
    chat: ChatPage,
    quiz: QuizPage,
    flashcards: FlashcardsPage,
    settings: SettingsPage
  },

  parseHash() {
    const hash = window.location.hash.replace(/^#\//, '') || 'dashboard';
    const [routePart, queryPart] = hash.split('?');
    const params = {};
    if (queryPart) {
      new URLSearchParams(queryPart).forEach((v, k) => (params[k] = v));
    }
    return { route: routePart || 'dashboard', params };
  },

  async navigate() {
    const { route, params } = this.parseHash();
    const page = this.routes[route] || DashboardPage;

    document.querySelectorAll('.nav-item').forEach((el) => {
      el.classList.toggle('active', el.dataset.route === route);
    });

    const root = document.getElementById('page-root');
    try {
      await page.render(root, params);
    } catch (err) {
      console.error(err);
      root.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠</div>
          <div class="empty-title">Something went wrong loading this page</div>
          <div class="empty-desc">${UI.escapeHtml(err.message)}</div>
        </div>
      `;
    }
  }
};

function initTheme() {
  const saved = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('theme-toggle').textContent = saved === 'dark' ? '🌙' : '☀️';

  document.getElementById('theme-toggle').addEventListener('click', async () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    document.getElementById('theme-toggle').textContent = next === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('theme', next);
    try {
      await Api.updateSettings({ theme: next });
    } catch (_) {
      // non-fatal - theme still works client-side even if persistence fails
    }
  });
}

window.addEventListener('hashchange', () => Router.navigate());

window.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  UI.updateStatusPill();
  setInterval(() => UI.updateStatusPill(), 15000);
  await Router.navigate();
});
