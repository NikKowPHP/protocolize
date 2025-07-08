import { Episode, Protocol } from '@/lib/types/protocolize';

export const getProtocols = async (): Promise<Protocol[]> => {
  const res = await fetch('/api/protocols');
  if (!res.ok) {
    throw new Error('Failed to fetch protocols');
  }
  return res.json();
};

export const getEpisodes = async (): Promise<Episode[]> => {
  const res = await fetch('/api/episodes');
  if (!res.ok) {
    throw new Error('Failed to fetch episodes');
  }
  return res.json();
};