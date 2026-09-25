const SettingsPage = {
  async render(root) {
    await State.refreshSettings();
    const s = State.settings;

    root.innerHTML = `
      ${UI.pageHeader('Settings', 'Configure your connection to Ollama.')}
      <div class="card" style="max-width:520px;">
        <div class="field">
          <label>Ollama base URL</label>
          <input type="text" id="ollama-url" value="${UI.escapeHtml(s.ollamaUrl)}" placeholder="http://localhost:11434" />
          <span class="field-hint">This is where your locally running Ollama server listens.</span>
        </div>

        <div style="display:flex; align-items:center; gap:10px; margin-bottom:18px;">
          <button class="btn" id="test-conn-btn">Test connection</button>
          <span id="conn-result" style="font-size:12.5px; color:var(--text-muted);"></span>
        </div>

        <div class="field">
          <label>Model</label>
          <select id="model-select">
            <option value="">Loading models…</option>
          </select>
          <span class="field-hint">Pulled via <code>ollama pull &lt;model&gt;</code> on your machine.</span>
        </div>

        <button class="btn btn-primary" id="save-settings-btn">Save settings</button>
      </div>
    `;

    const urlInput = document.getElementById('ollama-url');
    const modelSelect = document.getElementById('model-select');
    const connResult = document.getElementById('conn-result');

    const loadModels = async () => {
      modelSelect.innerHTML = `<option value="">Loading models…</option>`;
      try {
        await State.refreshModels();
        if (State.models.length === 0) {
          modelSelect.innerHTML = `<option value="">No models found — run "ollama pull llama3.2"</option>`;
          return;
        }
        modelSelect.innerHTML = State.models
          .map(
            (m) =>
              `<option value="${UI.escapeHtml(m.name)}" ${m.name === s.selectedModel ? 'selected' : ''}>${UI.escapeHtml(
                m.name
              )}${m.parameterSize ? ' — ' + m.parameterSize : ''}</option>`
          )
          .join('');
      } catch (err) {
        modelSelect.innerHTML = `<option value="">Could not reach Ollama</option>`;
        UI.toast('Could not load models: ' + err.message, 'error');
      }
    };

    document.getElementById('test-conn-btn').addEventListener('click', async () => {
      connResult.textContent = 'Checking…';
      try {
        await Api.updateSettings({ ollamaUrl: urlInput.value.trim() });
        const status = await Api.getOllamaStatus();
        connResult.textContent = status.connected ? '✓ Connected' : `✗ ${status.error || 'Not reachable'}`;
        connResult.style.color = status.connected ? 'var(--success)' : 'var(--danger)';
        if (status.connected) await loadModels();
        UI.updateStatusPill();
      } catch (err) {
        connResult.textContent = '✗ ' + err.message;
        connResult.style.color = 'var(--danger)';
      }
    });

    document.getElementById('save-settings-btn').addEventListener('click', async () => {
      try {
        const updated = await Api.updateSettings({
          ollamaUrl: urlInput.value.trim(),
          selectedModel: modelSelect.value
        });
        State.settings = updated;
        UI.toast('Settings saved', 'success');
        UI.updateStatusPill();
      } catch (err) {
        UI.toast('Failed to save: ' + err.message, 'error');
      }
    });

    await loadModels();
  }
};
