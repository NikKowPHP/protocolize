import React from 'react';
import { EvaluationResult } from '@/lib/ai/generation-service';

interface EvaluationFeedbackProps {
  result: {
    transcription: string;
    evaluation: EvaluationResult;
  };
}

const EvaluationFeedback: React.FC<EvaluationFeedbackProps> = ({ result }) => {
  const { transcription, evaluation } = result;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-700 bg-green-100';
    if (score >= 60) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  return (
    <div className="mt-6 p-6 bg-white rounded-lg shadow-md border border-gray-200 space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Feedback on Your Answer</h2>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Your Answer (Transcription)</h3>
        <blockquote className="p-4 bg-gray-50 rounded-md border text-gray-600 italic">
          "{transcription}"
        </blockquote>
      </div>

      <div className="flex items-center space-x-4">
        <h3 className="text-lg font-semibold text-gray-700">Overall Score:</h3>
        <span className={`text-2xl font-bold px-3 py-1 rounded-md ${getScoreColor(evaluation.score)}`}>
          {evaluation.score}/100
        </span>
      </div>
      
      <p className="text-gray-700 font-medium text-lg">{evaluation.feedbackSummary}</p>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Detailed Evaluation</h3>
        
        <div className="prose max-w-none text-gray-600">
          <h4 className="font-semibold text-gray-700">Accuracy</h4>
          <p>{evaluation.evaluation.accuracy}</p>
          
          <h4 className="font-semibold text-gray-700">Depth & Clarity</h4>
          <p>{evaluation.evaluation.depthAndClarity}</p>
          
          <h4 className="font-semibold text-gray-700">Completeness</h4>
          <p>{evaluation.evaluation.completeness}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Overall Impression</h3>
        <p className="prose max-w-none text-gray-600">{evaluation.overallImpression}</p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Example of an Ideal Answer</h3>
        <div className="p-4 bg-gray-800 text-white rounded-md">
           <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
            {evaluation.refinedExampleAnswer}
           </pre>
        </div>
      </div>
    </div>
  );
};

export default EvaluationFeedback;