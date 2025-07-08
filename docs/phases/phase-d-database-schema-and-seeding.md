Of course. Here is the detailed, atomic to-do list for Phase D, formatted as `phase-d-database-schema-and-seeding.md`.

This phase marks the transition from static UI to a dynamic backend. Its sole focus is on establishing the application's data layer. It involves finalizing the Prisma schema, creating the first database migration, and then seeding the database with essential data like subscription plans and foundational protocols. This phase is critical for all subsequent backend development.

---

# **Phase D: Database Schema and Seeding**

**Goal:** Establish the application's data layer by implementing the final Prisma schema, running the initial database migration, and creating seed scripts to populate the database with necessary initial data (e.g., subscription plans, foundational protocols).

**Prerequisite:** Ensure your local development environment is running (e.g., via `docker-compose up -d`) and that your `.env` file is correctly configured with the `DATABASE_URL` pointing to the local PostgreSQL instance.

---

### 1. Schema Finalization & Migration

-   [ ] **Task 1.1: Finalize Prisma Schema:** Update `prisma/schema.prisma` to include all models and relations, ensuring it perfectly matches the application description document. Specifically, add the `Plan` and `Subscription` models and the many-to-many relation for `Episode` and `Protocol`.

    *   **File:** `prisma/schema.prisma`
    *   **Action:** Replace the entire file content with the following final schema.

    ```prisma
    generator client {
      provider = "prisma-client-js"
    }

    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }

    model User {
      id             String    @id @default(uuid())
      email          String    @unique
      name           String?
      supabaseAuthId String    @unique @map("supabase_auth_id")

      stripeCustomerId   String?   @unique @map("stripe_customer_id")
      subscriptionTier   String    @default("FREE")
      subscriptionStatus String?   @map("subscription_status")

      createdAt DateTime @default(now()) @map("created_at")
      updatedAt DateTime @updatedAt @map("updated_at")

      subscriptions     Subscription[]
      notes             Note[]
      reminders         UserReminder[]
      trackingLogs      UserProtocolTracking[]
      pushSubscriptions PushSubscription[]
    }

    model Plan {
      id              String         @id @default(cuid())
      name            String         @unique
      description     String?
      stripeProductId String?        @unique @map("stripe_product_id")
      isActive        Boolean        @default(true) @map("is_active")
      createdAt       DateTime       @default(now()) @map("created_at")
      updatedAt       DateTime       @updatedAt @map("updated_at")
      subscriptions   Subscription[]
    }

    model Subscription {
      id         String    @id @default(cuid())
      userId     String    @map("user_id")
      user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
      planId     String    @map("plan_id")
      plan       Plan      @relation(fields: [planId], references: [id], onDelete: Restrict)
      status     String
      provider   String    @default("stripe")
      providerId String    @unique @map("provider_id")
      endsAt     DateTime? @map("ends_at")
      createdAt  DateTime  @default(now()) @map("created_at")
      updatedAt  DateTime  @updatedAt @map("updated_at")
    }

    model Episode {
      id            String    @id @default(cuid())
      title         String
      episodeNumber Int?      @map("episode_number")
      publishedAt   DateTime? @map("published_at")
      description   String?   @db.Text
      sourceUrl     String?   @map("source_url")
      status        String    @default("DRAFT") // DRAFT, PUBLISHED, ARCHIVED
      createdAt     DateTime  @default(now()) @map("created_at")
      updatedAt     DateTime  @updatedAt @map("updated_at")

      protocols Protocol[] @relation(map: "EpisodeProtocols")
      summaries Summary[]
      notes     Note[]
    }

    model Protocol {
      id                  String    @id @default(cuid())
      name                String
      description         String    @db.Text
      category            String?
      implementationGuide String?   @db.Text @map("implementation_guide")
      researchLinks       Json?     @map("research_links")
      isFree              Boolean   @default(false) @map("is_free")
      status              String    @default("DRAFT") // DRAFT, PUBLISHED
      createdAt           DateTime  @default(now()) @map("created_at")
      updatedAt           DateTime  @updatedAt @map("updated_at")

      @@index([name, status])
      episodes     Episode[]              @relation(map: "EpisodeProtocols")
      reminders    UserReminder[]
      trackingLogs UserProtocolTracking[]
    }

    model Summary {
      id        String   @id @default(cuid())
      episodeId String   @map("episode_id")
      episode   Episode  @relation(fields: [episodeId], references: [id], onDelete: Cascade)
      content   String   @db.Text
      type      String   @default("summary")
      createdAt DateTime @default(now()) @map("created_at")
      updatedAt DateTime @updatedAt @map("updated_at")
    }

    model Note {
      id        String   @id @default(cuid())
      userId    String   @map("user_id")
      user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
      episodeId String   @map("episode_id")
      episode   Episode  @relation(fields: [episodeId], references: [id], onDelete: Cascade)
      content   String   @db.Text
      isPublic  Boolean  @default(false) @map("is_public")
      createdAt DateTime @default(now()) @map("created_at")
      updatedAt DateTime @updatedAt @map("updated_at")
    }

    model UserReminder {
      id           String   @id @default(cuid())
      userId       String   @map("user_id")
      user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
      protocolId   String   @map("protocol_id")
      protocol     Protocol @relation(fields: [protocolId], references: [id], onDelete: Cascade)
      reminderTime String   @map("reminder_time")
      timezone     String
      isActive     Boolean  @default(true) @map("is_active")
      createdAt    DateTime @default(now()) @map("created_at")
      updatedAt    DateTime @updatedAt @map("updated_at")
    }

    model UserProtocolTracking {
      id         String   @id @default(cuid())
      userId     String   @map("user_id")
      user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
      protocolId String   @map("protocol_id")
      protocol   Protocol @relation(fields: [protocolId], references: [id], onDelete: Cascade)
      trackedAt  DateTime @map("tracked_at") @db.Date
      notes      String?  @db.Text
      createdAt  DateTime @default(now()) @map("created_at")

      @@unique([userId, protocolId, trackedAt])
    }

    model PushSubscription {
      id        String   @id @default(cuid())
      userId    String   @map("user_id")
      user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
      endpoint  String   @unique
      keys      Json
      createdAt DateTime @default(now()) @map("created_at")
    }
    ```

