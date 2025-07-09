import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createNoteSchema = z.object({
  episodeId: z.string().cuid(),
  content: z.string().min(1, 'Note content cannot be empty.'),
  isPublic: z.boolean().optional().default(false),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const episodeId = searchParams.get('episodeId');
  const publicOnly = searchParams.get('public') === 'true';

  if (!episodeId) {
    return NextResponse.json(
      { error: 'episodeId is required' },
      { status: 400 },
    );
  }

  if (publicOnly) {
    try {
      const notes = await prisma.note.findMany({
        where: {
          episodeId,
          isPublic: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      return NextResponse.json(notes);
    } catch (error) {
      console.error('Error fetching public notes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch public notes' },
        { status: 500 },
      );
    }
  }

  // Existing private notes logic
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  export const POST = async (req: NextRequest) => {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
  
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    try {
      const json = await req.json();
      const body = createNoteSchema.parse(json);
  
      // Feature Gating: Only premium users can create public notes
      if (body.isPublic) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { subscriptionTier: true },
        });
        if (dbUser?.subscriptionTier !== 'Premium') {
          return NextResponse.json(
            { error: 'Public notes are a premium feature.' },
            { status: 403 },
          );
        }
      }
  
      const note = await prisma.note.create({
        data: {
          userId: user.id,
          episodeId: body.episodeId,
          content: body.content,
          isPublic: body.isPublic,
        },
      });
  
      return NextResponse.json(note, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors }, { status: 400 });
      }
      console.error('Error creating note:', error);
      return NextResponse.json(
        { error: 'Failed to create note' },
        { status: 500 },
      );
    }
  }

  try {
    const notes = await prisma.note.findMany({
      where: {
        userId: user.id,
        episodeId: episodeId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 },
    );
  }
}