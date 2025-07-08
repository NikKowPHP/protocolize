import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getQuestionGenerationService } from '@/lib/ai';
import { updateQuestionAfterEvaluation } from '@/lib/srs';
import { progressService } from '@/lib/progress';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    // Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Request validation with FormData
    const formData = await req.formData();
    const file = formData.get('audio') as Blob | null;
    const question = formData.get('question') as string | null;
    const idealAnswer = formData.get('idealAnswer') as string | null;
    const questionId = formData.get('questionId') as string | null;

    if (!file || !question || !idealAnswer || !questionId) {
      return NextResponse.json(
        { error: 'audio, question, idealAnswer, and questionId are required in form data' },
        { status: 400 }
      );
    }

    const audioBuffer = Buffer.from(await file.arrayBuffer());

    const evaluationService = getQuestionGenerationService();
    
  // Check if the service supports audio euvaluation
    if (!evaluationService.evaluateAudioAnswer) {
      return NextResponse.json({ error: 'Audio evaluation not supported by the configured AI provider.'}, {status: 501 });
    }

    const result = await evaluationService.evaluateAudioAnswer({
      question,
      idealAnswerSummary: idealAnswer,
      audioBuffer,
      mimeType: file.type || 'audio/webm'
    });
    
    // The result is { transcription, ...evaluationData }. 
    // The client expects { transcription, evaluation: { ... } }
    const { transcription, ...evaluation } = result;

    if (evaluation.score !== undefined) {
      await updateQuestionAfterEvaluation(questionId, evaluation.score);
      const remembered = evaluation.score >= 60;
      await progressService.updateProgressAfterReview(user.id, questionId, remembered);
    }

    return NextResponse.json({
      transcription,
      evaluation,
    });

  } catch (error: unknown) {
    // Error handling
    if (error instanceof Error) {
      console.error('Voice processing error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error('Unknown error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}