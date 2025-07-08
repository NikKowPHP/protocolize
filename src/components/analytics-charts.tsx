'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MOCK_DATA = [
  { name: 'Week 1', adherence: 4 },
  { name: 'Week 2', adherence: 6 },
  { name: 'Week 3', adherence: 5 },
  { name: 'Week 4', adherence: 7 },
];

export const AnalyticsCharts = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Consistency</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={MOCK_DATA}>
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