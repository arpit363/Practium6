const API_BASE = 'http://localhost:5000';

/**
 * Streams an AI code explanation via SSE.
 * Calls the provided `onChunk` callback with each text token.
 */
export async function streamExplainCode({ code, language, onChunk, onDone, onError }) {
  try {
    const response = await fetch(`${API_BASE}/api/ai/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch explanation');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;

      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();

            if (dataStr === '[DONE]') {
              done = true;
              break;
            }

            if (dataStr) {
              try {
                const dataObj = JSON.parse(dataStr);
                onChunk(dataObj.text);
              } catch (e) {
                console.error('Error parsing stream chunk', dataStr);
              }
            }
          }
        }
      }
    }

    onDone?.();
  } catch (error) {
    console.error(error);
    onError?.(error);
  }
}

/**
 * Executes code via the backend Piston proxy.
 * Returns { stdout, stderr, exitCode }.
 */
export async function runCode({ code, language }) {
  const response = await fetch(`${API_BASE}/api/code/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Execution failed');
  }

  return result;
}
