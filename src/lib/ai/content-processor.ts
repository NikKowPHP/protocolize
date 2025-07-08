import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not defined.');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export async function extractProtocolsFromTranscript(transcript: string) {
  const prompt = `
    Analyze the following podcast transcript. Your task is to extract actionable health and wellness protocols.
    For each protocol found, provide its name, a concise description, a step-by-step implementation guide, and a relevant category (e.g., "Sleep", "Focus", "Nutrition", "Fitness", "Mental Health", "Circadian Rhythm").
    Additionally, create a main summary for the entire episode.
    Return the data as a single, minified JSON object with no markdown formatting. The structure should be:
    {
      "episodeSummary": "string",
      "protocols": [
        {
          "name": "string",
          "category": "string",
          "description": "string",
          "implementationGuide": "string"
        }
      ]
    }
    
    Transcript:
    ---
    ${transcript.substring(0, 30000)}
    ---
  `;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedJson = responseText
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error('Error processing transcript with Gemini:', error);
    throw new Error('Failed to parse AI response.');
  }
}