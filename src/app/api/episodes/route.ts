import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const episodes = await prisma.episode.findMany({
    where: { status: 'PUBLISHED' },
    include: {
      protocols: { where: { status: 'PUBLISHED' } },
      summaries: true,
    },
    orderBy: { publishedAt: 'desc' },
  });
  return NextResponse.json(episodes);
}