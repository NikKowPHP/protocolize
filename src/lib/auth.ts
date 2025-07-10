import { createClient } from './supabase/server';
import { prisma } from './db';
import type { AuthResponse, AuthError } from '@supabase/supabase-js';
import { ensureUserInDb } from './user';
import logger from './logger';

export async function signUp(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { data, error };
  }

  if (data.user) {
    try {
      await ensureUserInDb(data.user);
    } catch (dbError: any) {
      logger.error(
        { err: dbError, userId: data.user.id },
        'Failed to create user profile in local DB after Supabase signup',
      );

      const customError = {
        name: 'DatabaseError',
        message: 'Could not create user profile.',
        status: 500,
      } as AuthError;
      return { data: { user: null, session: null }, error: customError };
    }
  }

  return { data, error };
}

export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  return supabase.auth.signInWithPassword({ email, password });
}