const WorkspacePage = {
  async render(root) {
    root.innerHTML = `
      ${UI.pageHeader('Study Workspace', 'Summaries, key points, and document Q&A.')}
      ${UI.emptyState({
        icon: '▦',
        title: 'Study Workspace — arrives with RAG in a later stage',
        desc: 'Once documents and retrieval-augmented Q&A are wired up (Stages 2–3), this is where you\'ll generate summaries, key points, and ask questions grounded in your own material.'
      })}
    `;
  }
};
