import { ProtocolList } from '@/components/protocol-list';
import React from 'react';

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <h2 className="text-2xl font-semibold mb-4">Featured Protocols</h2>
      <ProtocolList />
    </div>
  );
}