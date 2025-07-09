import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getReminders, deleteReminder } from '@/lib/api/reminders';
import { Reminder } from '@/lib/types/protocolize';

export const ReminderList = () => {
  const queryClient = useQueryClient();

  const { data: reminders, isLoading, error } = useQuery<Reminder[]>({
    queryKey: ['reminders'],
    queryFn: getReminders
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReminder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
    }
  });

  if (isLoading) return <div>Loading reminders...</div>;
  if (error) return <div>Error loading reminders</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled Reminders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reminders?.map((reminder) => (
          <div
            key={reminder.id}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
          >
            <div>
              <p className="font-medium">{reminder.protocolId}</p>
              <p className="text-sm text-muted-foreground">
                {reminder.reminderTime}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteMutation.mutate(reminder.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Removing...' : 'Remove'}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
