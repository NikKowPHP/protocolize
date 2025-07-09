import { GoogleGenerativeAI } from "@google/generative-ai";

export interface Protocol {
  title: string;
  description: string;
  steps: string[];
}

export interface TranscriptAnalysis {
  episodeSummary: string;
  protocols: Protocol[];
}

export async function extractProtocolsFromTranscript(transcript: string): Promise<TranscriptAnalysis> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
    Analyze this podcast transcript and extract:
    1. A concise episode summary (2-3 sentences)
    2. A list of protocols mentioned, where each protocol has:
       - A clear title
       - A brief description 
       - Step-by-step instructions
    
    Return the analysis as valid JSON with this structure:
    {
      "episodeSummary": string,
      "protocols": [
        {
          "title": string,
          "description": string,
          "steps": string[]
        }
      ]
    }

    Transcript:
    ${transcript}
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  try {
    return JSON.parse(text) as TranscriptAnalysis;
  } catch (err) {
    throw new Error(`Failed to parse AI response: ${err}`);
  }
}