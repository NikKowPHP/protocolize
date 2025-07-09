import { prisma } from './db';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { User as PrismaUser } from '@prisma/client';

/**
 * Ensures a user from Supabase Auth exists in the public User table.
 * If the user does not exist, it creates them.
 * This is useful for synchronizing users who signed up before the
 * creation logic was in place, or for just-in-time provisioning.
 *
 * @param supabaseUser The user object from `supabase.auth.getUser()`.
 * @returns The user from the public.User table (either found or newly created).
 */
export async function ensureUserInDb(
  supabaseUser: SupabaseUser,
): Promise<PrismaUser> {
  const dbUser = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
  });

  if (dbUser) {
    return dbUser;
  }

  // User not in our DB, so create them.
  console.log(
    `User with ID ${supabaseUser.id} not found in local DB. Creating...`,
  );
  const newUser = await prisma.user.create({
    data: {
      id: supabaseUser.id,
      supabaseAuthId: supabaseUser.id,
      email: supabaseUser.email!,
      name:
        supabaseUser.user_metadata?.full_name ||
        supabaseUser.user_metadata?.name ||
        null,
    },
  });
  console.log(`User with ID ${supabaseUser.id} created in local DB.`);

  // Create default reminders for new user
  const freeProtocols = await prisma.protocol.findMany({
    where: { isFree: true }
  });

  for (const protocol of freeProtocols) {
    await prisma.userReminder.createMany({
      data: [
        {
          userId: newUser.id,
          protocolId: protocol.id,
          reminderTime: '08:00',
          timezone: 'UTC',
          isActive: true
        },
        {
          userId: newUser.id,
          protocolId: protocol.id,
          reminderTime: '13:00',
          timezone: 'UTC',
          isActive: true
        }
      ]
    });
  }

  return newUser;
}
