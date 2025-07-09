import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTrackingLogs } from '@/lib/api/tracking';
import { format, subDays } from 'date-fns';

export const AdherenceCalendar = () => {
  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['tracking'],
    queryFn: getTrackingLogs
  });

  if (isLoading) return <div>Loading adherence data...</div>;
  if (error) return <div>Error loading adherence data</div>;

  // Generate last 35 days including today
  const days = Array.from({ length: 35 }, (_, i) => {
    const date = subDays(new Date(), 34 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const completed = logs?.some(log =>
      format(new Date(log.trackedAt), 'yyyy-MM-dd') === dateStr
    );
    return { day: i - 5, date, completed };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Protocol Adherence</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {days.map(({ day, date, completed }, index) => (
            <div
              key={index}
              className={`aspect-square flex items-center justify-center rounded
                ${day <= 0 ? 'bg-muted/20' : completed ? 'bg-green-500/30' : 'bg-red-500/30'}
                ${day > 0 ? 'cursor-pointer hover:opacity-80' : ''}`}
            >
              {day > 0 && date.getDate()}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
