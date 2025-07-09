import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import webpush from 'web-push';

if (
  process.env.VAPID_MAILTO &&
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
  process.env.VAPID_PRIVATE_KEY
) {
  webpush.setVapidDetails(
    process.env.VAPID_MAILTO,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export async function GET(req: NextRequest) {
  if (
    req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const now = new Date();
  const currentTimeFormatted = now.toISOString();
  const dueReminders = await prisma.userReminder.findMany({
    where: {
      isActive: true,
      reminderTime: currentTimeFormatted,
    },
    include: {
      user: {
        select: {
          pushSubscriptions: true,
        },
      },
      protocol: {
        select: {
          name: true,
        },
      },
    },
  });

  let sentCount = 0;
  let failedCount = 0;

  for (const reminder of dueReminders) {
    try {
      const notificationPayload = {
        title: 'Protocolize Reminder',
        body: `Time to implement: ${reminder.protocol.name}`,
        data: {
          url: `/protocols/${reminder.protocolId}`,
        },
      };

      // Send to all of user's devices
      for (const subscription of reminder.user.pushSubscriptions) {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: subscription.keys as { p256dh: string; auth: string }
          },
          JSON.stringify(notificationPayload),
        );
      }

      await prisma.userReminder.update({
        where: { id: reminder.id },
        data: { isActive: false },
      });
      sentCount++;
    } catch (error) {
      console.error(
        `Failed to send reminder ${reminder.id}:`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      failedCount++;
    }
  }

  return NextResponse.json({
    success: true,
    sent: sentCount,
    failed: failedCount,
  });
}