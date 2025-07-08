import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
          <Input id="email" type="email" defaultValue="jane.doe@example.com" disabled />
        </div>
        <Button>Update Profile</Button>
      </CardContent>
    </Card>
  );
};

export const SubscriptionManagement = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>Manage your billing and subscription details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>You are currently on the <span className="font-semibold text-primary">Premium Plan</span>.</p>
        <p className="text-sm text-muted-foreground">Your subscription will renew on July 31, 2024.</p>
        <Button>Manage Billing</Button>
      </CardContent>
    </Card>
  );
};