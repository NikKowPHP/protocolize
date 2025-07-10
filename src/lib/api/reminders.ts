import { Reminder } from '@/lib/types/protocolize';

export const getReminders = async (): Promise<Reminder[]> => {
  const res = await fetch('/api/reminders');
  if (!res.ok) throw new Error('Failed to fetch reminders');
  return res.json();
};

type CreateReminderPayload = {
  protocolId: string;
  reminderTime: string;
  timezone: string;
  isActive?: boolean;
};

export const createReminder = async (
  payload: CreateReminderPayload,
): Promise<Reminder> => {
  const res = await fetch('/api/reminders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to create reminder');
  }
  return res.json();
};

type UpdateReminderPayload = {
  reminderTime?: string;
  isActive?: boolean;
};

export const updateReminder = async (
  reminderId: string,
  payload: UpdateReminderPayload,
): Promise<Reminder> => {
  const res = await fetch(`/api/reminders/${reminderId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to update reminder');
  }
  return res.json();
};

export const deleteReminder = async (reminderId: string): Promise<void> => {
  const res = await fetch(`/api/reminders/${reminderId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to delete reminder');
  }
};