import { progressService } from './progress';
import { supabase } from './supabase/client';

interface Question {
  id: string;
  last_reviewed: string | null;
  review_ease: number;
  topic: string;
}

interface ProgressMetrics {
  masteryScore: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalQuestions: number;
}

interface ReadinessScore {
  overall: number;
  breakdown: {
    mastery: number;
    consistency: number;
    coverage: number;
    recency: number;
  };
}

export async function calculateReadiness(userId: string): Promise<ReadinessScore> {
  // Get user's progress data
  const progress = await progressService.getUserMetrics(userId) as ProgressMetrics;
  
  // Get questions and their review history
  const { data: questionsData } = await supabase
    .from('questions')
    .select('id, last_reviewed, review_ease, topic')
    .eq('user_id', userId);

  const questions: Question[] = questionsData || [];

  // Calculate component scores
  const masteryScore = calculateMastery(progress, questions);
  const consistencyScore = calculateConsistency(progress);
  const coverageScore = calculateCoverage(questions);
  const recencyScore = calculateRecency(questions);

  // Calculate weighted overall score
  const overallScore = Math.round(
    masteryScore * 0.4 +
    consistencyScore * 0.3 +
    coverageScore * 0.2 +
    recencyScore * 0.1
  );

  return {
    overall: Math.min(100, Math.max(0, overallScore)),
    breakdown: {
      mastery: masteryScore,
      consistency: consistencyScore,
      coverage: coverageScore,
      recency: recencyScore
    }
  };
}

function calculateMastery(progress: ProgressMetrics, questions: Question[]): number {
  // Base score on overall mastery percentage
  let score = progress.masteryScore;

  // Penalize for any questions with very low ease factors
  const weakQuestions = questions.filter(q => q.review_ease < 1.5).length;
  if (weakQuestions > 0) {
    score -= (weakQuestions / questions.length) * 30;
  }

  return Math.max(0, score);
}

function calculateConsistency(progress: ProgressMetrics): number {
  // Score based on consistency of recent performance
  const { correctAnswers, incorrectAnswers } = progress;
  const total = correctAnswers + incorrectAnswers;
  
  if (total === 0) return 0;
  
  const consistency = (correctAnswers / total) * 100;
  return Math.min(100, consistency);
}

function calculateCoverage(questions: Question[]): number {
  // Score based on coverage of required topics
  const requiredTopics = ['algorithms', 'data-structures', 'system-design'];
  const coveredTopics = new Set(questions.map(q => q.topic));
  
  const coverage = requiredTopics.filter(t => coveredTopics.has(t)).length;
  return (coverage / requiredTopics.length) * 100;
}

function calculateRecency(questions: Question[]): number {
  // Score based on how recently questions were reviewed
  if (questions.length === 0) return 0;
  
  const now = Date.now();
  const lastReviewTimes = questions
    .filter(q => q.last_reviewed)
    .map(q => now - new Date(q.last_reviewed!).getTime());
    
  if (lastReviewTimes.length === 0) return 0;
  
  const avgDaysSinceReview = Math.min(
    30, // Max 30 days
    lastReviewTimes.reduce((a, b) => a + b, 0) / lastReviewTimes.length / (1000 * 60 * 60 * 24)
  );
  
  return 100 - (avgDaysSinceReview / 30) * 100;
}