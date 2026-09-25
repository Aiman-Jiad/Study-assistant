const State = {
  settings: null,
  models: [],
  ollamaConnected: null,

  async refreshSettings() {
    this.settings = await Api.getSettings();
    return this.settings;
  },

  async refreshModels() {
    try {
      const { models } = await Api.getModels();
      this.models = models;
      return models;
    } catch (err) {
      this.models = [];
      throw err;
    }
  },

  async refreshOllamaStatus() {
    try {
      const status = await Api.getOllamaStatus();
      this.ollamaConnected = status.connected;
      return status;
    } catch (err) {
      this.ollamaConnected = false;
      throw err;
    }
  }
};
