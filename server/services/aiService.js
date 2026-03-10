import ai from '../config/ai.js';

/**
 * Streams an AI explanation of the given code.
 * Yields text chunks as they arrive from Gemini.
 */
export async function* streamExplanation(code, language) {
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
    yield chunk.text;
  }
}
