'use client';

// ROO-AUDIT-TAG :: plan-002-topic-selection.md :: Verify new objectives appear in question generation interface
import React, { useState, useEffect } from 'react';
import QuestionGeneratorForm from '@/components/QuestionGeneratorForm';
import RoleSelect from '@/components/RoleSelect';
import ObjectivesList from '@/components/ObjectivesList';
import { useAuth } from '@/lib/auth-context';
import type { Objective } from '@/lib/objectives';

const GeneratePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState('');
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [isLoadingObjectives, setIsLoadingObjectives] = useState(true);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [showCustomGenerator, setShowCustomGenerator] = useState(false);

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

  const handleNewObjective = async (objectiveData: { name: string; description?: string; userId: string }) => {
    if (!user) {
      alert('User not authenticated');
      return;
    }

    try {
      const response = await fetch('/api/objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(objectiveData),
      });
      if (!response.ok) {
        throw new Error('Failed to create objective');
      }
      const newObjective = await response.json();
      setObjectives((prev) => [newObjective, ...prev]);
    } catch (error) {
      console.error('Failed to create objective:', error);
      alert('Failed to create objective');
    }
  };
  
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
      console.log('Generating questions for objective:', objectiveId, 'with role:', role);
      const response = await fetch('/api/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: role,
          count: 5,
          objectiveId: objectiveId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      alert('Questions generated successfully! Check the questions page.');
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Failed to generate questions');
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <RoleSelect onRoleSelect={(role) => setSelectedRole(role)} onNewObjective={handleNewObjective} />
          <ObjectivesList 
            objectives={objectives}
            isLoading={isLoadingObjectives}
            onDelete={handleDeleteObjective}
            onGenerateQuestions={handleGenerateQuestions}
            isGeneratingQuestions={isGeneratingQuestions}
          />
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <button
              onClick={() => setShowCustomGenerator(prev => !prev)}
              className="w-full text-left text-lg font-semibold text-gray-700 hover:text-blue-600 flex justify-between items-center"
            >
              <span>Advanced: Custom Question Generator</span>
              <span className="transform transition-transform duration-200" style={{ transform: showCustomGenerator ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                ▼
              </span>
            </button>
            {showCustomGenerator && (
              <div className="mt-6 border-t pt-6">
                <QuestionGeneratorForm selectedRole={selectedRole} objectives={objectives} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
// ROO-AUDIT-TAG :: plan-002-topic-selection.md :: END

export default GeneratePage;