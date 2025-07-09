'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format } from 'date-fns';

const fetchDrafts = async () => {
  const res = await fetch('/api/admin/drafts');
  if (!res.ok) throw new Error('Failed to fetch drafts');
  return res.json();
};

export function DraftsList() {
  const {
    data: drafts,
    isLoading,
    isError,
  } = useQuery({ queryKey: ['admin-drafts'], queryFn: fetchDrafts });

  if (isLoading) return <div>Loading drafts...</div>;
  if (isError)
    return <div className="text-red-500">Error loading drafts.</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Published At</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {drafts?.map((draft: any) => (
          <TableRow key={draft.id}>
            <TableCell>{draft.title}</TableCell>
            <TableCell>
              {format(new Date(draft.publishedAt), 'PPP')}
            </TableCell>
            <TableCell>
              <Button asChild>
                <Link href={`/admin/episodes/${draft.id}`}>Review</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}