'use client';

import React, { useState, useEffect } from 'react';
import ProgressDashboard from '@/components/ProgressDashboard';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import ReportGenerator from '@/components/ReportGenerator';
import ObjectivesList from '@/components/ObjectivesList';
import ReadinessIndicator from '@/components/ReadinessIndicator';
import WelcomeDashboard from '@/components/WelcomeDashboard';
import { useAuth } from '@/lib/auth-context';
import { Objective } from '@/lib/objectives';

const DashboardPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [readinessScore, setReadinessScore] = useState<number | null>(null);
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [isLoadingObjectives, setIsLoadingObjectives] = useState(true);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  useEffect(() => {
    const fetchReadiness = async () => {
      try {
        const response = await fetch('/api/readiness');
        if (response.ok) {
          const data = await response.json();
          setReadinessScore(data.overall.score);
        }
      } catch (error) {
        console.error('Failed to fetch readiness score:', error);
      }
    };
    fetchReadiness();
  }, []);

  useEffect(() => {
    const fetchObjectives = async () => {
      if (authLoading || !user) {
        setIsLoadingObjectives(false);
        return;
      }

      try {
        setIsLoadingObjectives(true);
        const response = await fetch('/api/objectives');
        if (!response.ok) {
          throw new Error('Failed to fetch objectives');
        }
        const data = await response.json();
        setObjectives(data);
      } catch (error) {
        console.error('Failed to fetch objectives:', error);
      } finally {
        setIsLoadingObjectives(false);
      }
    };

    fetchObjectives();
  }, [user, authLoading]);

  const handleDeleteObjective = async (objectiveId: string) => {
    if (!user) {
      alert('User not authenticated');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this objective?')) {
      try {
        const response = await fetch('/api/objectives', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: objectiveId }),
        });
        if (!response.ok) {
          throw new Error('Failed to delete objective');
        }
        setObjectives(objectives.filter(obj => obj.id !== objectiveId));
      } catch (error) {
        console.error('Failed to delete objective:', error);
        alert('Failed to delete objective');
      }
    }
  };

  const handleGenerateQuestions = async (objectiveId: string, role: string) => {
    if (!user) {
      alert('User not authenticated');
      return;
    }
    
    try {
      setIsGeneratingQuestions(true);
      const response = await fetch('/api/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: role,
          count: 5, // Generate 5 new questions
          objectiveId: objectiveId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      alert('New questions generated successfully! They are now available in your study sessions.');
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Failed to generate questions');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  if (authLoading || isLoadingObjectives) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      {objectives.length === 0 ? (
        <WelcomeDashboard />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2 lg:col-span-3 mb-4">
            {readinessScore !== null ? (
              <ReadinessIndicator score={readinessScore} />
            ) : (
              <div className="p-4 bg-gray-100 rounded-md text-center">
                <p>Calculating readiness...</p>
              </div>
            )}
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <ObjectivesList
              objectives={objectives}
              isLoading={isLoadingObjectives}
              onDelete={handleDeleteObjective}
              onGenerateQuestions={handleGenerateQuestions}
              isGeneratingQuestions={isGeneratingQuestions}
            />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <ProgressDashboard />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <AnalyticsCharts />
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-6">
            <ReportGenerator />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;