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