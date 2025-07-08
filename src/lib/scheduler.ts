import type { Question } from '@prisma/client';
import { categorizeQuestions, calculateNextReview } from './srs';
import { prisma } from './db';
import { getQuestionGenerationService } from '@/lib/ai';

export interface SchedulerService {
  getNextBestQuestion: (userId: string, objectiveId: string) => Promise<Question>;
  getNextReviewDates: (questionIds: string[]) => Promise<{ [questionId: string]: Date }>;
}

export const createSchedulerService = (): SchedulerService => {
  const getNextBestQuestion = async (userId: string, objectiveId:string): Promise<Question> => {
    const objective = await prisma.objective.findUnique({
        where: { id: objectiveId, userId: userId },
        include: { 
            questions: {
                orderBy: {
                    lastReviewed: 'asc' // Prioritize older questions within categories
                }
            }
        }
    });

    if (!objective) {
        throw new Error('Objective not found or user not authorized.');
    }

    const { toReview, struggling, new: newQuestions, learning } = categorizeQuestions(objective.questions);

    // Priority: To Review > Struggling > New > Learning
    const priorityQueue = [...toReview, ...struggling, ...newQuestions, ...learning];
    
    if (priorityQueue.length > 0) {
        return priorityQueue[0];
    }

    // If no questions are in any queue, generate a new one.
    console.log(`No questions in queue for objective ${objectiveId}. Generating a new one.`);
    const generationService = getQuestionGenerationService();
    const existingQuestionContents = objective.questions.map(q => q.content);

    const generated = await generationService.generateQuestions({
        role: objective.name, // Use objective name as the role for generation
        difficulty: 'medium', // Default difficulty
        count: 1,
        existingQuestionContents,
    });

    if (!generated || generated.length === 0) {
        throw new Error('Failed to generate a new question from the AI service.');
    }

    const newQuestionData = generated[0];

    const createdQuestion = await prisma.question.create({
        data: {
            userId: userId,
            content: newQuestionData.question,
            answer: newQuestionData.ideal_answer_summary,
            category: 'generated',
            difficulty: newQuestionData.difficulty || 'medium',
            topics: newQuestionData.topics || [],
        }
    });

    // Associate the new question with the objective
    await prisma.objectiveQuestion.create({
        data: {
            objectiveId: objectiveId,
            questionId: createdQuestion.id
        }
    });

    return createdQuestion;
  };

  const getNextReviewDates = async (questionIds: string[]): Promise<{ [questionId: string]: Date }> => {
    if (questionIds.length === 0) {
      return {};
    }

    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
      },
    });

    const reviewDates: { [questionId: string]: Date } = {};
    for (const question of questions) {
      const { daysUntilReview } = calculateNextReview(question);
      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + daysUntilReview);
      reviewDates[question.id] = nextReviewDate;
    }

    return reviewDates;
  };

  return {
    getNextBestQuestion,
    getNextReviewDates,
  };
};

export const schedulerService = createSchedulerService();