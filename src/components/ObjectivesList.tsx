import React from 'react';
import Link from 'next/link';
import { Objective } from '@/lib/objectives'; // Assuming Objective type is defined here

interface ObjectivesListProps {
  objectives: Objective[];
  isLoading: boolean;
  onDelete: (objectiveId: string) => void;
  onGenerateQuestions: (objectiveId: string, role: string) => void;
  isGeneratingQuestions: boolean;
}

const ObjectivesList: React.FC<ObjectivesListProps> = ({
  objectives = [], // Provide a default empty array
  isLoading,
  onDelete,
  onGenerateQuestions,
  isGeneratingQuestions,
}) => {
  if (isLoading) {
    return <div>Loading objectives...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Your Learning Objectives</h2>
      <div className="space-y-6">
        {objectives.length === 0 ? (
          <p className="text-gray-500">
            No objectives created yet.{' '}
            <Link href="/generate" className="text-blue-600 hover:underline">
              Create your first one!
            </Link>
          </p>
        ) : (
          <>
            <ul className="space-y-3">
              {objectives.map((objective) => (
                <li key={objective.id} className="p-3 bg-gray-50 rounded-md border">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                    <div className="flex-grow">
                      <h3 className="font-medium">{objective.name}</h3>
                      {objective.description && (
                        <p className="text-gray-600 mt-1 text-sm">{objective.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Created: {new Date(objective.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-row-reverse sm:flex-col items-center sm:items-end gap-2 flex-shrink-0 self-end sm:self-auto">
                       <button
                        onClick={() => onGenerateQuestions(objective.id, objective.name)}
                        disabled={isGeneratingQuestions}
                        className="text-sm bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed w-full text-center"
                      >
                        {isGeneratingQuestions ? 'Generating...' : 'Generate Questions'}
                      </button>
                      <button
                        onClick={() => onDelete(objective.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default ObjectivesList;