'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import ReportGenerator from './ReportGenerator';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ProgressMetrics {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  masteryScore: number;
  nextReviewDates: { [questionId: string]: Date };
  struggleData: {
    date: string;
    count: number;
    totalTime: number;
  }[];
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    fill: boolean;
  }[];
}

const generateHeatmapData = (struggleData: {date: string, count: number, totalTime: number}[]) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeks = 6;
  const data: number[][] = [];

  // Initialize empty grid
  for (let i = 0; i < weeks; i++) {
    data.push(Array(7).fill(0));
  }

  // Populate with actual data
  struggleData.forEach(entry => {
    const date = new Date(entry.date);
    const week = Math.floor(date.getDate() / 7);
    const day = date.getDay();
    if (week < weeks && day < 7) {
      data[week][day] += entry.count + (entry.totalTime / 60); // Combine count and time
    }
  });

  return { data, days };
};

const ProgressDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ProgressMetrics | null>(null);
  const [progressTrends, setProgressTrends] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/progress');
        if (!response.ok) {
          throw new Error('Failed to load progress metrics');
        }
        const data = await response.json();
        const userMetrics = data.metrics;
        const analyticsData = data.analytics;

        setMetrics(userMetrics);

        if (analyticsData?.progressTrend?.length > 0) {
          const trends = analyticsData.progressTrend;
          setProgressTrends({
            labels: trends.map((t: { date: string }) => new Date(t.date).toLocaleDateString()),
            datasets: [
              {
                label: 'Mastery Score Over Time',
                data: trends.map((t: { score: number }) => t.score),
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false,
              },
            ],
          });
        } else {
            setProgressTrends(null);
        }
      } catch (err) {
        setError('Failed to load progress metrics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [user]);

  if (!user) {
    return <div>Please log in to view your progress.</div>;
  }

  if (loading) {
    return <div>Loading progress metrics...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!metrics) {
    return <div>No progress data available.</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Your Progress</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-gray-100 rounded-md">
          <h3 className="font-semibold mb-2">Total Questions</h3>
          <p className="text-3xl">{metrics.totalQuestions}</p>
        </div>
        <div className="p-4 bg-gray-100 rounded-md">
          <h3 className="font-semibold mb-2">Correct Answers</h3>
          <p className="text-3xl">{metrics.correctAnswers}</p>
        </div>
        <div className="p-4 bg-gray-100 rounded-md">
          <h3 className="font-semibold mb-2">Incorrect Answers</h3>
          <p className="text-3xl">{metrics.incorrectAnswers}</p>
        </div>
        <div className="p-4 bg-gray-100 rounded-md">
          <h3 className="font-semibold mb-2">Mastery Score</h3>
          <p className="text-3xl">{metrics.masteryScore}%</p>
        </div>
      </div>
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Next Reviews</h3>
        {metrics.nextReviewDates && Object.keys(metrics.nextReviewDates).length > 0 ? (
          <ul>
            {Object.entries(metrics.nextReviewDates).map(([questionId, date]) => (
              <li key={questionId}>
                Question {questionId.substring(0, 6)}... - {new Date(date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        ) : (
          <p>No questions scheduled for review at this time.</p>
        )}
      </div>
      <div className="mt-6 p-4 bg-gray-100 rounded-md">
        <h3 className="font-semibold mb-2">Progress Trends</h3>
        {progressTrends ? (
          <Line data={progressTrends} />
        ) : (
          <p>Not enough data to show trends. Keep practicing!</p>
        )}
      </div>
      <div className="mt-6 p-4 bg-gray-100 rounded-md">
        <h3 className="font-semibold mb-2">Export Report</h3>
        <ReportGenerator />
      </div>

      <div className="mt-6 p-4 bg-gray-100 rounded-md">
        <h3 className="font-semibold mb-2">Struggle Heatmap</h3>
        {metrics.struggleData && metrics.struggleData.length > 0 ? (
          <div className="heatmap-container overflow-x-auto">
            <table className="heatmap" style={{ minWidth: '300px' }}>
              <tbody>
                {generateHeatmapData(metrics.struggleData).data.map((week, i) => (
                  <tr key={i}>
                    {week.map((value, j) => (
                      <td
                        key={j}
                        className="heatmap-cell"
                        style={{
                          backgroundColor: `rgba(255, 0, 0, ${Math.min(1, value / 10)})`,
                          width: '30px',
                          height: '30px'
                        }}
                        title={`${generateHeatmapData(metrics.struggleData).days[j]}: ${Math.round(value)} struggles`}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="heatmap-legend mt-2 flex gap-2 items-center">
              <span className="text-sm">Less</span>
              {[0, 0.25, 0.5, 0.75, 1].map(opacity => (
                <div
                  key={opacity}
                  className="h-4 w-4"
                  style={{backgroundColor: `rgba(255, 0, 0, ${opacity})`}}
                />
              ))}
              <span className="text-sm">More</span>
            </div>
          </div>
        ) : (
          <p>No struggle data available.</p>
        )}
      </div>
    </div>
  );
};

export default ProgressDashboard;