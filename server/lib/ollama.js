/**
 * Thin client around the real Ollama HTTP API.
 * Docs: https://github.com/ollama/ollama/blob/main/docs/api.md
 *
 * Nothing in this file is mocked or hardcoded - every function makes a real
 * HTTP request to whatever Ollama base URL is configured in settings.
 */

async function checkConnection(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, { method: 'GET' });
    if (!res.ok) {
      return { connected: false, error: `Ollama responded with status ${res.status}` };
    }
    return { connected: true };
  } catch (err) {
    return { connected: false, error: err.message };
  }
}

async function listModels(baseUrl) {
  const res = await fetch(`${baseUrl}/api/tags`, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Ollama returned status ${res.status} while listing models`);
  }
  const data = await res.json();
  // Ollama's /api/tags returns { models: [{ name, model, size, digest, modified_at, details }, ...] }
  return (data.models || []).map((m) => ({
    name: m.name || m.model,
    size: m.size,
    modifiedAt: m.modified_at,
    parameterSize: m.details && m.details.parameter_size,
    quantization: m.details && m.details.quantization_level,
    family: m.details && m.details.family
  }));
}

/**
 * Streams a chat completion from Ollama and pipes raw NDJSON chunks to onChunk.
 * messages: [{ role: 'user' | 'assistant' | 'system', content: string }]
 */
async function streamChat(baseUrl, { model, messages, onChunk, signal }) {
  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
    signal
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => '');
    throw new Error(`Ollama chat request failed (status ${res.status}): ${text}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex;
    while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!line) continue;
      try {
        const json = JSON.parse(line);
        onChunk(json);
      } catch (err) {
        console.error('Failed to parse Ollama stream line:', line, err.message);
      }
    }
  }
}

/**
 * Non-streaming generate call, used for one-shot tasks like summaries,
 * key points, quiz generation, and flashcard generation.
 */
async function generate(baseUrl, { model, prompt, system }) {
  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      system,
      stream: false
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Ollama generate request failed (status ${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.response;
}

async function embed(baseUrl, { model, input }) {
  const res = await fetch(`${baseUrl}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: input })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Ollama embeddings request failed (status ${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.embedding;
}

module.exports = { checkConnection, listModels, streamChat, generate, embed };
