import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const Feature = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2">
    <CheckCircle className="w-4 h-4 text-green-500" />
    <span>{children}</span>
  </div>
);

export const PricingTable = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Free Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Free</CardTitle>
          <CardDescription>Basic features to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-3xl font-bold">
            $0<span className="text-sm text-muted-foreground">/month</span>
          </div>
          <Button className="w-full">Get Started</Button>
          <div className="space-y-2">
            <Feature>Basic Protocol Tracking</Feature>
            <Feature>3 Reminders</Feature>
            <Feature>Community Notes</Feature>
          </div>
        </CardContent>
      </Card>

      {/* Pro Plan */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle>Pro</CardTitle>
          <CardDescription>For serious practitioners</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-3xl font-bold">
            $15<span className="text-sm text-muted-foreground">/month</span>
          </div>
          <Button className="w-full">Upgrade Now</Button>
          <div className="space-y-2">
            <Feature>Unlimited Protocols</Feature>
            <Feature>Unlimited Reminders</Feature>
            <Feature>Advanced Analytics</Feature>
            <Feature>Priority Support</Feature>
          </div>
        </CardContent>
      </Card>

      {/* Team Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
          <CardDescription>For groups and organizations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-3xl font-bold">
            $30<span className="text-sm text-muted-foreground">/month</span>
          </div>
          <Button className="w-full">Contact Sales</Button>
          <div className="space-y-2">
            <Feature>All Pro Features</Feature>
            <Feature>Team Management</Feature>
            <Feature>Shared Protocols</Feature>
            <Feature>Custom Reports</Feature>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
