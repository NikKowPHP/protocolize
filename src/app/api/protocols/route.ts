import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const protocols = await prisma.protocol.findMany({
    where: { status: 'PUBLISHED' },
  });
  return NextResponse.json(protocols);
}