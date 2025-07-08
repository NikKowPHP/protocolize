import { PrismaClient } from '@prisma/client';
import { seedPlans } from './seeders/plans';
import { seedProtocolsAndEpisodes } from './seeders/protocols';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  await seedPlans(prisma);
  await seedProtocolsAndEpisodes(prisma);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });