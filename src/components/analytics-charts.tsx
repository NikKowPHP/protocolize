'use client';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTrackingLogs } from '@/lib/api/tracking';
import { format, subWeeks } from 'date-fns';

export const AnalyticsCharts = () => {
  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['tracking'],
    queryFn: getTrackingLogs
  });

  if (isLoading) return <div>Loading analytics data...</div>;
  if (error) return <div>Error loading analytics data</div>;

  // Group logs by week
  const weeklyData = Array.from({ length: 4 }, (_, i) => {
    const weekStart = subWeeks(new Date(), 3 - i);
    const weekEnd = subWeeks(weekStart, -1);
    const weekName = `Week ${i + 1}`;
    
    const weekLogs = logs?.filter(log => {
      const logDate = new Date(log.trackedAt);
      return logDate >= weekStart && logDate < weekEnd;
    }) || [];

    return {
      name: weekName,
      adherence: weekLogs.length
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Consistency</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="adherence" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
