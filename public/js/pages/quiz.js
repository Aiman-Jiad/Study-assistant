const QuizPage = {
  async render(root) {
    root.innerHTML = `
      ${UI.pageHeader('Quiz', 'AI-generated questions from your documents.')}
      ${UI.emptyState({
        icon: '✓',
        title: 'Quiz generation — later stage',
        desc: 'Quizzes are generated from real document content once the Library and Study Workspace are in place. Nothing to show yet, honestly.'
      })}
    `;
  }
};
