import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { schedulerService } from '@/lib/scheduler';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(req.url);
    const objectiveId = searchParams.get('objectiveId');

    if (!objectiveId) {
      return NextResponse.json({ error: 'objectiveId is required' }, { status: 400 });
    }

    const nextQuestion = await schedulerService.getNextBestQuestion(user.id, objectiveId);

    return NextResponse.json(nextQuestion);
  } catch (error) {
    console.error('Error getting next practice question:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}