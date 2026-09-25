const FlashcardsPage = {
  async render(root) {
    root.innerHTML = `
      ${UI.pageHeader('Flashcards', 'Spaced-repetition-ready cards from your documents.')}
      ${UI.emptyState({
        icon: '◱',
        title: 'Flashcards — later stage',
        desc: 'Flashcard generation lands alongside Quiz, built from real document content rather than sample data.'
      })}
    `;
  }
};
