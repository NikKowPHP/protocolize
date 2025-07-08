import { ReminderForm } from '@/components/reminder-form';
import { ReminderList } from '@/components/reminder-list';
import React from 'react';

export default function StudyPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Study & Reminders</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Schedule New Reminder</h2>
          <ReminderForm />
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Your Scheduled Reminders</h2>
          <ReminderList />
        </div>
      </div>
    </div>
  );
}
