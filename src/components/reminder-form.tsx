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

type FormData = {
  protocolId: string;
  reminderTime: string;
};

export const ReminderForm = () => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const { data: protocols, isLoading: protocolsLoading } = useQuery({
    queryKey: ['protocols'],
    queryFn: getProtocols
  });

  const createMutation = useMutation({
    mutationFn: createReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    }
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate({
      protocolId: data.protocolId,
      reminderTime: data.reminderTime
    });
  };

  if (protocolsLoading) return <div>Loading protocols...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Reminder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <Label htmlFor="protocol">Protocol</Label>
            <Select {...register('protocolId', { required: true })}>
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
            {errors.protocolId && (
              <p className="text-sm text-red-500">Protocol is required</p>
            )}
          </div>
          <div className="mb-4">
            <Label htmlFor="time">Reminder Time</Label>
            <Input
              id="time"
              type="time"
              defaultValue="08:00"
              {...register('reminderTime', { required: true })}
            />
            {errors.reminderTime && (
              <p className="text-sm text-red-500">Time is required</p>
            )}
          </div>
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
