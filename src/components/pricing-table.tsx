'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { useState } from 'react';

const Feature = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-center space-x-2">
    <CheckCircle className="h-5 w-5 text-green-500" />
    <span className="text-muted-foreground">{children}</span>
  </li>
);

export const PricingTable = () => {
  const [loading, setLoading] = useState(false);

  const handleUpgradeClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create session');
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      alert(
        `Error: ${error instanceof Error ? error.message : 'Could not redirect to payment.'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Free</CardTitle>
          <CardDescription>Get started with the basics</CardDescription>
          <p className="text-4xl font-bold mt-2">$0</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            <Feature>Limited protocol summaries</Feature>
            <Feature>Pre-set foundational reminders</Feature>
            <Feature>Basic personal notes</Feature>
          </ul>
          <Button variant="outline" className="w-full" disabled>
            Your Current Plan
          </Button>
        </CardContent>
      </Card>
      <Card className="border-primary">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Premium</CardTitle>
          <CardDescription>Unlock your full potential</CardDescription>
          <p className="text-4xl font-bold mt-2">
            $7
            <span className="text-lg font-normal text-muted-foreground">
              /mo
            </span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            <Feature>Full content library & guides</Feature>
            <Feature>Unlimited & Customizable reminders</Feature>
            <Feature>Advanced note-taking</Feature>
            <Feature>Protocol adherence tracking</Feature>
            <Feature>Community notes access</Feature>
          </ul>
          <Button
            onClick={handleUpgradeClick}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Redirecting...' : 'Upgrade to Premium'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
