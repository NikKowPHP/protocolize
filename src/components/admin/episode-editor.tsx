'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

// A generic update mutation function
const updateApi = async ({ url, data }: { url: string; data: any }) => {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update ${url}`);
  return res.json();
};

export function EpisodeEditor({ episode }: { episode: any }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { register, control, handleSubmit } = useForm({
    defaultValues: episode,
  });

  const { fields: protocolFields } = useFieldArray({
    control,
    name: 'protocols',
  });

  const { fields: summaryFields } = useFieldArray({
    control,
    name: 'summaries',
  });

  const updateMutation = useMutation({
    mutationFn: updateApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drafts'] });
      alert('Update successful!');
    },
    onError: (error) => alert(error.message),
  });

  const handlePublish = () => {
    // First, save any pending changes
    handleSubmit(onSubmit)();

    // Then, publish the main episode
    updateMutation.mutate(
      {
        url: `/api/admin/episodes/${episode.id}`,
        data: { status: 'PUBLISHED' },
      },
      {
        onSuccess: () => {
          // Also publish all associated protocols
          episode.protocols.forEach((protocol: any) => {
            updateMutation.mutate({
              url: `/api/admin/protocols/${protocol.id}`,
              data: { status: 'PUBLISHED' },
            });
          });
          alert('Episode and all its protocols have been published!');
          router.push('/admin/dashboard');
        },
      }
    );
  };

  const onSubmit = (data: any) => {
    // Update episode details
    updateMutation.mutate({
      url: `/api/admin/episodes/${episode.id}`,
      data: { title: data.title, description: data.description },
    });

    // Update summaries
    data.summaries.forEach((summary: any) =>
      updateMutation.mutate({
        url: `/api/admin/summaries/${summary.id}`,
        data: { content: summary.content },
      })
    );

    // Update protocols
    data.protocols.forEach((protocol: any) =>
      updateMutation.mutate({
        url: `/api/admin/protocols/${protocol.id}`,
        data: protocol, // send the whole protocol object
      })
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Episode Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input {...register('title')} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea {...register('description')} rows={5} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summaries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {summaryFields.map((field, index) => (
            <div key={field.id}>
              <Label>Summary Content</Label>
              <Textarea
                {...register(`summaries.${index}.content`)}
                rows={8}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Protocols</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {protocolFields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-md space-y-4">
              <div>
                <Label>Protocol Name</Label>
                <Input {...register(`protocols.${index}.name`)} />
              </div>
              <div>
                <Label>Category</Label>
                <Input {...register(`protocols.${index}.category`)} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea {...register(`protocols.${index}.description`)} />
              </div>
              <div>
                <Label>Implementation Guide</Label>
                <Textarea
                  {...register(`protocols.${index}.implementationGuide`)}
                  rows={6}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id={`isFree-${index}`}
                  {...register(`protocols.${index}.isFree`)}
                />
                <Label htmlFor={`isFree-${index}`}>Is Free?</Label>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Save All Changes'}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handlePublish}
          disabled={updateMutation.isPending}
        >
          Save & Publish
        </Button>
      </div>
    </form>
  );
}