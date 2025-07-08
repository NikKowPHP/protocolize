

# **Phase E: Core Feature API Implementation**

**Goal:** Build the essential backend API routes for all core user-facing features. This involves creating the logic for CRUD operations, AI interactions, and business rules, with all routes protected by Supabase authentication.

**Prerequisite:** Phase D must be complete. The database schema should be migrated and seeded.

---

### 1. Note Management API

-   [ ] **Task 1.1: Create Note API Route File:** Create the directory structure and file for the notes API endpoint.
    *   **Command:** `mkdir -p src/app/api/notes`
    *   **File:** `src/app/api/notes/route.ts`
    *   **Action:** Create the file with placeholder content for now.

-   [ ] **Task 1.2: Implement `GET /api/notes`:** Implement the logic to fetch all notes for the currently authenticated user, linked to a specific episode.
    *   **File:** `src/app/api/notes/route.ts`
    *   **Action:** Add the `GET` handler to the file. This function should get the user from Supabase, parse the `episodeId` from the search parameters, and use Prisma to find the relevant notes.
    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import { createClient } from '@/lib/supabase/server';
    import { prisma } from '@/lib/db';

    export async function GET(req: NextRequest) {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(req.url);
      const episodeId = searchParams.get('episodeId');

      if (!episodeId) {
        return NextResponse.json({ error: 'episodeId is required' }, { status: 400 });
      }

      try {
        const notes = await prisma.note.findMany({
          where: {
            userId: user.id,
            episodeId: episodeId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
        return NextResponse.json(notes);
      } catch (error) {
        console.error('Error fetching notes:', error);
        return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
      }
    }
    ```

-   [ ] **Task 1.3: Implement `POST /api/notes`:** Implement the logic to create a new note for the authenticated user.
    *   **File:** `src/app/api/notes/route.ts`
    *   **Action:** Add the `POST` handler to the file. This function should validate the request body (`content`, `episodeId`, `isPublic`), check the user's subscription status before allowing `isPublic` to be true, and use Prisma to create the note.
    ```typescript
    // Add this POST function to src/app/api/notes/route.ts
    import { z } from 'zod';

    const createNoteSchema = z.object({
      episodeId: z.string().cuid(),
      content: z.string().min(1),
      isPublic: z.boolean().optional().default(false),
    });

    export async function POST(req: NextRequest) {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      try {
        const json = await req.json();
        const body = createNoteSchema.parse(json);

        // Feature Gating: Only premium users can create public notes
        if (body.isPublic) {
          const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
          if (dbUser?.subscriptionTier !== 'Premium') {
            return NextResponse.json({ error: 'Public notes are a premium feature.' }, { status: 403 });
          }
        }

        const note = await prisma.note.create({
          data: {
            userId: user.id,
            episodeId: body.episodeId,
            content: body.content,
            isPublic: body.isPublic,
          },
        });

        return NextResponse.json(note, { status: 201 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error creating note:', error);
        return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
      }
    }
    ```

-   [ ] **Task 1.4: Implement Note Deletion and Updates:** Create the dynamic API route file for individual notes and implement the `PUT` and `DELETE` handlers.
    *   **Command:** `mkdir -p src/app/api/notes/[noteId]`
    *   **File:** `src/app/api/notes/[noteId]/route.ts`
    *   **Action:** Create the file with `PUT` and `DELETE` handlers. Both should verify that the note being acted upon belongs to the authenticated user.
    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import { createClient } from '@/lib/supabase/server';
    import { prisma } from '@/lib/db';
    import { z } from 'zod';

    const updateNoteSchema = z.object({
      content: z.string().min(1),
      isPublic: z.boolean().optional(),
    });

    // PUT handler for updating a note
    export async function PUT(req: NextRequest, { params }: { params: { noteId: string } }) {
        // ... (Implementation for updating a note)
    }

    // DELETE handler for deleting a note
    export async function DELETE(req: NextRequest, { params }: { params: { noteId: string } }) {
        // ... (Implementation for deleting a note)
    }
    ```

---

### 2. Reminder Management API

-   [ ] **Task 2.1: Create Reminder API Route File:** Create the directory structure and file for the reminders API endpoint.
    *   **Command:** `mkdir -p src/app/api/reminders`
    *   **File:** `src/app/api/reminders/route.ts`
    *   **Action:** Create the file and implement the `GET` and `POST` handlers. **All reminder endpoints are premium-only features.**

    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import { createClient } from '@/lib/supabase/server';
    import { prisma } from '@/lib/db';
    import { z } from 'zod';

    async function checkPremium(userId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId }});
        return user?.subscriptionTier === 'Premium';
    }

    // GET all reminders for a user
    export async function GET(req: NextRequest) {
        // ... (Implementation for fetching all reminders)
    }

    const createReminderSchema = z.object({
        protocolId: z.string().cuid(),
        reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/), // "HH:mm" format
        timezone: z.string(),
    });

    // POST a new reminder
    export async function POST(req: NextRequest) {
        // ... (Implementation for creating a new reminder)
    }
    ```

-   [ ] **Task 2.2: Implement Reminder Deletion and Updates:** Create the dynamic API route file for individual reminders and implement the `PUT` and `DELETE` handlers.
    *   **Command:** `mkdir -p src/app/api/reminders/[reminderId]`
    *   **File:** `src/app/api/reminders/[reminderId]/route.ts`
    *   **Action:** Create the file with `PUT` and `DELETE` handlers, ensuring they verify ownership and premium status.
    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import { createClient } from '@/lib/supabase/server';
    import { prisma } from '@/lib/db';
    import { z } from 'zod';

    // PUT handler for updating a reminder
    export async function PUT(req: NextRequest, { params }: { params: { reminderId: string } }) {
        // ... (Implementation for updating a reminder)
    }

    // DELETE handler for deleting a reminder
    export async function DELETE(req: NextRequest, { params }: { params: { reminderId: string } }) {
        // ... (Implementation for deleting a reminder)
    }
    ```

---
### 3. Protocol Tracking API

-   [ ] **Task 3.1: Create Tracking API Route File:** Create the directory structure and file for the protocol tracking API endpoint.
    *   **Command:** `mkdir -p src/app/api/tracking`
    *   **File:** `src/app/api/tracking/route.ts`
    *   **Action:** Create the file and implement the `GET` and `POST` handlers. **All tracking endpoints are premium-only features.**

    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import { createClient } from '@/lib/supabase/server';
    import { prisma } from '@/lib/db';
    import { z } from 'zod';
    
    // GET all tracking logs for a user (can be filtered by date range)
    export async function GET(req: NextRequest) {
        // ... (Implementation for fetching tracking logs)
    }

    const createTrackingLogSchema = z.object({
        protocolId: z.string().cuid(),
        trackedAt: z.string().datetime(), // ISO 8601 date string
        notes: z.string().optional(),
    });

    // POST a new tracking log
    export async function POST(req: NextRequest) {
        // ... (Implementation for creating a new tracking log)
    }
    ```

---
### 4. Content Fetching API

-   [ ] **Task 4.1: Create Protocols API Route:** Create an endpoint to fetch published protocols.
    *   **Command:** `mkdir -p src/app/api/protocols`
    *   **File:** `src/app/api/protocols/route.ts`
    *   **Action:** Implement a `GET` handler that returns all protocols with a `status` of `"PUBLISHED"`.
    ```typescript
    import { NextResponse } from 'next/server';
    import { prisma } from '@/lib/db';

    export async function GET() {
      try {
        const protocols = await prisma.protocol.findMany({
          where: {
            status: 'PUBLISHED',
          },
          orderBy: {
            name: 'asc'
          }
        });
        return NextResponse.json(protocols);
      } catch (error) {
        console.error('Error fetching protocols:', error);
        return NextResponse.json({ error: 'Failed to fetch protocols' }, { status: 500 });
      }
    }
    ```

-   [ ] **Task 4.2: Create Single Protocol API Route:** Create a dynamic route to fetch a single published protocol by its ID.
    *   **Command:** `mkdir -p src/app/api/protocols/[protocolId]`
    *   **File:** `src/app/api/protocols/[protocolId]/route.ts`
    *   **Action:** Implement a `GET` handler that takes a `protocolId` and returns the corresponding protocol, but only if its `status` is `"PUBLISHED"`.
    ```typescript
    import { NextResponse } from 'next/server';
    import { prisma } from '@/lib/db';

    export async function GET(req: Request, { params }: { params: { protocolId: string } }) {
        // ... (Implementation for fetching a single protocol)
    }
    ```

-   [ ] **Task 4.3: Create Episodes API Route:** Create an endpoint to fetch published episodes.
    *   **Command:** `mkdir -p src/app/api/episodes`
    *   **File:** `src/app/api/episodes/route.ts`
    *   **Action:** Implement a `GET` handler that returns all episodes with a `status` of `"PUBLISHED"`, including their related protocols and summaries.
    ```typescript
    import { NextResponse } from 'next/server';
    import { prisma } from '@/lib/db';

    export async function GET() {
        try {
            const episodes = await prisma.episode.findMany({
                where: { status: 'PUBLISHED' },
                include: {
                    protocols: true,
                    summaries: true,
                },
                orderBy: {
                    publishedAt: 'desc'
                }
            });
            return NextResponse.json(episodes);
        } catch (error) {
            console.error('Error fetching episodes:', error);
            return NextResponse.json({ error: 'Failed to fetch episodes' }, { status: 500 });
        }
    }
    ```

-   [ ] **Task 4.4: Create Push Subscription API Route:** Create an endpoint for saving a user's web push subscription object.
    *   **Command:** `mkdir -p src/app/api/push-subscription`
    *   **File:** `src/app/api/push-subscription/route.ts`
    *   **Action:** Implement `POST` and `DELETE` handlers to manage `PushSubscription` records in the database, linked to the authenticated user.
    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import { createClient } from '@/lib/supabase/server';
    import { prisma } from '@/lib/db';
    import { z } from 'zod';

    // POST handler to save a subscription
    export async function POST(req: NextRequest) {
        // ... (Implementation for saving a push subscription)
    }

    // DELETE handler to remove a subscription
    export async function DELETE(req: NextRequest) {
        // ... (Implementation for deleting a push subscription)
    }
    ```