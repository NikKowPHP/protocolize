import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import Link from 'next/link';

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
  return (
    <Link href={`/protocols/${id}`} passHref>
      <Card className="hover:border-primary hover:shadow-lg transition-all cursor-pointer h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl">{name}</CardTitle>
          <CardDescription>{category || 'Uncategorized'}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
};
