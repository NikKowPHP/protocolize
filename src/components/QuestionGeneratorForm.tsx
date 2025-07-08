import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import type { Objective } from '@/lib/objectives';

interface QuestionGeneratorFormProps {
  selectedRole?: string;
  objectives: Objective[];
}

const QuestionGeneratorForm: React.FC<QuestionGeneratorFormProps> = ({ selectedRole, objectives }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [maxTokens, setMaxTokens] = useState(150);
  const [temperature, setTemperature] = useState(0.7);
  const [questionType, setQuestionType] = useState('general');
  const [selectedObjectiveId, setSelectedObjectiveId] = useState('');
  const [generatedQuestion, setGeneratedQuestion] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) {
      setError('Prompt is required');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedQuestion('');

    try {
      const res = await fetch('/api/generate-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          maxTokens,
          temperature,
          questionType,
          role: selectedRole,
          objectiveId: selectedObjectiveId || undefined,
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to generate question');
      }

      const data = await res.json();
      if (data.questions && data.questions.length > 0) {
        setGeneratedQuestion(data.questions[0].content);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center">Custom Question Generator</h2>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <form onSubmit={handleGenerate} className="space-y-4">
        <div className="mb-4">
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
            Prompt
          </label>
          <textarea
            id="prompt"
            className="mt-1 block w-full h-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="questionType" className="block text-sm font-medium text-gray-700">
            Question Type
          </label>
          <select
            id="questionType"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value)}
          >
            <option value="general">General Question</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True/False</option>
            <option value="short_answer">Short Answer</option>
          </select>
        </div>
         <div className="mb-4">
          <label htmlFor="objective" className="block text-sm font-medium text-gray-700">
            Add to Objective (Optional)
          </label>
          <select
            id="objective"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={selectedObjectiveId}
            onChange={(e) => setSelectedObjectiveId(e.target.value)}
          >
            <option value="">Don't add to any objective</option>
            {objectives.map((obj) => (
              <option key={obj.id} value={obj.id}>
                {obj.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700">
                Max Tokens
              </label>
              <input
                id="maxTokens"
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                min="1"
                max="2000"
              />
            </div>
            <div>
              <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                Temperature
              </label>
              <input
                id="temperature"
                type="number"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                step="0.1"
                min="0"
                max="2"
              />
            </div>
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Question'}
        </button>
      </form>
      {generatedQuestion && (
        <div className="mt-6 p-4 bg-gray-100 border border-gray-200 rounded-md">
          <h3 className="font-semibold mb-2">Generated Question:</h3>
          <p>{generatedQuestion}</p>
        </div>
      )}
    </div>
  );
};

export default QuestionGeneratorForm;