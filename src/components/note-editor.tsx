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
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { createNote } from '@/lib/api/notes';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/auth-context';

interface NoteEditorProps {
  episodeId: string;
  episodeTitle: string;
}

type FormData = {
  content: string;
  isPublic: boolean;
};

export const NoteEditor = ({ episodeId, episodeTitle }: NoteEditorProps) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { register, handleSubmit, reset } = useForm<FormData>({
    defaultValues: {
      isPublic: false,
    },
  });

  const mutation = useMutation({
    mutationFn: createNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', episodeId] });
      queryClient.invalidateQueries({ queryKey: ['notes', episodeId, 'public'] });
      reset();
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate({
      episodeId,
      content: data.content,
      isPublic: data.isPublic,
    });
  };

  const isPremium = user?.user_metadata?.subscriptionTier === 'Premium';

  return (
    <TooltipProvider>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="public-note"
                  {...register('isPublic')}
                  disabled={!isPremium}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="public-note">Make Public</Label>
                  </TooltipTrigger>
                  {!isPremium && (
                    <TooltipContent>
                      <p>Public notes are a premium feature</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </div>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};