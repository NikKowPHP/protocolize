import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getQuestionGenerationService } from '@/lib/ai';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { role, difficulty = 'medium', count = 1, objectiveId, prompt, temperature, maxTokens, questionType } = body;

    let existingQuestionContents: string[] = [];
    if (objectiveId) {
        const objectiveWithQuestions = await prisma.objective.findUnique({
          where: { id: objectiveId, userId: user.id },
          include: {
            ObjectiveQuestion: {
              select: {
                question: {
                  select: { content: true }
                }
              }
            }
          }
        });
        if (objectiveWithQuestions) {
            existingQuestionContents = objectiveWithQuestions.ObjectiveQuestion.map(oq => oq.question.content);
        }
    }

    const service = getQuestionGenerationService();
    let generatedQuestions;

    if (prompt) {
      if (typeof prompt !== 'string') {
        return NextResponse.json({ error: 'Prompt must be a string' }, { status: 400 });
      }
      generatedQuestions = await service.generateQuestionsFromPrompt({
        prompt,
        role,
        temperature,
        maxTokens,
        questionType,
        count,
        existingQuestionContents
      });
    } else if (role) {
      if (typeof role !== 'string') {
        return NextResponse.json({ error: 'Role is required and must be a string' }, { status: 400 });
      }
      generatedQuestions = await service.generateQuestions({ role, difficulty, count, existingQuestionContents });
    } else {
      return NextResponse.json({ error: 'Either prompt or role is required' }, { status: 400 });
    }
    
    if (!generatedQuestions || generatedQuestions.length === 0) {
      return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 });
    }

    const createdQuestions = [];
    for (const genQ of generatedQuestions) {
      const createdQuestion = await prisma.question.create({
        data: {
          userId: user.id,
          content: genQ.question,
          answer: genQ.ideal_answer_summary,
          category: 'generated',
          difficulty: genQ.difficulty || difficulty,
          topics: genQ.topics || []
        }
      });
      createdQuestions.push(createdQuestion);

      if (objectiveId) {
        // Verify objective belongs to user
        const objective = await prisma.objective.findFirst({ where: { id: objectiveId, userId: user.id } });
        if (objective) {
          await prisma.objectiveQuestion.create({
            data: {
              objectiveId: objectiveId,
              questionId: createdQuestion.id
            }
          });
        }
      }
    }

    return NextResponse.json({ questions: createdQuestions });
    
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error generating question:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error('Unknown error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}