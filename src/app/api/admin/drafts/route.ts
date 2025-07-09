import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const drafts = await prisma.episode.findMany({
      where: { status: 'DRAFT' },
      include: {
        summaries: true,
        protocols: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });
    return NextResponse.json(drafts);
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft content' },
      { status: 500 },
    );
  }
}