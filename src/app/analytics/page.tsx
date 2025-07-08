import { AdherenceCalendar } from '@/components/adherence-calendar';
import { AnalyticsCharts } from '@/components/analytics-charts';
import React from 'react';

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Protocol Analytics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold">Adherence Calendar</h2>
          <AdherenceCalendar />
        </div>
        
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold">Progress Trends</h2>
          <AnalyticsCharts />
        </div>
      </div>
    </div>
  );
}