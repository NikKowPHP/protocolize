import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import type { Prisma } from '@prisma/client';
import { calculateNextReview } from '@/lib/srs';
import { ensureUserInDb } from '@/lib/user';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const topics = url.searchParams.get('topics')?.split(',').filter(Boolean) || [];

    const where: Prisma.QuestionWhereInput = {
      userId: user.id,
    };

    if (topics.length > 0) {
      where.topics = {
        hasSome: topics
      };
    }

    // Get all questions for the user based on filters
    const questionsFromDb = await prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const questions = questionsFromDb.map((question) => {
      const { daysUntilReview } = calculateNextReview(question);
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + daysUntilReview);
      return { ...question, nextReviewDate: nextReviewDate.toISOString() };
    });

    return NextResponse.json({ questions });
    
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Database Error:', error.message);
    } else {
      console.error('Unknown Error:', error);
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  try {
    const body = await req.json();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await ensureUserInDb(user);

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { content, category, difficulty, topics, answer } = body;

    if (!content || !answer) {
      return NextResponse.json({ error: 'Missing required fields: content, answer' }, { status: 400 });
    }

    if (typeof content !== 'string' || typeof answer !== 'string') {
      return NextResponse.json({ error: 'Invalid field types for content or answer' }, { status: 400 });
    }

    const question = await prisma.question.create({
      data: {
        content: content.trim(),
        answer: answer.trim(),
        category: category ? category.trim() : null,
        difficulty: difficulty ? difficulty.trim() : null,
        topics: topics || [],
        userId: user.id,
      } as any, // Temporarily cast to any to bypass type error, will regenerate prisma client
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    if (error instanceof Error) {
      console.error('Database Error:', error.message);
    } else {
      console.error('Unknown Error:', error);
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}