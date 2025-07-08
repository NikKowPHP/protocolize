import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

async function verifyOwnership(userId: string, logId: string) {
  const log = await prisma.userProtocolTracking.findUnique({
    where: { id: logId },
  });
  if (!log || log.userId !== userId) return null;
  return log;
}

const updateTrackingLogSchema = z.object({
  trackedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { logId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await verifyOwnership(user.id, params.logId))) {
    return NextResponse.json(
      { error: 'Tracking log not found or permission denied.' },
      { status: 404 }
    );
  }

  try {
    const body = updateTrackingLogSchema.parse(await req.json());
    const updatedLog = await prisma.userProtocolTracking.update({
      where: { id: params.logId },
      data: body,
    });
    return NextResponse.json(updatedLog);
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json({ error: error.errors }, { status: 400 });
    return NextResponse.json(
      { error: 'Failed to update tracking log' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { logId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!(await verifyOwnership(user.id, params.logId))) {
    return NextResponse.json(
      { error: 'Tracking log not found or permission denied.' },
      { status: 404 }
    );
  }

  await prisma.userProtocolTracking.delete({ where: { id: params.logId } });
  return new NextResponse(null, { status: 204 });
}