import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createTrackingLog } from '@/lib/api/tracking';
import { useToast } from '@/components/ui/use-toast';

interface ProtocolCardProps {
  id: string;
  name: string;
  category: string | null;
  description: string;
}

export const ProtocolCard = ({
  id,
  name,
  category,
  description,
}: ProtocolCardProps) => {
  const { toast } = useToast();

  const handleMarkComplete = async () => {
    try {
      await createTrackingLog({
        protocolId: id,
        trackedAt: new Date().toISOString(),
      });
      toast({
        title: 'Success',
        description: 'Protocol marked as complete for today',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to mark protocol as complete',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <Link href={`/protocols/${id}`} passHref>
        <Card className="hover:border-primary hover:shadow-lg transition-all cursor-pointer flex-grow">
          <CardHeader>
            <CardTitle className="text-xl">{name}</CardTitle>
            <CardDescription>{category || 'Uncategorized'}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      </Link>
      <CardFooter className="p-2">
        <Button
          onClick={handleMarkComplete}
          size="sm"
          className="w-full"
          variant="outline"
        >
          Mark as Complete for Today
        </Button>
      </CardFooter>
    </div>
  );
};
