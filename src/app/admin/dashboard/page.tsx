import { DraftsList } from '@/components/admin/drafts-list';

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <h2 className="text-2xl font-semibold mb-4">
        Content Drafts for Review
      </h2>
      <DraftsList />
    </div>
  );
}