import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GeminiQuestionGenerationService } from '@/lib/ai/gemini-service';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not defined');
}

const roleRefiner = new GeminiQuestionGenerationService(apiKey);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { role } = await req.json();
    if (typeof role !== 'string' || !role.trim()) {
      return NextResponse.json({ error: 'Invalid input: role is required' }, { status: 400 });
    }

    // Use the new refineRole method
    const suggestions = await roleRefiner.refineRole(role);
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error refining role:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}