Of course. Here is the detailed, atomic to-do list for Phase G, formatted as `phase-g-subscription-and-billing-integration.md`.

This is a critical backend-heavy phase that focuses on implementing the complete monetization engine. It involves setting up Stripe, creating API endpoints to manage billing, and building a secure webhook to handle real-time subscription updates.

---

# **Phase G: Subscription and Billing Integration**

**Goal:** Implement the complete monetization lifecycle by integrating with the Stripe API. This includes creating checkout sessions, handling the customer portal, and building a secure webhook endpoint to synchronize subscription status with the database.

**Prerequisite:** Phase D (Database) and Phase E (Core API) must be complete. A Stripe account must be created, and API keys (secret and publishable) must be available.

---

### 1. Stripe SDK and Configuration

-   [ ] **Task 1.1: Install Stripe Server-Side Library:** Install the official Stripe Node.js library for backend operations.
    ```bash
    npm install stripe
    ```

-   [ ] **Task 1.2: Add Stripe Environment Variables:** Add the Stripe API keys to the `.env.example` file and configure them in your local `.env` file and Vercel environment variables.
    *   **File:** `.env.example`
    *   **Action:** Add the following lines.
    ```env
    # Stripe Configuration
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
    STRIPE_SECRET_KEY=
    STRIPE_WEBHOOK_SECRET=
    ```

-   [ ] **Task 1.3: Create Stripe Service Library:** Create a centralized library for interacting with the Stripe SDK.
    *   **File:** `src/lib/stripe/client.ts`
    *   **Action:** Create the file with the Stripe client instance.
    ```typescript
    import Stripe from 'stripe';

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }

    export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-04-10',
      typescript: true,
    });
    ```

### 2. Stripe Checkout Session API

-   [ ] **Task 2.1: Create Checkout Session API Route:** Create the API endpoint that generates a Stripe Checkout session for a user to upgrade their plan.
    *   **Command:** `mkdir -p src/app/api/stripe/checkout-session`
    *   **File:** `src/app/api/stripe/checkout-session/route.ts`
    *   **Action:** Create the file and implement the `POST` handler. This logic will find or create a Stripe Customer for the user, then create a checkout session.
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

      try {
        const { planId, priceId } = await req.json(); // priceId is the Stripe Price ID (e.g., price_xxxx)
        
        let dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser) throw new Error('User not found in database.');

        let stripeCustomerId = dbUser.stripeCustomerId;

        // If user doesn't have a stripe customer id, create one
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
          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?status=success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?status=cancelled`,
        });

        if (!session.url) {
            throw new Error('Failed to create Stripe session URL.');
        }

        return NextResponse.json({ sessionId: session.id, url: session.url });
      } catch (error) {
        console.error('Stripe checkout error:', error);
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
      }
    }
    ```

-   [ ] **Task 2.2: Connect `PricingTable` to Checkout:** Update the `PricingTable` component to call the new checkout API endpoint and redirect the user to Stripe.
    *   **File:** `src/components/pricing-table.tsx`
    *   **Action:** Add an `onClick` handler to the "Upgrade to Premium" button that calls the `/api/stripe/checkout-session` endpoint and then redirects the user.
    ```tsx
    // Add to the top of pricing-table.tsx
    "use client";
    import { useState } from "react";
    import { loadStripe } from '@stripe/stripe-js';

    // Inside the PricingTable component
    const [loading, setLoading] = useState(false);

    const handleUpgradeClick = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/stripe/checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // IMPORTANT: Replace with your actual Stripe Price ID
            body: JSON.stringify({ priceId: 'price_YOUR_PREMIUM_PRICE_ID' }),
        });

        if (!res.ok) throw new Error('Failed to create session');
        
        const { url } = await res.json();
        window.location.href = url; // Redirect to Stripe Checkout
      } catch (error) {
        console.error(error);
        // You would show an error message to the user here
      } finally {
        setLoading(false);
      }
    };

    // Update the Premium button
    <Button onClick={handleUpgradeClick} disabled={loading} className="w-full">
      {loading ? "Redirecting..." : "Upgrade to Premium"}
    </Button>
    ```

---
### 3. Stripe Customer Portal API

