import { subscribeToPushNotifications } from '@/lib/push-notifications';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const UserProfileForm = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
        <CardDescription>Update your name and email address.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" defaultValue="Jane Doe" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            defaultValue="jane.doe@example.com"
            disabled
          />
        </div>
        <Button>Update Profile</Button>
      </CardContent>
    </Card>
  );
};

export const NotificationSettings = () => {
  const handleEnableNotifications = async () => {
    try {
      await subscribeToPushNotifications();
      alert('Notifications enabled successfully!');
    } catch (error) {
      alert(
        `Error enabling notifications: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Enable push notifications for your reminders.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleEnableNotifications}>
          Enable Notifications
        </Button>
      </CardContent>
    </Card>
  );
};

export const SubscriptionManagement = () => {
  const [loading, setLoading] = useState(false);
  // In a real app, this data would come from a useQuery hook fetching user data
  const currentPlan = 'Premium Plan';
  const renewalDate = 'July 31, 2024';

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create portal session');
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      alert(
        `Error: ${error instanceof Error ? error.message : 'Could not open billing portal.'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>
          Manage your billing and subscription details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          You are currently on the{' '}
          <span className="font-semibold text-primary">{currentPlan}</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          Your subscription will renew on {renewalDate}.
        </p>
        <Button onClick={handleManageBilling} disabled={loading}>
          {loading ? 'Redirecting...' : 'Manage Billing'}
        </Button>
      </CardContent>
    </Card>
  );
};
