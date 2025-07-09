import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: { summaryId: string } },
) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { content } = await req.json();
    const updatedSummary = await prisma.summary.update({
      where: { id: params.summaryId },
      data: { content },
    });
    return NextResponse.json(updatedSummary);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update summary' },
      { status: 500 },
    );
  }
}