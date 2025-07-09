import { PrismaClient } from '@prisma/client';

export async function seedProtocolsAndEpisodes(prisma: PrismaClient) {
  console.log('Seeding protocols and episodes...');

  // Create or find system user
  const systemUser = await prisma.user.upsert({
    where: { email: 'system@protocolize.app' },
    create: {
      email: 'system@protocolize.app',
      name: 'System Account',
      supabaseAuthId: 'system-account',
      role: 'ADMIN'
    },
    update: {}
  });

  // Create protocols with their associated episodes
  const morningSunlight = await prisma.protocol.create({
    data: {
      name: 'Morning Sunlight',
      description: 'View sunlight within 30-60 minutes of waking',
      episodes: {
        create: [
          {
            title: 'The Science of Morning Light',
            description: 'How morning sunlight sets your circadian rhythm'
          }
        ]
      }
    }
  });

  // Create default reminder for Morning Sunlight protocol
  await prisma.userReminder.create({
    data: {
      userId: systemUser.id,
      protocolId: morningSunlight.id,
      reminderTime: '08:00:00', // 8 AM
      timezone: 'UTC',
      isActive: true
    }
  });

  const nsdr = await prisma.protocol.create({
    data: {
      name: 'NSDR',
      description: 'Non-Sleep Deep Rest protocol',
      episodes: {
        create: [
          {
            title: 'The Power of NSDR',
            description: 'How NSDR can enhance focus and recovery'
          }
        ]
      }
    }
  });

  // Create default reminder for NSDR protocol
  await prisma.userReminder.create({
    data: {
      userId: systemUser.id,
      protocolId: nsdr.id,
      reminderTime: '13:00:00', // 1 PM
      timezone: 'UTC',
      isActive: true
    }
  });

  const coldExposure = await prisma.protocol.create({
    data: {
      name: 'Cold Exposure',
      description: 'Using cold to boost metabolism and resilience',
      episodes: {
        create: [
          {
            title: 'Cold Exposure Benefits',
            description: 'Science and protocols for cold exposure'
          }
        ]
      }
    }
  });

  // Create default reminder for Cold Exposure protocol
  await prisma.userReminder.create({
    data: {
      userId: systemUser.id,
      protocolId: coldExposure.id,
      reminderTime: '07:00:00', // 7 AM
      timezone: 'UTC',
      isActive: true
    }
  });
}