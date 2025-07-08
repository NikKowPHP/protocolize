import React, { useState } from 'react';
import TopicFilter from './TopicFilter';
import { useAuth } from '../lib/auth-context';

interface RoleSuggestion {
  name: string;
  description: string;
}

interface RoleSelectProps {
  onRoleSelect: (role: string) => void;
  onNewObjective?: (objective: { name: string; description?: string; userId: string }) => void;
  onTopicsChange?: (topics: string[]) => void;
}

const RoleSelect: React.FC<RoleSelectProps> = ({ onRoleSelect, onNewObjective, onTopicsChange }) => {
  const { user } = useAuth();
  const [roleInput, setRoleInput] = useState('');
  
  const [refinementState, setRefinementState] = useState<
    { status: 'idle' } |
    { status: 'loading' } |
    { status: 'success'; suggestions: RoleSuggestion[] } |
    { status: 'error'; message: string }
  >({ status: 'idle' });

  const handleRefineRole = async () => {
    if (!roleInput.trim() || !user) return;
    
    setRefinementState({ status: 'loading' });
    
    try {
      const response = await fetch('/api/validate-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: roleInput }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Role refinement failed');
      }

      const suggestions: RoleSuggestion[] = await response.json();
      
      if (suggestions && suggestions.length > 0) {
        setRefinementState({ status: 'success', suggestions });
      } else {
        setRefinementState({ status: 'error', message: 'Could not generate suggestions for this role. Please try a different input.' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      setRefinementState({
        status: 'error',
        message: `Failed to refine role: ${message}`
      });
      console.error('Role refinement error:', error);
    }
  };

  const handleCreateObjective = async (suggestion: RoleSuggestion) => {
    onRoleSelect(suggestion.name);
    if (onNewObjective && user) {
      try {
        await onNewObjective({
          name: suggestion.name,
          description: suggestion.description,
          userId: user.id,
        });
        // Set input to the selected role name
        setRoleInput(suggestion.name);
        setRefinementState({ status: 'idle' });
      } catch (error) {
        console.error('Failed to create objective:', error);
        setRefinementState({ status: 'error', message: 'Failed to create the objective. Please try again.' });
      }
    }
  };

  return (
    <div className="mb-4 space-y-4">
      <div className="space-y-2">
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Describe your target role to generate a learning objective:
        </label>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <input
            type="text"
            id="role"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={roleInput}
            onChange={(e) => {
              setRoleInput(e.target.value);
              onRoleSelect(e.target.value);
            }}
            placeholder="e.g., 'junior php dev with laravel' or 'senior frontend engineer'"
            disabled={refinementState.status === 'loading'}
          />
          <button
            onClick={handleRefineRole}
            disabled={refinementState.status === 'loading' || !roleInput.trim()}
            className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
          >
            {refinementState.status === 'loading' ? 'Refining...' : 'Refine & Validate'}
          </button>
        </div>
      </div>
  
      {refinementState.status === 'loading' && (
        <p className="text-sm text-gray-500 text-center animate-pulse">Generating suggestions...</p>
      )}

      {refinementState.status === 'error' && (
        <div className="text-sm text-red-600 p-3 bg-red-50 rounded-md">
          <p>{refinementState.message}</p>
        </div>
      )}

      {refinementState.status === 'success' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">Select a refined objective:</h3>
          <ul className="space-y-3">
            {refinementState.suggestions.map((suggestion, index) => (
              <li key={index} className="p-4 bg-gray-50 rounded-md border hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{suggestion.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                  </div>
                  <button
                    onClick={() => handleCreateObjective(suggestion)}
                    className="ml-0 sm:ml-4 mt-2 sm:mt-0 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex-shrink-0 self-end sm:self-center"
                  >
                    Select
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {onTopicsChange && (
        <TopicFilter
          onTopicsChange={onTopicsChange}
        />
      )}
    </div>
  );
};

export default RoleSelect;