import { PrismaClient } from '@prisma/client';

export async function seedPlans(prisma: PrismaClient) {
  console.log('Seeding subscription plans...');

  await prisma.plan.upsert({
    where: { name: 'Free' },
    update: {},
    create: {
      name: 'Free',
      description: 'Get started with the basics',
      stripeProductId: null, // No Stripe product for the free plan
      isActive: true,
    },
  });

  await prisma.plan.upsert({
    where: { name: 'Premium' },
    update: {},
    create: {
      name: 'Premium',
      description: 'Unlock your full potential',
      // IMPORTANT: Replace with your actual Stripe Product ID in production
      // For now, we use a placeholder. This will be configured via env vars later.
      stripeProductId: 'prod_placeholder_premium',
      isActive: true,
    },
  });
}