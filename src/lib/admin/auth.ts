import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';
import { User } from '@supabase/supabase-js';

export async function getAdminUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (dbUser?.role === 'ADMIN') {
    return user;
  }

  return null;
}