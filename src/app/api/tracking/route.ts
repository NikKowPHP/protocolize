import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

async function isPremiumUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });
  return user?.subscriptionTier === 'Premium';
}

const createTrackingLogSchema = z.object({
  protocolId: z.string().cuid(),
  trackedAt: z.string().datetime(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await isPremiumUser(user.id)))
    return NextResponse.json(
      { error: 'This is a premium feature.' },
      { status: 403 },
    );

  const logs = await prisma.userProtocolTracking.findMany({
    where: { userId: user.id },
    orderBy: { trackedAt: 'desc' },
  });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await isPremiumUser(user.id)))
    return NextResponse.json(
      { error: 'This is a premium feature.' },
      { status: 403 },
    );

  try {
    const body = createTrackingLogSchema.parse(await req.json());
    const log = await prisma.userProtocolTracking.create({
      data: { userId: user.id, ...body },
    });
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json(
      { error: 'Failed to create tracking log' },
      { status: 500 },
    );
  }
}