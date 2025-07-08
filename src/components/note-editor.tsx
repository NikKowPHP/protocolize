'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createNote } from '@/lib/api/notes';
import { useForm } from 'react-hook-form';

interface NoteEditorProps {
  episodeId: string;
  episodeTitle: string;
}

type FormData = {
  content: string;
};

export const NoteEditor = ({ episodeId, episodeTitle }: NoteEditorProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<FormData>();

  const mutation = useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', episodeId] });
      reset();
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate({ episodeId, content: data.content });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Note for: {episodeTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="note-content" className="sr-only">
              Note Content
            </Label>
            <Textarea
              id="note-content"
              placeholder="Write your thoughts and takeaways here..."
              rows={10}
              {...register('content', { required: true })}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : 'Save Note'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
