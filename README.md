# Local AI Study Assistant

A local-first study application powered entirely by [Ollama](https://ollama.com). No OpenAI, no Gemini, no cloud AI calls of any kind — every AI response comes from a model running on your own machine.

> **Build status: Stage 1 — Foundation.** This is a real, running app, not a mockup. Ollama connectivity, model selection, and AI chat are fully functional end-to-end. The Library, Study Workspace, Quiz, and Flashcards screens are honest empty-state placeholders until their stages land (see [Roadmap](#roadmap)) — nothing on those screens is faked.

## What works right now

- Live connection check against your local Ollama server
- Real model listing (`GET /api/tags`) with a picker in Settings
- Full AI chat with real streaming responses (`POST /api/chat`, `stream: true`)
- Persisted chat history (JSON-backed) — sessions survive restarts
- Dashboard with real counts (chat sessions, models available, connection state) — zero hardcoded numbers
- Dark/light theme toggle, persisted
- Loading, error, and empty states throughout

## Prerequisites

1. **[Ollama](https://ollama.com/download)** installed and running:
   ```bash
   ollama serve
   ```
2. At least one model pulled:
   ```bash
   ollama pull llama3.2
   ```
3. **Node.js 18+** (for native `fetch`).

## Setup

```bash
git clone <your-repo-url>
cd local-ai-study-assistant
npm install
npm start
```

Then open **http://localhost:4173**.

On first launch, go to **Settings**, confirm the Ollama URL (defaults to `http://localhost:11434`), click **Test connection**, and pick a model. Then head to **AI Chat**.

### Custom port
```bash
PORT=5000 npm start
```

## Architecture

```
server/
  index.js            Express app entry point
  routes/
    ollama.js          /api/ollama/* — status, model list, streaming chat proxy
    settings.js         /api/settings — get/update Ollama URL, selected model, theme
    chats.js             /api/chats — session CRUD, persisted message history
  lib/
    ollama.js           Real Ollama HTTP client (fetch-based, no mocking)
    settings.js          JSON-file settings store
    chatStore.js          JSON-file chat history store
  data/                  Generated at runtime (settings.json, chats.json) — gitignored

public/
  index.html            App shell + sidebar nav
  css/styles.css          Theme variables + component styles
  js/
    api.js                 Frontend API client (fetch wrappers, streaming reader)
    state.js                Shared client-side state
    ui.js                    Toasts, empty states, status pill
    app.js                    Hash router + theme toggle
    pages/                    One module per screen (dashboard, library, workspace, chat, quiz, flashcards, settings)
```

**Why JSON files instead of a database engine?** Stage 1 has zero external dependencies beyond Express, so `npm install` can't fail on native bindings. This will very likely move to SQLite (via `better-sqlite3`) once the Document Library stage introduces documents, chunks, and embeddings, where relational queries start to matter.

**Why no frontend framework?** Vanilla JS keeps the whole app runnable with `node server/index.js` — no build step, no bundler, nothing that can break in a constrained environment.

## Roadmap (staged build)

- [x] **1. Foundation** — Ollama connection, model selection, real streaming chat, app shell, theming
- [ ] **2. Document Library** — Upload PDF/TXT/Markdown, real text extraction, storage, document list/detail views
- [ ] **3. AI Study Tools + RAG** — Chunking, embeddings via Ollama's `/api/embeddings`, similarity search, document-grounded Q&A, summaries, key points
- [ ] **4. Quiz + Flashcards** — Generated from real document content via structured prompts
- [ ] **5. Personalization** — Per-document chat history, study progress tracking
- [ ] **6. Polish** — Animations, keyboard shortcuts, accessibility pass

Each stage is meant to be reviewed before the next begins.

## Notes

- All data (settings, chat history, and — starting in Stage 2 — documents) lives in `server/data/`, which is gitignored. Nothing personal is committed.
- The app never talks to any AI service other than the Ollama URL configured in Settings.
