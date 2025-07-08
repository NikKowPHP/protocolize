'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import VoiceRecorder from '@/components/VoiceRecorder';
import EvaluationFeedback from '@/components/EvaluationFeedback';
import type { EvaluationResult } from '@/lib/ai/generation-service';
import type { Question as PrismaQuestion, Objective } from '@prisma/client';
import Link from 'next/link';

interface Question extends PrismaQuestion {
  nextReviewDate?: string;
}

interface CategorizedQuestions {
  toReview: Question[];
  learning: Question[];
  new: Question[];
  struggling: Question[];
}

const QuestionsPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string>('');
  const [loadingObjectives, setLoadingObjectives] = useState(true);

  const [categorizedQuestions, setCategorizedQuestions] = useState<CategorizedQuestions | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState('');
  
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isPracticing, setIsPracticing] = useState(false);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    transcription: string;
    evaluation: EvaluationResult;
  } | null>(null);

  const fetchCategorizedQuestions = useCallback(async () => {
    if (!selectedObjectiveId || !user) return;
    setLoadingQuestions(true);
    setError('');
    try {
      const response = await fetch(`/api/objectives/${selectedObjectiveId}/questions`);
      if (!response.ok) throw new Error('Failed to fetch questions for this objective.');
      const data = await response.json();
      console.log('Fetched categorized questions:', data);
      setCategorizedQuestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoadingQuestions(false);
    }
  }, [selectedObjectiveId, user]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchObjectives = async () => {
      setLoadingObjectives(true);
      try {
        const response = await fetch('/api/objectives');
        if (!response.ok) throw new Error('Failed to fetch objectives');
        const data = await response.json();
        setObjectives(data);
        if (data.length > 0 && !selectedObjectiveId) {
          setSelectedObjectiveId(data[0].id);
        }
      } catch (err) {
        console.error(err);
        setError('Could not load your learning objectives.');
      } finally {
        setLoadingObjectives(false);
      }
    };
    fetchObjectives();
  }, [user, router, selectedObjectiveId]);
  
  useEffect(() => {
    fetchCategorizedQuestions();
  }, [fetchCategorizedQuestions]);

  const handleStartPractice = async () => {
    if (!selectedObjectiveId) return;

    setIsFetchingNext(true);
    setError('');
    try {
      const response = await fetch(`/api/practice/next-question?objectiveId=${selectedObjectiveId}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Could not get next question.');
      }
      const question = await response.json();
      if (!question.answer) {
        alert("The next question doesn't have an ideal answer summary and cannot be practiced verbally yet. The system will generate one. Please try again in a moment.");
        setIsFetchingNext(false);
        return;
      }
      setCurrentQuestion(question);
      setEvaluationResult(null);
      setIsPracticing(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start practice session.');
    } finally {
      setIsFetchingNext(false);
    }
  };

  const handleRecordingComplete = (result: { transcription: string; evaluation: EvaluationResult; }) => {
    setEvaluationResult(result);
    fetchCategorizedQuestions();
  };
  
  const handleFinishPractice = () => {
    setIsPracticing(false);
    setCurrentQuestion(null);
    setEvaluationResult(null);
    fetchCategorizedQuestions();
  };

  if (loadingObjectives) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;
  }

  if (!isPracticing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Practice Hub</h1>
        {objectives.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">No Learning Objectives Found</h2>
            <p className="text-gray-600 mb-4">You need to create a learning objective before you can start practicing.</p>
            <Link href="/generate" className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
              Create Your First Objective
            </Link>
          </div>
        ) : (
          <>
            <div className="max-w-md mx-auto mb-8">
              <label htmlFor="objective-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Learning Objective:
              </label>
              <select 
                id="objective-select"
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                value={selectedObjectiveId} 
                onChange={(e) => setSelectedObjectiveId(e.target.value)}
              >
                {objectives.map((obj) => <option key={obj.id} value={obj.id}>{obj.name}</option>)}
              </select>
            </div>
            
            {loadingQuestions ? <p className="text-center">Loading questions...</p> : error ? <p className="text-red-500 text-center">{error}</p> : (
              <div className="max-w-2xl mx-auto text-center bg-white p-4 sm:p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-8">
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600">{categorizedQuestions?.new.length ?? 0}</div>
                        <div className="text-sm text-blue-800">New</div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                        <div className="text-3xl font-bold text-yellow-600">{categorizedQuestions?.learning.length ?? 0}</div>
                        <div className="text-sm text-yellow-800">Learning</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                        <div className="text-3xl font-bold text-red-600">{categorizedQuestions?.toReview.length ?? 0}</div>
                        <div className="text-sm text-red-800">To Review</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                        <div className="text-3xl font-bold text-purple-600">{categorizedQuestions?.struggling.length ?? 0}</div>
                        <div className="text-sm text-purple-800">Struggling</div>
                    </div>
                </div>
                <button 
                  onClick={handleStartPractice} 
                  disabled={isFetchingNext}
                  className="w-full sm:w-auto sm:max-w-xs mx-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400"
                >
                  {isFetchingNext ? 'Loading...' : 'Start Practice Session'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  if (currentQuestion) {
    return (
      <div className="container mx-auto px-4 py-8">
        <button onClick={handleFinishPractice} className="mb-6 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">
          ← Back to Hub
        </button>
        <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Practice Question</h2>
          <p className="text-xl text-gray-700 leading-relaxed mb-6">{currentQuestion.content}</p>
          
          <VoiceRecorder 
            questionId={currentQuestion.id}
            questionContent={currentQuestion.content}
            idealAnswer={currentQuestion.answer!}
            onRecordingComplete={handleRecordingComplete}
            onTranscribing={setIsTranscribing}
          />

          {isTranscribing && (
            <div className="mt-6 text-center">
              <p className="font-semibold text-blue-600 animate-pulse">Evaluating your answer, please wait...</p>
            </div>
          )}
          
          {evaluationResult && (
            <div className="mt-6">
              <EvaluationFeedback result={evaluationResult} />
              <div className="text-center mt-6">
                <button 
                  onClick={handleStartPractice} 
                  disabled={isFetchingNext}
                  className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400"
                >
                  {isFetchingNext ? 'Loading...' : 'Next Question'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div className="container mx-auto px-4 py-8 text-center">Something went wrong. Please refresh the page.</div>;
};

export default QuestionsPage;