-   [ ] **Task 1.2: Create Initial Database Migration:** Generate the first migration file based on the final schema. This will create the SQL necessary to build the database structure.
    ```bash
    npx prisma migrate dev --name init
    ```

---
### 2. Seeding Initial Data

-   [ ] **Task 2.1: Configure Prisma for Seeding:** Modify the `package.json` file to tell Prisma where to find our seed script.
    *   **File:** `package.json`
    *   **Action:** Add the `prisma` block to the JSON file.
    ```json
    {
      "name": "protocolize",
      "version": "0.1.0",
      "private": true,
      "prisma": {
        "seed": "ts-node --compiler-options '{\\\"module\\\":\\\"CommonJS\\\"}' prisma/seed.ts"
      },
      "scripts": {
        // ... existing scripts
      },
      // ... rest of the file
    }
    ```

-   [ ] **Task 2.2: Install Seeding Dependencies:** Install `ts-node`, which is required to run the TypeScript seed script directly.
    ```bash
    npm install -D ts-node
    ```

-   [ ] **Task 2.3: Create the Seed Script:** Create the main seed script file that will orchestrate the data creation process.
    *   **File:** `prisma/seed.ts`
    *   **Action:** Create the file with the following content. This script will call specific seeder functions for plans and protocols.
    ```typescript
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
    ```

-   [ ] **Task 2.4: Create the Plan Seeder:** Create a dedicated seeder for subscription plans.
    *   **Command:** `mkdir -p prisma/seeders`
    *   **File:** `prisma/seeders/plans.ts`
    *   **Action:** Create the file with the following content.
    ```typescript
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
          stripeProductId: 'prod_YOUR_PREMIUM_PRODUCT_ID', 
          isActive: true,
        },
      });
    }
    ```