-   [ ] **Task 3.1: Create Customer Portal API Route:** Create an endpoint that generates a Stripe Customer Portal session, allowing users to manage their subscription.
    *   **Command:** `mkdir -p src/app/api/stripe/customer-portal`
    *   **File:** `src/app/api/stripe/customer-portal/route.ts`
    *   **Action:** Create the file and implement the `POST` handler.
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

      try {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

        if (!dbUser?.stripeCustomerId) {
          throw new Error('User has no Stripe customer ID.');
        }

        const { url } = await stripe.billingPortal.sessions.create({
          customer: dbUser.stripeCustomerId,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
        });

        return NextResponse.json({ url });
      } catch (error) {
        console.error('Customer portal error:', error);
        return NextResponse.json({ error: 'Failed to create customer portal session' }, { status: 500 });
      }
    }
    ```

-   [ ] **Task 3.2: Connect `SubscriptionManagement` to Portal:** Update the `SubscriptionManagement` component to call the new portal API endpoint.
    *   **File:** `src/components/subscription-management.tsx`
    *   **Action:** Add an `onClick` handler to the "Manage Billing" button that calls the `/api/stripe/customer-portal` endpoint and redirects the user.
    ```tsx
    // Add to the top of subscription-management.tsx
    "use client";
    import { useState } from "react";

    // Inside the SubscriptionManagement component
    const [loading, setLoading] = useState(false);

    const handleManageBilling = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/stripe/customer-portal', { method: 'POST' });
            if (!res.ok) throw new Error('Failed to create portal session');
            const { url } = await res.json();
            window.location.href = url;
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    
    // Update the button
    <Button onClick={handleManageBilling} disabled={loading}>
      {loading ? "Redirecting..." : "Manage Billing"}
    </Button>
    ```

---
### 4. Stripe Webhook Handler

-   [ ] **Task 4.1: Create Webhook API Route:** Create the endpoint that will receive webhook events from Stripe.
    *   **Command:** `mkdir -p src/app/api/stripe/webhook`
    *   **File:** `src/app/api/stripe/webhook/route.ts`
    *   **Action:** Create the file and implement the `POST` handler. This is the most critical part: it must verify the Stripe signature and then handle various events to keep the local database in sync with Stripe.
    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import Stripe from 'stripe';
    import { stripe } from '@/lib/stripe/client';
    import { prisma } from '@/lib/db';

    export async function POST(req: NextRequest) {
      const body = await req.text();
      const sig = req.headers.get('stripe-signature') as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      let event: Stripe.Event;

      try {
        if (!sig || !webhookSecret) {
          throw new Error('Webhook secret or signature not found.');
        }
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      } catch (err: any) {
        console.log(`❌ Error message: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
      }

      try {
        switch (event.type) {
          case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
            
            await prisma.subscription.create({
              data: {
                providerId: subscription.id,
                userId: session.metadata!.supabaseUUID,
                status: subscription.status,
                planId: 'YOUR_PREMIUM_PLAN_ID_FROM_DB', // You'll need to fetch this
                endsAt: new Date(subscription.current_period_end * 1000),
              },
            });

            await prisma.user.update({
                where: { id: session.metadata!.supabaseUUID },
                data: { subscriptionTier: 'Premium', subscriptionStatus: subscription.status },
            });
            break;
          }
          case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            await prisma.subscription.update({
              where: { providerId: subscription.id },
              data: {
                status: subscription.status,
                endsAt: new Date(subscription.current_period_end * 1000),
              },
            });
            await prisma.user.update({
              where: { stripeCustomerId: subscription.customer as string },
              data: { subscriptionStatus: subscription.status },
            });
            break;
          }
          case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            await prisma.subscription.update({
              where: { providerId: subscription.id },
              data: { status: 'cancelled', endsAt: new Date() },
            });
            await prisma.user.update({
              where: { stripeCustomerId: subscription.customer as string },
              data: { subscriptionTier: 'Free', subscriptionStatus: 'cancelled' },
            });
            break;
          }
          default:
            console.log(`Unhandled event type: ${event.type}`);
        }
      } catch (error) {
          console.error('Webhook handler error:', error);
          return new NextResponse('Webhook handler failed. See logs.', { status: 500 });
      }
      
      return NextResponse.json({ received: true });
    }
    ```

-   [ ] **Task 4.2: Configure Webhook in Stripe Dashboard:**
    *   **Action:** Go to your Stripe Developer Dashboard.
    *   Navigate to **Developers > Webhooks**.
    *   Click **"Add an endpoint"**.
    *   For local testing, use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`. This will give you a webhook URL.
    *   Paste the webhook URL into the "Endpoint URL" field.
    *   Click **"Select events"** and listen for at least:
        *   `checkout.session.completed`
        *   `customer.subscription.updated`
        *   `customer.subscription.deleted`
    *   Click **"Add endpoint"**.
    *   Copy the **"Signing secret"** and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`.