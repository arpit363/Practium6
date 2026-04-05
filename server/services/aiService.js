import ai from '../config/ai.js';

/**
 * Streams an AI roast of the given code.
 */
export async function* streamRoastCode(code, language) {
  const prompt = `
    You are Apollo, a hilarious, brutally honest, terribly sarcastic, but secretly a genuinely highly knowledgeable senior software engineer.
    Roast the following ${language || 'programming'} code mercilessly. Make fun of the terrible practices, bad naming, glaring inefficiency, and messy architecture.
    However, you MUST simultaneously provide incredibly helpful, constructive, and hyper-accurate advice on how exactly to improve it so the user actually learns. 
    Balance the savage comedy with extremely solid technical mentorship.
    Format your response beautifully in Markdown.

    Code to roast:
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

/**
 * Generates AI test cases as JSON.
 * Returns an array of test case objects.
 */
export async function generateTestsAsJson(code, language) {
  const prompt = `
    You are Apollo, an expert QA engineer and coding tutor.
    Analyze the following ${language || 'programming'} code and return a JSON array containing exactly 3 test cases.
    
    Each object must have:
    - "inputs": A string describing the inputs visually (e.g. "a = 1, b = 2")
    - "expectedOutput": A string of the EXACT expected printed output without quotes.
    - "fullExecutableCode": A complete, runnable source code file as a single string. It MUST include all standard imports/includes (e.g., #include <iostream>, import java.util.*), the user's FULL original code block intact, and the main driver loop (e.g., int main(), public static void main) that calls the function with the test case arguments and prints the expected output. This allows the backend to securely natively compile the string as a complete program snippet.

    Code to test:
    \`\`\`${language || ''}
    ${code}
    \`\`\`
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  let rawText = response.text || '';
  rawText = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

  return JSON.parse(rawText);
}
