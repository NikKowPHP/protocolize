You are absolutely right. My apologies for that critical oversight. I skipped a crucial phase in the sequence. Thank you for the correction. An autonomous agent would have failed without this step.

Let's generate the complete, correct, and fully explicit plan for **Phase G**. This phase is dedicated to integrating the entire billing and subscription system, which is a cornerstone of the application's business logic.

---

# **Phase G: Subscription and Billing Integration**

**Goal:** Implement the complete monetization lifecycle by integrating with the Stripe API. This includes creating checkout sessions, handling the customer portal, and building a secure webhook endpoint to synchronize subscription status with the database.

**Prerequisite:** Phase D (Database) must be complete. A Stripe account must be created, and API keys (secret and publishable) must be available.

---

### 1. Stripe SDK and Configuration

-   [ ] **Task 1.1: Install Stripe Server-Side Library:** Install the official Stripe Node.js library for backend operations.
    ```bash
    npm install stripe
    ```

-   [ ] **Task 1.2: Add Stripe Environment Variables:** Add the Stripe API keys and the Premium Price ID to the `.env.example` file.
    *   **File:** `.env.example`
    *   **Action:** Add the following lines to the end of the file. You will need to create a "Premium" product in your Stripe Dashboard and a Price associated with it to get the `STRIPE_PREMIUM_PRICE_ID`.
    ```env
    # Stripe Configuration
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
    STRIPE_SECRET_KEY=
    STRIPE_WEBHOOK_SECRET=
    STRIPE_PREMIUM_PRICE_ID=
    ```

-   [ ] **Task 1.3: Create Stripe Service Library:** Create a centralized library for interacting with the Stripe SDK.
    *   **File:** `src/lib/stripe/client.ts`
    *   **Action:** Create the file with the following complete content.
    ```typescript
    import Stripe from 'stripe';

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }

    export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
      typescript: true,
    });
    ```

### 2. Stripe Checkout Session API

-   [ ] **Task 2.1: Create Checkout Session API Route:** Create the API endpoint that generates a Stripe Checkout session for a user to upgrade their plan.
    *   **Command:** `mkdir -p src/app/api/stripe/checkout-session`
    *   **File:** `src/app/api/stripe/checkout-session/route.ts`
    *   **Action:** Create the file with the following complete `POST` handler.
    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import { createClient } from '@/lib/supabase/server';
    import { prisma } from '@/lib/db';
    import { stripe } from '@/lib/stripe/client';

    export async function POST(req: NextRequest) {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;

      if (!priceId) {
        return NextResponse.json({ error: 'Stripe Price ID is not configured.' }, { status: 500 });
      }

      try {
        let dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser) throw new Error('User not found in database.');

        let stripeCustomerId = dbUser.stripeCustomerId;

        if (!stripeCustomerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.user_metadata?.name,
            metadata: { supabaseUUID: user.id },
          });
          stripeCustomerId = customer.id;
          await prisma.user.update({
            where: { id: user.id },
            data: { stripeCustomerId },
          });
        }
        
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          billing_address_collection: 'required',
          customer: stripeCustomerId,
          line_items: [{ price: priceId, quantity: 1 }],
          mode: 'subscription',
          success_url: `${appUrl}/dashboard?status=success`,
          cancel_url: `${appUrl}/pricing?status=cancelled`,
          metadata: {
            userId: user.id,
          }
        });

        if (!session.url) {
            throw new Error('Failed to create Stripe session URL.');
        }

        return NextResponse.json({ sessionId: session.id, url: session.url });
      } catch (error) {
        console.error('Stripe checkout error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `Failed to create checkout session: ${errorMessage}` }, { status: 500 });
      }
    }
    ```

-   [ ] **Task 2.2: Connect `PricingTable` to Checkout:** Update the `PricingTable` component to call the new checkout API endpoint and redirect the user to Stripe.
    *   **File:** `src/components/pricing-table.tsx`
    *   **Action:** Replace the entire file content with the following dynamic version.
    ```tsx
    "use client";

    import { Button } from "@/components/ui/button";
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
    import { CheckCircle } from "lucide-react";
    import { useState } from "react";

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
          alert(`Error: ${error instanceof Error ? error.message : 'Could not redirect to payment.'}`);
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
              <Button variant="outline" className="w-full" disabled>Your Current Plan</Button>
            </CardContent>
          </Card>
          <Card className="border-primary">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Premium</CardTitle>
              <CardDescription>Unlock your full potential</CardDescription>
              <p className="text-4xl font-bold mt-2">$7<span className="text-lg font-normal text-muted-foreground">/mo</span></p>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                <Feature>Full content library & guides</Feature>
                <Feature>Unlimited & Customizable reminders</Feature>
                <Feature>Advanced note-taking</Feature>
                <Feature>Protocol adherence tracking</Feature>
                <Feature>Community notes access</Feature>
              </ul>
              <Button onClick={handleUpgradeClick} disabled={loading} className="w-full">
                {loading ? "Redirecting..." : "Upgrade to Premium"}
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    };
    ```

---
### 3. Stripe Customer Portal API

-   [ ] **Task 3.1: Create Customer Portal API Route:** Create an endpoint that generates a Stripe Customer Portal session.
    *   **Command:** `mkdir -p src/app/api/stripe/customer-portal`
    *   **File:** `src/app/api/stripe/customer-portal/route.ts`
    *   **Action:** Create the file with the following complete `POST` handler.
    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import { createClient } from '@/lib/supabase/server';
    import { prisma } from '@/lib/db';
    import { stripe } from '@/lib/stripe/client';

    export async function POST(req: NextRequest) {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      try {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

        if (!dbUser?.stripeCustomerId) {
          throw new Error('User does not have a Stripe customer ID.');
        }

        const { url } = await stripe.billingPortal.sessions.create({
          customer: dbUser.stripeCustomerId,
          return_url: `${appUrl}/settings`,
        });

        return NextResponse.json({ url });
      } catch (error) {
        console.error('Customer portal error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: `Failed to create customer portal session: ${errorMessage}` }, { status: 500 });
      }
    }
    ```

