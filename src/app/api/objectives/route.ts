// ROO-AUDIT-TAG :: plan-002-topic-selection.md :: Implement objective creation with question generation trigger
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { ensureUserInDb } from '@/lib/user';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const objectives = await prisma.objective.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(objectives);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error fetching objectives:', error.message);
    } else {
      console.error('Unknown error fetching objectives');
    }
    return NextResponse.json({ error: 'Failed to fetch objectives' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    await ensureUserInDb(user);

    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { name, description } = body;
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Create the objective
    const objective = await prisma.objective.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        userId: user.id
      }
    });

    return NextResponse.json(objective, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    if (error instanceof Error) {
      console.error('Database Error:', error.message);
    } else {
      console.error('Unknown Error:', error);
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Objective ID is required' }, { status: 400 });
    }

    await prisma.objective.delete({
      where: {
        id: id,
        userId: user.id
      }
    });

    return NextResponse.json({ message: 'Objective deleted successfully' });
  } catch (error: unknown) {
    if (error instanceof Error && (error as any).code === 'P2025') {
        return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
    }
    if (error instanceof Error) {
      console.error('Error deleting objective:', error.message);
    } else {
      console.error('Unknown error deleting objective');
    }
    return NextResponse.json({ error: 'Failed to delete objective' }, { status: 500 });
  }
}
// ROO-AUDIT-TAG :: plan-002-topic-selection.md :: END