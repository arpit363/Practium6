import { streamExplanation, streamComplexity, generateTestsAsJson } from '../services/aiService.js';

/**
 * POST /api/ai/explain
 * Streams an AI-powered code explanation using SSE.
 */
export async function explainCode(req, res) {
  const { code, language } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  // Set up Server-Sent Events (SSE) for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    for await (const text of streamExplanation(code, language)) {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error in explainCode:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate explanation', details: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.end();
    }
  }
}

/**
 * POST /api/ai/complexity
 * Streams an AI-powered code complexity analysis using SSE.
 */
export async function analyzeComplexity(req, res) {
  const { code, language } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  // Set up Server-Sent Events (SSE) for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    for await (const text of streamComplexity(code, language)) {
      res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error in analyzeComplexity:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate complexity analysis', details: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.end();
    }
  }
}

/**
 * POST /api/ai/generate-tests
 * Returns AI-generated unit tests as JSON.
 */
export async function generateTests(req, res) {
  const { code, language } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const tests = await generateTestsAsJson(code, language);
    res.json(tests);
  } catch (error) {
    console.error('Error in generateTests:', error);
    res.status(500).json({ error: 'Failed to generate tests', details: error.message });
  }
}
