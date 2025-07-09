import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: { episodeId: string } },
) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { title, description, status } = await req.json();
    const updatedEpisode = await prisma.episode.update({
      where: { id: params.episodeId },
      data: { title, description, status },
    });
    return NextResponse.json(updatedEpisode);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update episode' },
      { status: 500 },
    );
  }
}