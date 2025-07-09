// Based on our Prisma Schema
export interface Protocol {
  id: string;
  name: string;
  description: string;
  category: string | null;
  implementationGuide: string | null;
  isFree: boolean;
  status: string;
}

export interface User {
  id: string;
  name: string | null;
  email: string | null;
}

export interface Note {
  id: string;
  userId: string;
  episodeId: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  user?: User;
}

export interface Summary {
  id: string;
  content: string;
  type: string;
}

export interface Episode {
  id: string;
  title: string;
  description: string | null;
  publishedAt: string | null;
  sourceUrl: string | null;
  protocols: Protocol[];
  summaries: Summary[];
}

export interface Reminder {
  id: string;
  userId: string;
  protocolId: string;
  reminderTime: string;
  isActive: boolean;
  createdAt: string;
}

export interface TrackingLog {
  id: string;
  userId: string;
  protocolId: string;
  trackedAt: string;
  notes: string | null;
}