import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { categorizeQuestions } from '@/lib/srs';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ objectiveId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

   const { objectiveId } = await params;
    if (!objectiveId) {
      return NextResponse.json({ error: 'Objective ID is required' }, { status: 400 });
    }

    const objectiveWithQuestions = await prisma.objective.findUnique({
      where: { id: objectiveId, userId: user.id },
      include: {
        ObjectiveQuestion: {
          select: {
            question: true,
          },
        },
      },
    });

    if (!objectiveWithQuestions) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
    }

    const questions = objectiveWithQuestions.ObjectiveQuestion.map(oq => oq.question);
    const categorized = categorizeQuestions(questions);

    return NextResponse.json(categorized);
  } catch (error) {
    console.error('Error fetching categorized questions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}