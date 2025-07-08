import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
    
const MOCK_DAYS = Array.from({ length: 35 }, (_, i) => {
  const day = i - 5;
  const completed = day > 0 && Math.random() > 0.4;
  return { day, completed };
});

export const AdherenceCalendar = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Protocol Adherence</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {MOCK_DAYS.map(({ day, completed }, index) => (
            <div 
              key={index}
              className={`aspect-square flex items-center justify-center rounded 
                ${day <= 0 ? 'bg-muted/20' : completed ? 'bg-green-500/30' : 'bg-red-500/30'}
                ${day > 0 ? 'cursor-pointer hover:opacity-80' : ''}`}
            >
              {day > 0 && day}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};