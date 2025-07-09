import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/auth';
import { prisma } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: { protocolId: string } },
) {
  if (!(await getAdminUser()))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const {
      name,
      description,
      category,
      implementationGuide,
      isFree,
      status,
    } = await req.json();
    const updatedProtocol = await prisma.protocol.update({
      where: { id: params.protocolId },
      data: {
        name,
        description,
        category,
        implementationGuide,
        isFree,
        status,
      },
    });
    return NextResponse.json(updatedProtocol);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update protocol' },
      { status: 500 },
    );
  }
}