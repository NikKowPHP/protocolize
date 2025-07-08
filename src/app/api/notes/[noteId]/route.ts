import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateNoteSchema = z.object({
  content: z.string().min(1).optional(),
  isPublic: z.boolean().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { noteId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const note = await prisma.note.findUnique({ where: { id: params.noteId } });
  if (!note || note.userId !== user.id) {
    return NextResponse.json(
      { error: 'Note not found or you do not have permission to edit it.' },
      { status: 404 }
    );
  }

  try {
    const json = await req.json();
    const body = updateNoteSchema.parse(json);

    const updatedNote = await prisma.note.update({
      where: { id: params.noteId },
      data: body,
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { noteId: string } }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const note = await prisma.note.findUnique({ where: { id: params.noteId } });
  if (!note || note.userId !== user.id) {
    return NextResponse.json(
      { error: 'Note not found or you do not have permission to delete it.' },
      { status: 404 }
    );
  }

  await prisma.note.delete({ where: { id: params.noteId } });

  return new NextResponse(null, { status: 204 });
}