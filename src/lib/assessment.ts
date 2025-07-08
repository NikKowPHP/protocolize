export interface TopicRelationship {
  topic: string;
  relatedTopics: string[];
  strength: number; // 0-1 scale of relationship strength
}

export interface QuestionPerformance {
  questionId: string;
  topic: string;
  subtopics: string[];
  correctness: number; // 0-1 scale
  responseTime: number;
  attempts: number;
  relatedTopics?: string[]; // Dynamically discovered related topics
}

const defaultTopicRelationships: TopicRelationship[] = [
  {
    topic: 'javascript',
    relatedTopics: ['typescript', 'web-development', 'nodejs'],
    strength: 0.8
  },
  {
    topic: 'typescript',
    relatedTopics: ['javascript', 'angular', 'react'],
    strength: 0.9
  },
  {
    topic: 'react',
    relatedTopics: ['javascript', 'typescript', 'redux'],
    strength: 0.85
  }
];

export interface KnowledgeGap {
  topic: string;
  subtopic?: string;
  severity: number; // 0-1 scale
  relatedQuestions: string[];
  relatedTopics?: string[]; // Added for topic relationship modeling
}

export interface AssessmentService {
  calculateScore: (answers: Record<string, string>) => number;
  validateAnswer: (transcribedAnswer: string, expectedAnswer: string) => number;
  getRecommendations: (score: number) => string[];
  generateRecommendationEngine: (score: number) => string[];
  analyzeKnowledgeGaps: (
    performances: QuestionPerformance[],
    allTopics: string[]
  ) => Promise<KnowledgeGap[]>;
  generateFeedback: (transcribedAnswer: string, expectedAnswer: string) => string[];
}

/**
 * Analyzes question performances to identify knowledge gaps using AI
 * @param performances Array of question performance data
 * @param allTopics All available topics in the system
 * @returns Array of identified knowledge gaps
 */
const analyzeKnowledgeGaps = async (
  performances: QuestionPerformance[],
  _allTopics: string[]
): Promise<KnowledgeGap[]> => {
  void _allTopics; // Explicitly mark as unused for now
  // TODO: Use allTopics to identify gaps in topics not yet attempted
  // Build topic relationship map
  const topicRelations = new Map<string, TopicRelationship>(
    defaultTopicRelationships.map(rel => [rel.topic, rel])
  );

  // Group performances by topic/subtopic and enrich with related topics
  const topicMap = new Map<string, QuestionPerformance[]>();
  
  for (const perf of performances) {
    const key = `${perf.topic}|${perf.subtopics.join(',')}`;
    const existing = topicMap.get(key) || [];
    
    // Add related topics from predefined relationships
    const enrichedPerf = {
      ...perf,
      relatedTopics: topicRelations.get(perf.topic)?.relatedTopics || []
    };
    
    topicMap.set(key, [...existing, enrichedPerf]);
  }

  // Calculate gap severity scores with related topics
  const gaps: KnowledgeGap[] = [];
  
  for (const [key, perfs] of topicMap) {
    const [topic, subtopic] = key.split('|');
    const avgCorrectness = perfs.reduce((sum, p) => sum + p.correctness, 0) / perfs.length;
    const severity = 1 - avgCorrectness;
    
    const gap: KnowledgeGap = {
      topic,
      subtopic: subtopic || undefined,
      severity,
      relatedQuestions: perfs.map(p => p.questionId)
    };

    // Find related topics with high severity gaps
    const relatedTopics = new Set<string>();
    for (const perf of perfs) {
      for (const rt of perf.relatedTopics || []) {
        if (severity > 0.7) { // Only include strong relationships for severe gaps
          relatedTopics.add(rt);
        }
      }
    }

    if (relatedTopics.size > 0) {
      gap.relatedTopics = Array.from(relatedTopics);
    }

    gaps.push(gap);
  }

  // Combine heuristic gaps with AI analysis
  try {
    const aiGaps = await fetch('/api/analyze-knowledge-gaps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        performances,
        topics: _allTopics,
        currentGaps: gaps
      }),
    }).then(res => res.json());

    // Merge and deduplicate gaps
    const mergedGaps = [...gaps];
    for (const aiGap of aiGaps) {
      if (!mergedGaps.some(g => g.topic === aiGap.topic && g.subtopic === aiGap.subtopic)) {
        mergedGaps.push(aiGap);
      }
    }

    // Sort by severity descending
    return mergedGaps.sort((a, b) => b.severity - a.severity);
  } catch (error) {
    console.error('AI knowledge gap analysis failed:', error);
    return gaps; // Fallback to heuristic gaps
  }
};

