import LANGUAGE_MAP from '../config/languages.js';

const JUDGE0_API = 'https://ce.judge0.com';

/**
 * Executes code via the Judge0 CE API and returns { stdout, stderr, exitCode }.
 *
 * Judge0 uses a two-step flow:
 * 1. POST /submissions — submit the code, get a token
 * 2. GET  /submissions/:token — poll until status is done, get output
 */
export async function executeCode(code, language) {
  const runtime = LANGUAGE_MAP[language];

  if (!runtime) {
    throw new Error(`Unsupported language: ${language}`);
  }

  // Step 1: Submit code
  const submitRes = await fetch(`${JUDGE0_API}/submissions?base64_encoded=false&wait=false`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_code: code,
      language_id: runtime.id,
    }),
  });

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    throw new Error(`Judge0 submit error: ${submitRes.status} — ${errText}`);
  }

  const { token } = await submitRes.json();

  // Step 2: Poll for result (max ~15 seconds)
  let result = null;
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 1000)); // wait 1s between polls

    const pollRes = await fetch(
      `${JUDGE0_API}/submissions/${token}?base64_encoded=false&fields=stdout,stderr,status,exit_code,compile_output`
    );

    if (!pollRes.ok) {
      throw new Error(`Judge0 poll error: ${pollRes.status}`);
    }

    result = await pollRes.json();

    // Status id 1 = In Queue, 2 = Processing — keep polling
    // Anything >= 3 means done (Accepted, WA, TLE, RE, CE, etc.)
    if (result.status?.id >= 3) {
      break;
    }
  }

  if (!result || result.status?.id < 3) {
    throw new Error('Code execution timed out');
  }

  return {
    stdout: result.stdout || '',
    stderr: result.stderr || result.compile_output || '',
    exitCode: result.exit_code ?? -1,
  };
}
