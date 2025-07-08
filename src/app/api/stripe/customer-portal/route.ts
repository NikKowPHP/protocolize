import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe/client';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

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
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create customer portal session: ${errorMessage}` },
      { status: 500 },
    );
  }
}