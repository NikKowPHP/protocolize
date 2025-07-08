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
  const dueReminders = await prisma.reminder.findMany({
    where: {
      scheduledAt: {
        lte: now,
      },
      status: 'PENDING',
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
          JSON.parse(subscription.subscription),
          JSON.stringify(notificationPayload),
        );
      }

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: 'COMPLETED' },
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