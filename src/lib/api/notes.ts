import { Note } from '@/lib/types/protocolize';

export const getNotesForEpisode = async (
  episodeId: string,
  publicOnly: boolean = false
): Promise<Note[]> => {
  const url = publicOnly
    ? `/api/notes?episodeId=${episodeId}&public=true`
    : `/api/notes?episodeId=${episodeId}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch notes');
  return res.json();
};

type CreateNotePayload = {
  episodeId: string;
  content: string;
  isPublic?: boolean;
};
export const createNote = async (
  payload: CreateNotePayload,
): Promise<Note> => {
  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to create note');
  }
  return res.json();
};