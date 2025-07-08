import { prisma } from './db';
import type { Question } from '@prisma/client';

/**
 * Calculates the next review date for a question.
 */
export const calculateNextReview = (question: Question): {
  daysUntilReview: number;
} => {
  const now = new Date();
  if (!question.lastReviewed) {
    return { daysUntilReview: 0 };
  }

  const timeSinceLastReview = now.getTime() - question.lastReviewed.getTime();
  const daysSinceLastReview = timeSinceLastReview / (1000 * 60 * 60 * 24);

  const daysUntil = question.reviewInterval - daysSinceLastReview;
  return {
    daysUntilReview: Math.max(0, Math.ceil(daysUntil)),
  };
};

/**
 * Categorizes questions into different review buckets.
 */
export const categorizeQuestions = (questions: Question[]): {
  toReview: Question[];
  learning: Question[];
  new: Question[];
  struggling: Question[];
} => {
  const toReview: Question[] = [];
  const learning: Question[] = [];
  const newQuestions: Question[] = [];
  const struggling: Question[] = [];

  for (const q of questions) {
    // 1. New questions (never reviewed)
    if (q.reviewCount === 0) {
      newQuestions.push(q);
      continue;
    }

    // 2. Questions to review (overdue)
    const { daysUntilReview } = calculateNextReview(q);
    if (daysUntilReview <= 0) {
      toReview.push(q);
      continue;
    }

    // 3. Struggling questions
    if (q.reviewEase < 2.0 || q.struggleCount > 3) {
      struggling.push(q);
      continue;
    }

    // 4. All other reviewed questions are considered 'learning' (which includes mastered questions)
    learning.push(q);
  }

  // Sort 'toReview' questions by most overdue to prioritize them
  toReview.sort((a, b) => {
    const aOverdue = a.lastReviewed ? (Date.now() - a.lastReviewed.getTime()) / (1000 * 60 * 60 * 24) - a.reviewInterval : Infinity;
    const bOverdue = b.lastReviewed ? (Date.now() - b.lastReviewed.getTime()) / (1000 * 60 * 60 * 24) - b.reviewInterval : Infinity;
    return bOverdue - aOverdue;
  });

  return { toReview, learning, new: newQuestions, struggling };
};

/**
 * Updates a question's SRS stats based on an evaluation score.
 * @param questionId The ID of the question to update.
 * @param score The evaluation score from 0 to 100.
 */
export const updateQuestionAfterEvaluation = async (questionId: string, score: number): Promise<Question> => {
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    throw new Error(`Question with id ${questionId} not found.`);
  }

  let { reviewEase, reviewInterval, struggleCount, lastStruggledAt } = question;

  if (score < 60) { // Failed recall
    struggleCount++;
    lastStruggledAt = new Date();
    reviewInterval = 1; // Reset interval
    reviewEase = Math.max(1.3, reviewEase - 0.2);
  } else { // Successful recall
    if (score >= 85) { // Easy
      reviewEase += 0.1;
    }
    // For good or hard, ease doesn't change much, but interval does.
    
    if (question.reviewCount === 0) {
      reviewInterval = 1;
    } else if (question.reviewCount === 1) {
      reviewInterval = 6;
    } else {
      reviewInterval = Math.ceil(reviewInterval * reviewEase);
    }
  }
  
  // Cap ease factor
  if (reviewEase > 3.0) reviewEase = 3.0;

  const updatedQuestion = await prisma.question.update({
    where: { id: questionId },
    data: {
      lastReviewed: new Date(),
      reviewInterval,
      reviewEase,
      struggleCount,
      lastStruggledAt,
      reviewCount: question.reviewCount + 1,
    },
  });

  return updatedQuestion;
};