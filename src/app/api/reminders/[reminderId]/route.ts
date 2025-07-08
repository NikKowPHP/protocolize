import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

async function verifyOwnership(userId: string, reminderId: string) {
  const reminder = await prisma.userReminder.findUnique({
    where: { id: reminderId },
  });
  if (!reminder || reminder.userId !== userId) return null;
  return reminder;
}

const updateReminderSchema = z.object({
  reminderTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { reminderId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await verifyOwnership(user.id, params.reminderId))) {
    return NextResponse.json(
      { error: 'Reminder not found or permission denied.' },
      { status: 404 }
    );
  }

  try {
    const body = updateReminderSchema.parse(await req.json());
    const updatedReminder = await prisma.userReminder.update({
      where: { id: params.reminderId },
      data: body,
    });
    return NextResponse.json(updatedReminder);
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { reminderId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await verifyOwnership(user.id, params.reminderId))) {
    return NextResponse.json(
      { error: 'Reminder not found or permission denied.' },
      { status: 404 }
    );
  }

  await prisma.userReminder.delete({ where: { id: params.reminderId } });
  return new NextResponse(null, { status: 204 });
}