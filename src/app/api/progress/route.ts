import { NextResponse } from 'next/server';
import { progressService } from '@/lib/progress';
import { getCurrentUser } from '@/lib/supabase/server';
import { ensureUserInDb } from '@/lib/user';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30_days';
    const type = searchParams.get('type') || 'all';

    const metrics = await progressService.getUserMetrics(user.id);
    const analytics = await progressService.aggregateAnalyticsData(user.id);

    return NextResponse.json({
      metrics,
      analytics
    });
  } catch (error: unknown) {
    const message = error instanceof Error 
      ? error.message 
      : 'Failed to fetch progress data';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await ensureUserInDb(user);

    const { questionId, remembered } = await request.json();
    await progressService.updateProgressAfterReview(
      user.id, 
      questionId, 
      remembered
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error 
      ? error.message 
      : 'Failed to update progress';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}