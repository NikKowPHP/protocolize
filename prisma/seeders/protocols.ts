import { PrismaClient } from '@prisma/client';

export async function seedProtocolsAndEpisodes(prisma: PrismaClient) {
  console.log('Seeding protocols and episodes...');

  // Create protocols with their associated episodes
  await prisma.protocol.create({
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

  await prisma.protocol.create({
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

  await prisma.protocol.create({
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
}