'use client';

import React from 'react';

interface ReadinessIndicatorProps {
  score: number;
}

const ReadinessIndicator: React.FC<ReadinessIndicatorProps> = ({ score }) => {
  const getColor = () => {
    if (score > 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="p-4 bg-gray-100 rounded-md text-center">
      <h3 className="font-semibold mb-2">Interview Readiness</h3>
      <p className={`text-5xl font-bold ${getColor()}`}>{Math.round(score)}%</p>
      <p className="text-sm text-gray-600 mt-1">AI-based estimation</p>
    </div>
  );
};

export default ReadinessIndicator;