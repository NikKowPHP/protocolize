import { prisma } from './db';
import { schedulerService } from './scheduler';

export interface ProgressService {
  getUserProgress: (userId: string) => Promise<{
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    masteryScore: number;
  }>;
  updateProgressAfterReview: (userId: string, questionId: string, remembered: boolean) => Promise<void>;
  getUserMetrics: (userId: string) => Promise<{
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    masteryScore: number;
    nextReviewDates: { [questionId: string]: Date };
  }>;
  aggregateAnalyticsData: (userId: string) => Promise<{
    overallProgress: {
      totalQuestions: number;
      correctAnswers: number;
      incorrectAnswers: number;
      masteryScore: number;
    };
    progressTrend: Array<{
      date: string;
      score: number;
    }>;
    recentReviews: Array<{
      question_id: string;
      remembered: boolean;
      reviewed_at: string;
    }>;
    topicMastery: Array<{
      topic_id: string;
      mastery_level: number;
    }>;
    calculatedAt: Date;
  }>;
}

export const createProgressService = (): ProgressService => {
  const getUserProgress = async (userId: string) => {
    const data = await prisma.progressMetrics.findFirst({
      where: { userId: userId },
    });

    if (!data) {
      return {
        totalQuestions: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        masteryScore: 0,
      };
    }

    const { totalQuestions, correctAnswers, incorrectAnswers } = data;
    const masteryScore = calculateMasteryScore(correctAnswers, incorrectAnswers);

    return {
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      masteryScore,
    };
  };

  const updateProgressAfterReview = async (userId: string, questionId: string, remembered: boolean) => {
    const reviewedAt = new Date();

    await prisma.$transaction(async (tx) => {
      // 1. Create a historical Review record for this event.
      await tx.review.create({
        data: {
          userId,
          questionId,
          remembered,
          reviewedAt,
        },
      });

      // 2. Update the aggregate ProgressMetrics.
      const metricsData = await tx.progressMetrics.findFirst({
        where: { userId: userId },
      });

      if (!metricsData) {
        // If no metrics exist, create a new record.
        await tx.progressMetrics.create({
          data: {
            userId,
            totalQuestions: 1,
            correctAnswers: remembered ? 1 : 0,
            incorrectAnswers: !remembered ? 1 : 0,
            lastReviewedAt: reviewedAt,
          },
        });
      } else {
        // Update metrics based on review result.
        await tx.progressMetrics.update({
          where: { id: metricsData.id },
          data: {
            totalQuestions: { increment: 1 },
            correctAnswers: { increment: remembered ? 1 : 0 },
            incorrectAnswers: { increment: !remembered ? 1 : 0 },
            lastReviewedAt: reviewedAt,
          },
        });
      }
    });
  };

  const getUserMetrics = async (userId: string) => {
    const progress = await getUserProgress(userId);
    const questions = await prisma.question.findMany({
      where: { userId },
      select: { id: true }
    });
    const questionIds = questions.map(q => q.id);
    const nextReviewDates = await schedulerService.getNextReviewDates(questionIds);

    return {
      ...progress,
      nextReviewDates,
    };
  };

  return {
    getUserProgress,
    updateProgressAfterReview,
    getUserMetrics,
    aggregateAnalyticsData: async (userId: string) => {
      const progressData = await prisma.progressMetrics.findFirst({
        where: { userId: userId },
      });
  
      const allReviews = await prisma.review.findMany({
        where: { userId: userId },
        select: {
          questionId: true,
          remembered: true,
          reviewedAt: true,
        },
        orderBy: {
          reviewedAt: 'asc',
        },
      });

      // --- Trend Calculation Logic ---
      const trendMap = new Map<string, { correct: number; total: number }>();
      let cumulativeCorrect = 0;
      let cumulativeTotal = 0;
      
      allReviews.forEach(review => {
        cumulativeTotal++;
        if (review.remembered) {
          cumulativeCorrect++;
        }
        const dateKey = review.reviewedAt.toISOString().split('T')[0]; // YYYY-MM-DD
        trendMap.set(dateKey, { correct: cumulativeCorrect, total: cumulativeTotal });
      });
      
      const progressTrend = Array.from(trendMap.entries()).map(([date, counts]) => ({
          date,
          score: calculateMasteryScore(counts.correct, counts.total - counts.correct)
      }));
  
      const topicData = await prisma.userTopic.findMany({
        where: { userId: userId },
        select: {
          topicId: true,
          masteryLevel: true,
        },
      });
  
      if (!progressData) {
        return {
          overallProgress: {
            totalQuestions: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            masteryScore: 0,
          },
          progressTrend: [],
          recentReviews: [],
          topicMastery: [],
          calculatedAt: new Date(),
        };
      }
  
      return {
        overallProgress: {
          totalQuestions: progressData.totalQuestions,
          correctAnswers: progressData.correctAnswers,
          incorrectAnswers: progressData.incorrectAnswers,
          masteryScore: calculateMasteryScore(
            progressData.correctAnswers,
            progressData.incorrectAnswers
          ),
        },
        progressTrend,
        recentReviews: allReviews.slice(-10).reverse().map(review => ({
          question_id: review.questionId,
          remembered: review.remembered,
          reviewed_at: review.reviewedAt.toISOString(),
        })),
        topicMastery: topicData.map(topic => ({
          topic_id: topic.topicId,
          mastery_level: topic.masteryLevel,
        })),
        calculatedAt: new Date(),
      };
    },
  };
};

const calculateMasteryScore = (correctAnswers: number, incorrectAnswers: number): number => {
  const totalAnswers = correctAnswers + incorrectAnswers;
  if (totalAnswers === 0) return 0;

  return Math.min(100, Math.round((correctAnswers / totalAnswers) * 100));
};

export const progressService = createProgressService();