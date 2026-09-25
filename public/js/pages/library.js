const LibraryPage = {
  async render(root) {
    root.innerHTML = `
      ${UI.pageHeader('Library', 'Upload and manage your study material.')}
      ${UI.emptyState({
        icon: '▥',
        title: 'Document Library — coming in the next build stage',
        desc: 'Stage 2 adds real PDF/TXT/Markdown upload, storage, and text extraction so you can select a document and study it with AI. Nothing here is faked in the meantime.'
      })}
    `;
  }
};