export const createAssessmentService = (): AssessmentService => {
  const validateAnswer = (transcribedAnswer: string, expectedAnswer: string): number => {
    // Preprocess both answers
    const preprocess = (text: string) =>
      text.toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ')    // Collapse whitespace
        .trim();

    const processedAnswer = preprocess(transcribedAnswer);
    const processedExpected = preprocess(expectedAnswer);

    // Exact match
    if (processedAnswer === processedExpected) return 1.0;

    // Split into important words (excluding stop words)
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were']);
    const answerWords = processedAnswer.split(' ').filter(w => !stopWords.has(w));
    const expectedWords = processedExpected.split(' ').filter(w => !stopWords.has(w));

    // Calculate word overlap score
    const expectedWordSet = new Set(expectedWords);
    const matchingWords = answerWords.filter(w => expectedWordSet.has(w));
    const wordOverlapScore = matchingWords.length / expectedWords.length;

    // Calculate order score (measures how well the words are ordered)
    let orderScore = 0;
    let lastMatchIndex = -1;
    for (const word of expectedWords) {
      const idx = answerWords.indexOf(word);
      if (idx > lastMatchIndex) {
        orderScore++;
        lastMatchIndex = idx;
      }
    }
    orderScore /= expectedWords.length;

    // Combine scores with weighting
    const finalScore =
      (wordOverlapScore * 0.6) +
      (orderScore * 0.3) +
      (processedAnswer.includes(processedExpected) ? 0.1 : 0);

    return Math.min(finalScore, 0.95); // Never give perfect score for non-exact matches
    
    // Split into words and check for keyword matches
    // This old validation logic has been replaced by the enhanced validateAnswer function
  };

  const calculateScore = (answers: Record<string, string>): number => {
    // Enhanced scoring model that handles partial credit
    const totalQuestions = Object.keys(answers).length;
    let totalScore = 0;

    for (const [, answer] of Object.entries(answers)) {
      if (answer === 'correct') {
        totalScore += 1;
      } else if (typeof answer === 'string') {
        // Assume format "expected|actual" for voice answers
        const [expectedAnswer, actualAnswer] = answer.split('|');
        if (expectedAnswer && actualAnswer) {
          totalScore += validateAnswer(actualAnswer, expectedAnswer);
        }
      }
    }

    return (totalScore / totalQuestions) * 100;
  };

  const generateFeedback = (transcribedAnswer: string, expectedAnswer: string): string[] => {
    const feedback: string[] = [];
    
    // Check for missing key terms
    const expectedTerms = expectedAnswer.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const answerTerms = new Set(transcribedAnswer.toLowerCase().match(/\b\w{4,}\b/g) || []);
    
    const missingTerms = expectedTerms.filter(term => !answerTerms.has(term));
    if (missingTerms.length > 0) {
      feedback.push(`Missing key terms: ${missingTerms.join(', ')}`);
    }

    // Check answer length
    const expectedLength = expectedAnswer.split(' ').length;
    const answerLength = transcribedAnswer.split(' ').length;
    if (answerLength < expectedLength * 0.5) {
      feedback.push('Your answer seems too short - try to elaborate more');
    }

    // Check for vague language
    const vagueWords = ['thing', 'stuff', 'something', 'whatever'];
    if (vagueWords.some(word => transcribedAnswer.toLowerCase().includes(word))) {
      feedback.push('Try to be more specific and avoid vague terms');
    }

    return feedback.length > 0 ? feedback : ['Good answer! Keep up the good work!'];
  };

  const getRecommendations = (score: number): string[] => {
    if (score >= 90) {
      return ['You are well-prepared! Consider focusing on advanced topics.', 'Practice with more challenging questions.'];
    } else if (score >= 70) {
      return ['Good job! Review areas where you made mistakes.', 'Focus on improving your weaker areas.'];
    } else if (score >= 50) {
      return ['You need more practice. Review the material carefully.', 'Consider getting help from a tutor or study group.'];
    } else {
      return ['You need significant improvement. Start with the basics.', 'Create a study plan and stick to it.'];
    }
  };

  const generateRecommendationEngine = (score: number): string[] => {
    // More advanced recommendation engine
    // This could be based on machine learning models or complex algorithms
    // For now, we'll use a simple rule-based approach

    const recommendations: string[] = [];

    if (score >= 90) {
      recommendations.push('Excellent job! You are ready for advanced topics.');
      recommendations.push('Consider taking practice exams under timed conditions.');
    } else if (score >= 70) {
      recommendations.push('Good performance! Focus on areas where you made mistakes.');
      recommendations.push('Review key concepts and practice regularly.');
    } else if (score >= 50) {
      recommendations.push('You need more practice. Focus on understanding basic concepts.');
      recommendations.push('Consider joining a study group or getting a tutor.');
    } else {
      recommendations.push('You need significant improvement. Start with the basics.');
      recommendations.push('Create a structured study plan and stick to it.');
    }

    // Add specific recommendations based on question performance
    // This is a placeholder for more advanced logic
    recommendations.push('Review your notes and textbooks.');
    recommendations.push('Practice with sample questions and past exams.');

    return recommendations;
  };


  return {
    calculateScore,
    validateAnswer,
    getRecommendations,
    generateRecommendationEngine,
    analyzeKnowledgeGaps,
    generateFeedback,
  };
};

export const assessmentService = createAssessmentService();