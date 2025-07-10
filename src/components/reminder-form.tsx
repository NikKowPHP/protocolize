'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getProtocols } from '@/lib/api/content';
import { createReminder } from '@/lib/api/reminders';
import { Controller } from 'react-hook-form';

type FormData = {
  protocolId: string;
  reminderTime: string;
  timezone: string;
};

export const ReminderForm = () => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
    reset,
  } = useForm<FormData>();

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setValue('timezone', timezone);
  }, [setValue]);

  const { data: protocols, isLoading: protocolsLoading } = useQuery({
    queryKey: ['protocols'],
    queryFn: getProtocols,
  });

  const createMutation = useMutation({
    mutationFn: createReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      reset();
    },
    onError: (error) => {
      alert(`Error creating reminder: ${error.message}`);
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  if (protocolsLoading) return <div>Loading protocols...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Reminder</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="protocol">Protocol</Label>
            <Controller
              name="protocolId"
              control={control}
              rules={{ required: 'Protocol is required' }}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <SelectTrigger id="protocol">
                    <SelectValue placeholder="Select a protocol..." />
                  </SelectTrigger>
                  <SelectContent>
                    {protocols?.map((protocol) => (
                      <SelectItem key={protocol.id} value={protocol.id}>
                        {protocol.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.protocolId && (
              <p className="text-sm text-red-500 mt-1">
                {errors.protocolId.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="time">Reminder Time</Label>
            <Input
              id="time"
              type="time"
              defaultValue="08:00"
              {...register('reminderTime', { required: 'Time is required' })}
            />
            {errors.reminderTime && (
              <p className="text-sm text-red-500 mt-1">
                {errors.reminderTime.message}
              </p>
            )}
          </div>
          <input type="hidden" {...register('timezone')} />
          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Save Reminder'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};