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
 * Streams an AI complexity analysis via SSE.
 * Calls the provided `onChunk` callback with each text token.
 */
export async function streamAnalyzeComplexity({ code, language, onChunk, onDone, onError }) {
  try {
    const response = await fetch(`${API_BASE}/api/ai/complexity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch complexity analysis');
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

export async function signupUser({ username, email, password }) {
  const response = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Signup failed');
  }
  return response.json();
}

export async function verifyOtp({ email, otp }) {
  const response = await fetch(`${API_BASE}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'OTP verification failed');
  }
  return response.json();
}

export async function loginUser({ email, password }) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }
  return response.json();
}
