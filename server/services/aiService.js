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

/**
 * Streams an AI time and space complexity analysis of the given code.
 * Yields text chunks as they arrive from Gemini.
 */
export async function* streamComplexity(code, language) {
  const prompt = `
    You are Apollo, an expert AI coding tutor.
    Analyze the time and space complexity of the following ${language || 'programming'} code.
    Provide the exact Big O notation for both time and space complexity at the very beginning, then briefly explain your reasoning step-by-step.
    Format your response in Markdown, using appropriate headers and bullet points.

    Code to analyze:
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