-   [ ] **Task 3.2: Connect `SubscriptionManagement` to Portal:** Update the component to call the portal API.
    *   **File:** `src/components/user-settings-forms.tsx`
    *   **Action:** Replace the entire `SubscriptionManagement` component with the following dynamic version.
    ```tsx
    "use client";
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
    import { Button } from "@/components/ui/button";
    import { useState } from "react";

    export const SubscriptionManagement = () => {
      const [loading, setLoading] = useState(false);
      // In a real app, this data would come from a useQuery hook fetching user data
      const currentPlan = "Premium Plan"; 
      const renewalDate = "July 31, 2024";

      const handleManageBilling = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/stripe/customer-portal', { method: 'POST' });
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to create portal session');
          }
          const { url } = await res.json();
          window.location.href = url;
        } catch (error) {
          alert(`Error: ${error instanceof Error ? error.message : "Could not open billing portal."}`);
        } finally {
          setLoading(false);
        }
      };

      return (
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>Manage your billing and subscription details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You are currently on the <span className="font-semibold text-primary">{currentPlan}</span>.</p>
            <p className="text-sm text-muted-foreground">Your subscription will renew on {renewalDate}.</p>
            <Button onClick={handleManageBilling} disabled={loading}>
              {loading ? "Redirecting..." : "Manage Billing"}
            </Button>
          </CardContent>
        </Card>
      );
    };
    ```

---
### 4. Stripe Webhook Handler

-   [ ] **Task 4.1: Create Webhook API Route:** Create the endpoint that will receive and process webhook events from Stripe.
    *   **Command:** `mkdir -p src/app/api/stripe/webhook`
    *   **File:** `src/app/api/stripe/webhook/route.ts`
    *   **Action:** Create the file with the following complete `POST` handler.
    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import Stripe from 'stripe';
    import { stripe } from '@/lib/stripe/client';
    import { prisma } from '@/lib/db';

    async function updateSubscriptionStatus(subscriptionId: string, status: string, endsAt: Date | null) {
        const sub = await prisma.subscription.update({
            where: { providerId: subscriptionId },
            data: { status, endsAt },
            select: { userId: true }
        });

        const user = await prisma.user.findUnique({ where: { id: sub.userId }});
        if (!user) throw new Error(`User not found for subscription: ${subscriptionId}`);

        let newTier = user.subscriptionTier;
        if (status === 'canceled' || status === 'incomplete_expired') {
            newTier = 'Free';
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: status, subscriptionTier: newTier },
        });
    }

    export async function POST(req: NextRequest) {
      const body = await req.text();
      const sig = req.headers.get('stripe-signature') as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !webhookSecret) {
        return new NextResponse('Webhook secret or signature not found.', { status: 400 });
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      } catch (err: any) {
        console.log(`❌ Webhook signature verification failed: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
      }

      try {
        switch (event.type) {
          case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            const userId = session.metadata!.userId;
            
            const premiumPlan = await prisma.plan.findUnique({ where: { name: 'Premium' } });
            if (!premiumPlan) throw new Error("Premium plan not found in database.");

            await prisma.subscription.create({
              data: {
                providerId: subscription.id,
                userId: userId,
                status: subscription.status,
                planId: premiumPlan.id,
                endsAt: new Date(subscription.current_period_end * 1000),
              },
            });

            await prisma.user.update({
                where: { id: userId },
                data: { subscriptionTier: 'Premium', subscriptionStatus: subscription.status },
            });
            break;
          }
          case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            await updateSubscriptionStatus(subscription.id, subscription.status, new Date(subscription.current_period_end * 1000));
            break;
          }
          case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            await updateSubscriptionStatus(subscription.id, 'cancelled', new Date());
            break;
          }
          default:
            console.log(`Unhandled event type: ${event.type}`);
        }
      } catch (error) {
          console.error('Webhook handler database error:', error);
          return new NextResponse('Webhook handler failed. See logs.', { status: 500 });
      }
      
      return NextResponse.json({ received: true });
    }
    ```