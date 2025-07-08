import { NextRequest, NextResponse } from 'next/server';

declare module 'openai' {
  export default class OpenAI {
    constructor(options: { apiKey: string });

    completions: {
      create: (params: {
        model: string;
        prompt: string;
        max_tokens?: number;
        temperature?: number;
      }) => Promise<{
        choices: {
          text: string;
        }[];
      }>;
    };
  }
}

export function POST(req: NextRequest): Promise<NextResponse>;