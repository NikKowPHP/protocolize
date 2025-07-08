import {
  UserProfileForm,
  SubscriptionManagement,
  NotificationSettings,
} from '@/components/user-settings-forms';
import React from 'react';

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and subscription preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <UserProfileForm />
        <SubscriptionManagement />
        <NotificationSettings />
      </div>
    </div>
  );
}