-   [ ] **Task 2.5: Create the Protocol Seeder:** Create a dedicated seeder for the initial, free-tier protocols.
    *   **File:** `prisma/seeders/protocols.ts`
    *   **Action:** Create the file with the following content.
    ```typescript
    import { PrismaClient } from '@prisma/client';

    const foundationalProtocols = [
      {
        name: 'Morning Sunlight Exposure',
        description: 'View sunlight by going outside within 30-60 minutes of waking. Do this for 5-10 minutes on a clear day, or 15-20 minutes on an overcast day. Do not wear sunglasses.',
        category: 'Circadian Rhythm',
        implementationGuide: '1. Wake up.\n2. Go outside within 60 minutes.\n3. Face the general direction of the sun without looking at it directly.\n4. Stay out for 5-20 minutes depending on cloud cover.',
        isFree: true,
        status: 'PUBLISHED',
      },
      {
        name: 'Cold Exposure',
        description: 'Use deliberate cold exposure (e.g., cold shower, ice bath) to enhance metabolism, mood, and mental resilience. The goal is to be safely uncomfortable.',
        category: 'Metabolism & Resilience',
        implementationGuide: '1. Start with cold showers, ending your regular shower with 1-3 minutes of cold water.\n2. Gradually increase duration.\n3. For ice baths, aim for a temperature that is uncomfortably cold but safe to stay in for 1-5 minutes.',
        isFree: true,
        status: 'PUBLISHED',
      },
      {
        name: 'Non-Sleep Deep Rest (NSDR)',
        description: 'A 10-30 minute protocol of deliberate, structured relaxation to enhance learning, reduce stress, and restore focus. Can be done via guided scripts (e.g., Yoga Nidra).',
        category: 'Focus & Recovery',
        implementationGuide: '1. Find a quiet place where you can lie down without interruption.\n2. Use a guided NSDR script from sources like YouTube or other apps.\n3. Follow the instructions, focusing on body scanning and breathwork.',
        isFree: true,
        status: 'PUBLISHED',
      },
    ];

    export async function seedProtocolsAndEpisodes(prisma: PrismaClient) {
      console.log('Seeding foundational protocols and a placeholder episode...');

      // Create a placeholder episode to associate protocols with
      const episode = await prisma.episode.upsert({
        where: { sourceUrl: 'https://www.hubermanlab.com/episode/foundational-fitness-protocols' },
        update: {},
        create: {
          title: 'Foundational Fitness & Health Protocols',
          episodeNumber: 0,
          publishedAt: new Date('2023-01-01T12:00:00Z'),
          description: 'A collection of foundational protocols for health and wellness.',
          sourceUrl: 'https://www.hubermanlab.com/episode/foundational-fitness-protocols',
          status: 'PUBLISHED',
        },
      });

      for (const protocolData of foundationalProtocols) {
        const protocol = await prisma.protocol.upsert({
          where: { name: protocolData.name }, // This assumes names are unique for published, free protocols
          update: { ...protocolData },
          create: { ...protocolData },
        });

        // Link protocol to the episode
        await prisma.episode.update({
          where: { id: episode.id },
          data: {
            protocols: {
              connect: {
                id: protocol.id
              }
            }
          }
        });
      }
    }
    ```

-   [ ] **Task 2.6: Run the Seed Command:** Execute the seed script to populate the local database with the initial data.
    ```bash
    npx prisma db seed
    ```

---
### 3. Verification

-   [ ] **Task 3.1: Verify Data with Prisma Studio:** Open Prisma Studio to visually inspect the database and confirm that the `Plan` and `Protocol` tables have been populated correctly.
    ```bash
    npx prisma studio
    ```
    *Action: Open the browser to `localhost:5555`, click on the `Plan` model, and verify you see "Free" and "Premium". Click on the `Protocol` model and verify you see the three foundational protocols.*