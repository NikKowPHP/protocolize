import { PricingTable } from '@/components/pricing-table';
import React from 'react';

export default function PricingPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that works best for you. All plans include core features,
          with premium options for advanced users and teams.
        </p>
      </div>
      <PricingTable />
    </div>
  );
}