'use client';

import { useQuery } from '@tanstack/react-query';
import { ProtocolCard } from './protocol-card';
import { getProtocols } from '@/lib/api/content';

export const ProtocolList = () => {
  const {
    data: protocols,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['protocols'],
    queryFn: getProtocols,
  });

  if (isLoading) {
    return <div className="text-center p-4">Loading protocols...</div>;
  }

  if (isError) {
    return (
      <div className="text-red-500 text-center p-4">
        Error loading protocols. Please try again later.
      </div>
    );
  }

  if (!protocols || protocols.length === 0) {
    return <div className="text-center p-4">No protocols found.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {protocols.map((protocol) => (
        <ProtocolCard key={protocol.id} {...protocol} />
      ))}
    </div>
  );
};
