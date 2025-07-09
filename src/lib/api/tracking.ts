import { TrackingLog } from '@/lib/types/protocolize';

export const getTrackingLogs = async (): Promise<TrackingLog[]> => {
  const res = await fetch('/api/tracking');
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('This is a premium feature');
    }
    throw new Error('Failed to fetch tracking logs');
  }
  return res.json();
};

type CreateTrackingLogPayload = {
  protocolId: string;
  trackedAt: string;
  notes?: string;
};

export const createTrackingLog = async (
  payload: CreateTrackingLogPayload
): Promise<TrackingLog> => {
  const res = await fetch('/api/tracking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('This is a premium feature');
    }
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to create tracking log');
  }
  return res.json();
};