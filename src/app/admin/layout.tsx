import { getAdminUser } from '@/lib/admin/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminUser = await getAdminUser();
  if (!adminUser) {
    redirect('/login?error=Admins only');
  }
  return <>{children}</>;
}