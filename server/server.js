import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini using the new SDK
// Requires GEMINI_API_KEY in .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// API Routes
app.post('/api/ai/explain', async (req, res) => {
  const { code, language } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code is required' });
  }

  // Set up Server-Sent Events (SSE) for streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const prompt = `
    You are Apollo, an expert AI coding tutor.
    Explain the following ${language || 'programming'} code clearly, step-by-step, to a beginner.
    Break down what the code does, any important syntax, and the overall purpose.
    Format your response in Markdown.

    Code to explain:
    \`\`\`${language || ''}
    ${code}
    \`\`\`
    `;

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    for await (const chunk of responseStream) {
       // Send each chunk to the client as an SSE event
       res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
    }

    // Tell the client the stream is finished
    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Error in /api/ai/explain stream:', error);
    // If headers are already sent, we just end the stream. Otherwise send a 500.
    if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to generate explanation', details: error.message });
    } else {
        res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
        res.end();
    }
  }
});

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Apollo Backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
