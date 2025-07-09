'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { getNotesForEpisode } from '@/lib/api/notes';

export const PublicNotesList = ({ episodeId }: { episodeId: string }) => {
  const {
    data: notes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['notes', episodeId, 'public'],
    queryFn: () => getNotesForEpisode(episodeId, true),
    enabled: !!episodeId,
  });

  if (!episodeId) {
    return (
      <div className="text-center text-muted-foreground p-4">
        Select an episode to see community notes.
      </div>
    );
  }

  if (isLoading) return <div>Loading community notes...</div>;
  if (isError) {
    return <div className="text-red-500">Failed to load community notes.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes && notes.length > 0 ? (
          notes.map((note) => (
            <div key={note.id} className="p-3 bg-muted/50 rounded-md">
              <p className="text-sm text-foreground">{note.content}</p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-muted-foreground">
                  {note.user?.name || 'Anonymous'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(note.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground">
            No community notes for this episode yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
};