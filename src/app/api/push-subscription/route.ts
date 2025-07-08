import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = pushSubscriptionSchema.parse(await req.json());
    await prisma.pushSubscription.upsert({
      where: { endpoint: body.endpoint },
      update: { userId: user.id, keys: body.keys },
      create: { userId: user.id, endpoint: body.endpoint, keys: body.keys },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { endpoint } = await req.json();
    if (!endpoint)
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 },
      );

    await prisma.pushSubscription.deleteMany({
      where: { userId: user.id, endpoint: endpoint },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 },
    );
  }
}