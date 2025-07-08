import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateReadiness } from '@/lib/readiness';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { overall, breakdown } = await calculateReadiness(user.id);
    
    // Determine level based on score
    let level = 'beginner';
    if (overall >= 70) level = 'advanced';
    else if (overall >= 40) level = 'intermediate';

    // Calculate next review date (3 days from now by default)
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + 3);

    return NextResponse.json({
      overall: {
        score: overall,
        level,
        nextReviewDate: nextReviewDate.toISOString()
      },
      breakdown
    });

  } catch (error) {
    console.error('Error calculating readiness:', error);
    return NextResponse.json({ error: 'Failed to calculate readiness' }, { status: 500 });
  }
}