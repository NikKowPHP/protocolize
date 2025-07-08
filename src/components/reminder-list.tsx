import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MOCK_REMINDERS = [
  { id: 'r1', protocol: 'Morning Sunlight Exposure', time: '07:00' },
  { id: 'r2', protocol: 'Cold Exposure', time: '08:30' },
  { id: 'r3', protocol: 'Non-Sleep Deep Rest', time: '13:00' },
];

export const ReminderList = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled Reminders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {MOCK_REMINDERS.map((reminder) => (
          <div
            key={reminder.id}
            className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
          >
            <div>
              <p className="font-medium">{reminder.protocol}</p>
              <p className="text-sm text-muted-foreground">{reminder.time}</p>
            </div>
            <Button variant="destructive" size="sm">
              Remove
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
