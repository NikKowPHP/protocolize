import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { prisma } from '@/lib/db';

async function updateSubscriptionStatus(
  subscriptionId: string,
  status: string,
  endsAt: Date | null,
) {
  const sub = await prisma.subscription.update({
    where: { providerId: subscriptionId },
    data: { status, endsAt },
    select: { userId: true },
  });

  const user = await prisma.user.findUnique({ where: { id: sub.userId } });
  if (!user)
    throw new Error(`User not found for subscription: ${subscriptionId}`);

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
    return new NextResponse('Webhook secret or signature not found.', {
      status: 400,
    });
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
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
        ) as Stripe.Subscription;
        const userId = session.metadata!.userId;

        const premiumPlan = await prisma.plan.findUnique({
          where: { name: 'Premium' },
        });
        if (!premiumPlan)
          throw new Error('Premium plan not found in database.');

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
          data: {
            subscriptionTier: 'Premium',
            subscriptionStatus: subscription.status,
          },
        });
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription & {
          current_period_end: number;
        };
        await updateSubscriptionStatus(
          subscription.id,
          subscription.status,
          new Date(subscription.current_period_end * 1000),
        );
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await updateSubscriptionStatus(
          subscription.id,
          'cancelled',
          new Date(),
        );
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Webhook handler database error:', error);
    return new NextResponse('Webhook handler failed. See logs.', {
      status: 500,
    });
  }

  return NextResponse.json({ received: true });
}