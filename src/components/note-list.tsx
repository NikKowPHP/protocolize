'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getNotesForEpisode } from '@/lib/api/notes';
import { formatDistanceToNow } from 'date-fns';

export const NoteList = ({ episodeId }: { episodeId: string }) => {
  const {
    data: notes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['notes', episodeId],
    queryFn: () => getNotesForEpisode(episodeId),
    enabled: !!episodeId, // Only fetch if episodeId is provided
  });

  if (!episodeId) {
    return (
      <div className="text-center text-muted-foreground p-4">
        Select an episode to see your notes.
      </div>
    );
  }

  if (isLoading) return <div>Loading notes...</div>;
  if (isError) {
    return <div className="text-red-500">Failed to load notes.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes && notes.length > 0 ? (
          notes.map((note) => (
            <div key={note.id} className="p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-foreground">{note.content}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(new Date(note.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">
            No notes for this episode yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
