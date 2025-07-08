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

const createReminderSchema = z.object({
  protocolId: z.string().cuid(),
  reminderTime: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      'Invalid time format. Use HH:mm.',
    ),
  timezone: z.string(),
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

  const reminders = await prisma.userReminder.findMany({
    where: { userId: user.id },
  });
  return NextResponse.json(reminders);
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
    const body = createReminderSchema.parse(await req.json());
    const reminder = await prisma.userReminder.create({
      data: { userId: user.id, ...body },
    });
    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 },
    );
  }
}