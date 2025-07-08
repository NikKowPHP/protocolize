import { prisma } from './db';
import { createClient } from './supabase/server';

export interface Objective {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
}

export interface CreateObjectiveInput {
  name: string;
  description?: string;
  userId: string;
}

export const createObjective = async (input: CreateObjectiveInput) => {
  try {
    if (!input.name) {
      throw new Error('Objective name is required');
    }
     const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== input.userId) {
      throw new Error('Unauthorized');
    }

    const objective = await prisma.objective.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim(),
        userId: input.userId
      }
    });

    return objective;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error creating objective:', error.message);
      throw error;
    }
    console.error('Unknown error creating objective');
    throw new Error('Failed to create objective');
  }
};

export const getObjectives = async (userId: string) => {
  try {
       const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      throw new Error('Unauthorized');
    }

    return await prisma.objective.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error fetching objectives:', error.message);
      throw error;
    }
    console.error('Unknown error fetching objectives');
    throw new Error('Failed to fetch objectives');
  }
};

export const deleteObjective = async (objectiveId: string, userId: string) => {
  try {
       const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== userId) {
      throw new Error('Unauthorized');
    }

    await prisma.objective.delete({
      where: {
        id: objectiveId,
        userId: userId
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error deleting objective:', error.message);
      throw error;
    }
    console.error('Unknown error deleting objective');
    throw new Error('Failed to delete objective');
  }
};