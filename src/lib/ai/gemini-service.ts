import {
  QuestionGenerationService,
  GeneratedQuestion,
  GenerationContext,
  EvaluationContext,
  EvaluationResult,
  AudioEvaluationContext,
  RoleSuggestion,
  CustomGenerationContext,
} from './generation-service';
import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from '@google/genai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';

export class GeminiQuestionGenerationService
  implements QuestionGenerationService
{
  private genAI: GoogleGenAI;
  private model: string = 'gemini-2.5-flash';

  constructor(apiKey: string) {
    this.genAI = new GoogleGenAI({ apiKey });
  }

  /**
   * Cleans the raw text response from the LLM to extract a JSON string.
   * @param text The raw string from the LLM.
   * @returns A cleaned string that is likely a JSON object or array.
   */
  private cleanJsonString(text: string): string {
    // Attempt to find a JSON object or array using regex
    let match = text.match(/\{[\s\S]*\}/); // For objects
    if (!match) {
      match = text.match(/\[[\s\S]*\]/); // For arrays
    }

    let cleaned = text;
    if (match && match[0]) {
      // If a JSON structure is found, use it
      cleaned = match[0];
    } else {
      // Fallback: remove markdown fences and trim whitespace
      cleaned = text.replace(/```json/g, '').replace(/```/g, '');
      cleaned = cleaned.replace(/```/g, '');
    }
    return cleaned.trim();
  }

  async generateQuestions(
    context: GenerationContext,
  ): Promise<GeneratedQuestion[]> {
    const { role, difficulty, count, existingQuestionContents } = context;
    const exclusionPrompt =
      existingQuestionContents && existingQuestionContents.length > 0
        ? `
    To ensure variety, please DO NOT generate questions that are substantively the same as the following already-existing questions:
    - ${existingQuestionContents.join('\n- ')}
    `
        : '';

    const prompt = `
      You are a pragmatic and expert technical interviewer. Your task is to generate ${count} high-quality, grounded, multi-part interview question(s) suitable for a verbal response.

      The questions should test practical, real-world knowledge, not just theoretical definitions. Each question should follow this structure:
      1.  **Core Concept Definition:** Ask for an explanation of a principle, pattern, or technology.
      2.  **Rationale/Benefit:** Ask why it's used or what problem it solves.
      3.  **Practical Application:** Ask for a simple code example, a refactoring task, or an explanation of a process.

      ${exclusionPrompt}

      Here are two examples of the high-quality, multi-part questions I expect:

      **Example 1 (for a PHP role):**
      "Let's start with the 'S' in SOLID, the Single Responsibility Principle (SRP). Can you explain what this principle states? What is the main benefit of following it, and could you give a simple PHP example of a class that violates the principle and then how you might refactor it to adhere to SRP?"
      
      **Example 2 (for a React role):**
      "When fetching data from an API in a React component, what are the three key states you need to manage in your component's state? Can you walk me through how you would use the \`useEffect\` and \`useState\` hooks to manage these states and render the UI accordingly? For instance, fetching a list of users from a \`/api/users\` endpoint."

      The response MUST be a single raw JSON array of objects, without any markdown formatting or surrounding text. Each object in the array should have the following structure:
      {
        "question": "The full text of the interview question.",
        "ideal_answer_summary": "A concise summary of what a good answer should contain, covering all parts of the question (definition, rationale, and application). This will be used by another AI to evaluate the user's response.",
        "topics": ["topic1", "topic2"]
      }

      Now, generate ${count} question(s) for the role of "${role}" following this multi-part structure.
    `;

    try {
      const result = await this.genAI.models.generateContent({
        model: this.model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = result.text || '';
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }
      const cleanedText = this.cleanJsonString(text);
      if (!cleanedText) {
        console.error(
          'Gemini response for questions was empty after cleaning.',
        );
        throw new Error(
          'Failed to get a valid response from the AI for generating questions.',
        );
      }

      let questions = JSON.parse(cleanedText);
      if (!Array.isArray(questions)) {
        questions = [questions];
      }

      return (questions as any[]).map((q) => ({
        question: q.question,
        ideal_answer_summary: q.ideal_answer_summary,
        topics: q.topics || [],
      }));
    } catch (error) {
      console.error('Error generating questions with Gemini:', error);
      throw error;
    }
  }

  async generateQuestionsFromPrompt(
    context: CustomGenerationContext,
  ): Promise<GeneratedQuestion[]> {
    const {
      prompt,
      count,
      role,
      questionType,
      temperature,
      maxTokens,
      existingQuestionContents,
    } = context;
    console.log('Generating questions from prompt:', {
      prompt,
      count,
      role,
      questionType,
      temperature,
      maxTokens,
    });

    const exclusionPrompt =
      existingQuestionContents && existingQuestionContents.length > 0
        ? `
    To ensure variety, please DO NOT generate questions that are substantively the same as the following already-existing questions:
    - ${existingQuestionContents.join('\n- ')}
    `
        : '';

    const systemPrompt = `
      You are an expert and pragmatic technical interviewer. Your task is to generate ${count} high-quality, open-ended interview question(s) suitable for a verbal response based on the user's prompt. Where possible, try to create multi-part questions that ask for a definition, a rationale, and a practical example.

      ${exclusionPrompt}

      The user's request is: "${prompt}".
      ${role ? `The question should be for a candidate interviewing for the role of: "${role}".` : 'The question should be general and applicable to various professional contexts.'}
      ${questionType ? `The question should be of type: "${questionType}".` : ''}

      The response MUST be a single raw JSON array of objects, without any markdown formatting or surrounding text. Each object in the array should have the following structure:
      {
        "question": "The full text of the interview question.",
        "ideal_answer_summary": "A concise summary of what a good answer should contain. This will be used by another AI to evaluate the user's response.",
        "topics": ["topic1", "topic2"]
      }
    `;
    const config = {
      temperature: temperature || 0.7,
      maxOutputTokens: maxTokens || 5000,
    };
    const contents = [{ role: 'user', parts: [{ text: systemPrompt }] }];

    try {
      const result = await this.genAI.models.generateContent({
        model: this.model,
        contents: contents,
        config: config,
      });
      const text = result.text || '';
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }
      const cleanedText = this.cleanJsonString(text);
      if (!cleanedText) {
        throw new Error(
          'Gemini response for custom questions was empty after cleaning.',
        );
      }

      let questions = JSON.parse(cleanedText);
      if (!Array.isArray(questions)) {
        questions = [questions];
      }

      return (questions as any[]).map((q) => ({
        question: q.question,
        ideal_answer_summary: q.ideal_answer_summary,
        topics: q.topics || [],
      }));
    } catch (error) {
      console.error(
        'Error generating questions from prompt with Gemini:',
        error,
      );
      throw error;
    }
  }

  async evaluateAnswer(context: EvaluationContext): Promise<EvaluationResult> {
    const { question, userAnswer, idealAnswerSummary } = context;
    const prompt = `
      You are an expert AI evaluating a candidate's verbal answer to a technical interview question. Your response MUST be a single raw JSON object.

      **CONTEXT:**
      *   **Interview Question:** "${question}"
      *   **Candidate's Answer:** "${userAnswer}"
      *   **Ideal Answer Summary (Key points to look for):** "${idealAnswerSummary}"

      **YOUR TASK:**
      Provide a structured, constructive evaluation of the candidate's answer. The tone should be encouraging but precise. The output must be a single JSON object with this exact structure:
      {
        "score": "A numerical score from 0 to 100 representing the quality of the answer.",
        "feedbackSummary": "A brief, one-sentence summary of the performance. e.g., 'That was a fantastic explanation.' or 'A good start, but some key details were missing.'",
        "evaluation": {
          "accuracy": "Evaluate the technical accuracy. Mention specific points that were correct or incorrect, referencing the ideal answer summary.",
          "depthAndClarity": "Assess how clearly and deeply the candidate explained the concepts. Was it superficial or did it show true understanding?",
          "completeness": "Was the answer complete? Did it address all parts of the question? What was missing?"
        },
        "overallImpression": "A concluding paragraph summarizing the performance and giving an overall impression.",
        "refinedExampleAnswer": "Provide a well-written, complete, and ideal example answer for this question, suitable for documentation or study. You can include markdown and code blocks here if appropriate."
      }

      Now, evaluate the candidate's answer based on the provided context.
    `;

    try {
      const result = await this.genAI.models.generateContent({
        model: this.model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = result.text || '';
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }
      const cleanedText = this.cleanJsonString(text);

      if (!cleanedText) {
        throw new Error(
          'Failed to get a valid response from the AI for answer evaluation.',
        );
      }

      const evaluation = JSON.parse(cleanedText);
      // Ensure score is a number
      evaluation.score = Number(evaluation.score) || 0;
      return evaluation as EvaluationResult;
    } catch (error) {
      console.error('Error evaluating answer with Gemini:', error);
      throw error;
    }
  }

  async evaluateAudioAnswer(
    context: AudioEvaluationContext,
  ): Promise<EvaluationResult & { transcription: string }> {
    const { question, idealAnswerSummary, audioBuffer, mimeType } = context;

    const tempFileName = `${crypto.randomBytes(16).toString('hex')}.webm`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);
    let uploadedFileResponse;

    try {
      // 1. Write audio buffer to a temporary file
      await fs.promises.writeFile(tempFilePath, audioBuffer);

      // 2. Upload the file to the Files API
      uploadedFileResponse = await this.genAI.files.upload({
        file: tempFilePath,
        config: { mimeType: mimeType || 'audio/webm' },
      });

      const audioPart = {
        fileData: {
          mimeType: uploadedFileResponse.mimeType,
          fileUri: uploadedFileResponse.uri,
        },
      };

      const prompt = `
      You are an expert AI interviewer and evaluator. A user has provided an audio recording as their answer to an interview question.
      Your task is to first transcribe the audio and then evaluate the transcription.

      **CONTEXT:**
      *   **Interview Question:** "${question}"
      *   **Ideal Answer Summary (Key points to look for):** "${idealAnswerSummary}"
      *   The user's audio answer is provided as an audio part.

      **YOUR TASK:**
      Provide a structured, constructive evaluation. Your response MUST be a single raw JSON object with this exact structure. Ensure all string values within the JSON are properly escaped to avoid parsing errors.
      {
        "transcription": "A highly accurate transcription of the user's spoken answer from the audio file.",
        "score": "A numerical score from 0 to 100 representing the quality of the answer.",
        "feedbackSummary": "A brief, one-sentence summary of the performance. e.g., 'That was a fantastic explanation.' or 'A good start, but some key details were missing.'",
        "evaluation": {
          "accuracy": "Evaluate the technical accuracy. Mention specific points that were correct or incorrect, referencing the ideal answer summary.",
          "depthAndClarity": "Assess how clearly and deeply the candidate explained the concepts. Was it superficial or did it show true understanding?",
          "completeness": "Was the answer complete? Did it address all parts of the question? What was missing?"
        },
        "overallImpression": "A concluding paragraph summarizing the performance and giving an overall impression.",
        "refinedExampleAnswer": "Provide a well-written, complete, and ideal example answer for this question, suitable for documentation or study. You can include markdown and code blocks here if appropriate."
      }

      Now, transcribe the audio and evaluate the candidate's answer based on the provided context.
    `;

      // 3. Generate content using the file
      const result = await this.genAI.models.generateContent({
        model: this.model,
        contents: [{ role: 'user', parts: [{ text: prompt }, audioPart] }],
      });
      const text = result.text || '';
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }
      const cleanedText = this.cleanJsonString(text);
      console.log('Cleaned text from Gemini (audio evaluation):', cleanedText);

      if (!cleanedText) {
        throw new Error(
          'Failed to get a valid response from the AI for audio evaluation.',
        );
      }

      const evaluation = JSON.parse(cleanedText);
      evaluation.score = Number(evaluation.score) || 0;
      return evaluation as EvaluationResult & { transcription: string };
    } catch (error) {
      console.error('Error evaluating audio answer with Gemini:', error);
      throw error;
    } finally {
      // 4. Clean up
      if (uploadedFileResponse) {
        if (uploadedFileResponse.name) {
          await this.genAI.files.delete({ name: uploadedFileResponse.name });
        }
      }
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (unlinkError) {
        console.error(
          `Failed to delete temporary file: ${tempFilePath}`,
          unlinkError,
        );
      }
    }
  }

  async refineRole(role: string): Promise<RoleSuggestion[]> {
    const prompt = `
      You are an expert career coach and technical recruiter. Your task is to take a user-provided job role and refine it into several standardized, professional job titles. For each title, provide a concise, one-paragraph description of the role's primary responsibilities.

      The user-provided role is: "${role}".

      Please generate 3 distinct and relevant variations. If the input is very specific, you can provide fewer, more focused options. If the input is vague or nonsensical, provide common, related roles.

      Your response MUST be a single raw JSON array of objects, without any markdown formatting or surrounding text. Each object in the array should have the following structure:
      {
        "name": "The standardized, professional job title.",
        "description": "A one-paragraph summary of the role's key responsibilities, suitable for a user to understand what the job entails."
      }

      Example for user input "php dev":
      [
        {
          "name": "Junior PHP Developer (Laravel)",
          "description": "Focuses on developing and maintaining web applications using the PHP language and the Laravel framework. Responsibilities include writing server-side logic, integrating front-end elements, managing databases, and collaborating with a team to deliver high-quality software solutions under supervision."
        },
        {
          "name": "Backend Web Developer (PHP)",
          "description": "Specializes in server-side development using PHP. This role involves building and maintaining the technology that powers the components which, together, enable the user-facing side of the website to exist. Key tasks include database management, API development, and ensuring server performance and scalability."
        },
        {
          "name": "Full-Stack Developer (LAMP Stack)",
          "description": "Works on both the front-end and back-end of applications built on the LAMP (Linux, Apache, MySQL, PHP) stack. This role requires a broad skill set, including user interface design, server-side scripting with PHP, and database administration with MySQL, to build complete web solutions."
        }
      ]

      Now, process the role "${role}" and provide ONLY the JSON array as your response.
    `;

    try {
      const result = await this.genAI.models.generateContent({
        model: this.model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });
      const text = result.text || '';
      if (!text) {
        throw new Error('Empty response from Gemini API');
      }
      const cleanedText = this.cleanJsonString(text);
      if (!cleanedText) {
        throw new Error(
          'Gemini response for role refinement was empty after cleaning.',
        );
      }

      const suggestions = JSON.parse(cleanedText);
      return suggestions as RoleSuggestion[];
    } catch (error) {
      console.error('Error refining role with Gemini:', error);
      throw error;
    }
  }
}
