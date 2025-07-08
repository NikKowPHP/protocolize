Of course. I have performed the critical review and will now generate the detailed, atomic, and fully explicit to-do list for **Phase E**.

This plan is meticulously crafted to eliminate all ambiguities and "lazy comments" we previously discussed. Each task contains the complete, final code required for its implementation, ensuring the autonomous AI agent can execute it precisely and successfully.

---

# **Phase E: Core Feature API Implementation**

**Goal:** Build the essential backend API routes for all core user-facing features. This involves creating the logic for CRUD operations, business rules, and feature gating, with all routes protected by Supabase authentication.

**Prerequisite:** Phase D must be complete. The database schema should be migrated and seeded.

---

### 1. Note Management API

-   [ ] **Task 1.1: Create Note API Route File and Implement `GET`:** Create the file for the notes API endpoint and implement the logic to fetch all notes for the currently authenticated user, filtered by a specific episode.
    *   **Command:** `mkdir -p src/app/api/notes`
    *   **File:** `src/app/api/notes/route.ts`
    *   **Action:** Create the file with the following complete `GET` handler.
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

-   [ ] **Task 1.2: Implement `POST /api/notes`:** Implement the logic to create a new note for the authenticated user, including validation and feature gating for public notes.
    *   **File:** `src/app/api/notes/route.ts`
    *   **Action:** Add the `POST` handler and its `zod` schema to the *same file*.
    ```typescript
    import { z } from 'zod';

    // Add this schema to the top of the file
    const createNoteSchema = z.object({
      episodeId: z.string().cuid(),
      content: z.string().min(1, "Note content cannot be empty."),
      isPublic: z.boolean().optional().default(false),
    });

    // Add this POST function to src/app/api/notes/route.ts
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
          const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { subscriptionTier: true } });
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

-   [ ] **Task 1.3: Implement Note Update and Delete API:** Create the dynamic API route file for individual notes and implement the `PUT` and `DELETE` handlers with ownership verification.
    *   **Command:** `mkdir -p src/app/api/notes/[noteId]`
    *   **File:** `src/app/api/notes/[noteId]/route.ts`
    *   **Action:** Create the file with the following complete content for `PUT` and `DELETE`.
    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import { createClient } from '@/lib/supabase/server';
    import { prisma } from '@/lib/db';
    import { z } from 'zod';

    const updateNoteSchema = z.object({
      content: z.string().min(1).optional(),
      isPublic: z.boolean().optional(),
    });

    export async function PUT(req: NextRequest, { params }: { params: { noteId: string } }) {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const note = await prisma.note.findUnique({ where: { id: params.noteId }});
      if (!note || note.userId !== user.id) {
        return NextResponse.json({ error: 'Note not found or you do not have permission to edit it.' }, { status: 404 });
      }

      try {
        const json = await req.json();
        const body = updateNoteSchema.parse(json);

        const updatedNote = await prisma.note.update({
          where: { id: params.noteId },
          data: body,
        });

        return NextResponse.json(updatedNote);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
      }
    }

    export async function DELETE(req: NextRequest, { params }: { params: { noteId: string } }) {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const note = await prisma.note.findUnique({ where: { id: params.noteId }});
      if (!note || note.userId !== user.id) {
        return NextResponse.json({ error: 'Note not found or you do not have permission to delete it.' }, { status: 404 });
      }

      await prisma.note.delete({ where: { id: params.noteId } });

      return new NextResponse(null, { status: 204 });
    }
    ```

---

### 2. Reminder Management API

-   [ ] **Task 2.1: Implement `GET` and `POST` for Reminders:** Create the reminders API route file and implement the logic for fetching and creating reminders, enforcing premium access for both actions.
    *   **Command:** `mkdir -p src/app/api/reminders`
    *   **File:** `src/app/api/reminders/route.ts`
    *   **Action:** Create the file with the following complete content.
    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import { createClient } from '@/lib/supabase/server';
    import { prisma } from '@/lib/db';
    import { z } from 'zod';

    async function isPremiumUser(userId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { subscriptionTier: true } });
        return user?.subscriptionTier === 'Premium';
    }

    const createReminderSchema = z.object({
        protocolId: z.string().cuid(),
        reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format. Use HH:mm."),
        timezone: z.string(),
    });

    export async function GET(req: NextRequest) {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (!(await isPremiumUser(user.id))) return NextResponse.json({ error: 'This is a premium feature.' }, { status: 403 });

      const reminders = await prisma.userReminder.findMany({ where: { userId: user.id } });
      return NextResponse.json(reminders);
    }

    export async function POST(req: NextRequest) {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (!(await isPremiumUser(user.id))) return NextResponse.json({ error: 'This is a premium feature.' }, { status: 403 });

      try {
        const body = createReminderSchema.parse(await req.json());
        const reminder = await prisma.userReminder.create({
          data: { userId: user.id, ...body },
        });
        return NextResponse.json(reminder, { status: 201 });
      } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
        return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
      }
    }
    ```

-   [ ] **Task 2.2: Implement Reminder Update and Delete API:** Create the dynamic API route for individual reminders with `PUT` and `DELETE` handlers.
    *   **Command:** `mkdir -p src/app/api/reminders/[reminderId]`
    *   **File:** `src/app/api/reminders/[reminderId]/route.ts`
    *   **Action:** Create the file with complete, ownership-verified logic for updating and deleting reminders.
    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import { createClient } from '@/lib/supabase/server';
    import { prisma } from '@/lib/db';
    import { z } from 'zod';

    // This file manages /api/reminders/[reminderId]

    async function verifyOwnership(userId: string, reminderId: string) {
      const reminder = await prisma.userReminder.findUnique({ where: { id: reminderId } });
      if (!reminder || reminder.userId !== userId) return null;
      return reminder;
    }

    const updateReminderSchema = z.object({
      reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      isActive: z.boolean().optional(),
    });

    export async function PUT(req: NextRequest, { params }: { params: { reminderId: string } }) {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        if (!(await verifyOwnership(user.id, params.reminderId))) {
            return NextResponse.json({ error: 'Reminder not found or permission denied.' }, { status: 404 });
        }

        try {
            const body = updateReminderSchema.parse(await req.json());
            const updatedReminder = await prisma.userReminder.update({
                where: { id: params.reminderId },
                data: body,
            });
            return NextResponse.json(updatedReminder);
        } catch(error) {
            if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
            return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
        }
    }

    export async function DELETE(req: NextRequest, { params }: { params: { reminderId: string } }) {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!(await verifyOwnership(user.id, params.reminderId))) {
            return NextResponse.json({ error: 'Reminder not found or permission denied.' }, { status: 404 });
        }
        
        await prisma.userReminder.delete({ where: { id: params.reminderId } });
        return new NextResponse(null, { status: 204 });
    }
    ```

---
### 3. Protocol Tracking API

-   [ ] **Task 3.1: Implement `GET` and `POST` for Protocol Tracking:** Create the tracking API route and implement the logic for fetching logs and creating new ones, enforcing premium access.
    *   **Command:** `mkdir -p src/app/api/tracking`
    *   **File:** `src/app/api/tracking/route.ts`
    *   **Action:** Create the file with the following complete content.
    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import { createClient } from '@/lib/supabase/server';
    import { prisma } from '@/lib/db';
    import { z } from 'zod';

    async function isPremiumUser(userId: string): Promise<boolean> {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { subscriptionTier: true } });
        return user?.subscriptionTier === 'Premium';
    }

    const createTrackingLogSchema = z.object({
        protocolId: z.string().cuid(),
        trackedAt: z.string().datetime(),
        notes: z.string().optional(),
    });

    export async function GET(req: NextRequest) {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (!(await isPremiumUser(user.id))) return NextResponse.json({ error: 'This is a premium feature.' }, { status: 403 });

      const logs = await prisma.userProtocolTracking.findMany({ where: { userId: user.id }, orderBy: { trackedAt: 'desc' } });
      return NextResponse.json(logs);
    }

    export async function POST(req: NextRequest) {
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (!(await isPremiumUser(user.id))) return NextResponse.json({ error: 'This is a premium feature.' }, { status: 403 });

      try {
        const body = createTrackingLogSchema.parse(await req.json());
        const log = await prisma.userProtocolTracking.create({
          data: { userId: user.id, ...body },
        });
        return NextResponse.json(log, { status: 201 });
      } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
        return NextResponse.json({ error: 'Failed to create tracking log' }, { status: 500 });
      }
    }
    ```

---
### 4. Content Fetching API

-   [ ] **Task 4.1: Implement Public Content Fetching APIs:** Create the API routes for fetching published protocols and episodes.
    *   **Command:** `mkdir -p src/app/api/protocols src/app/api/episodes`
    *   **File 1:** `src/app/api/protocols/route.ts`
    *   **Action 1:** Create the file with the following `GET` handler.
    ```typescript
    import { NextResponse } from 'next/server';
    import { prisma } from '@/lib/db';

    export async function GET() {
      const protocols = await prisma.protocol.findMany({ where: { status: 'PUBLISHED' } });
      return NextResponse.json(protocols);
    }
    ```
    *   **File 2:** `src/app/api/episodes/route.ts`
    *   **Action 2:** Create the file with the following `GET` handler.
    ```typescript
    import { NextResponse } from 'next/server';
    import { prisma } from '@/lib/db';

    export async function GET() {
      const episodes = await prisma.episode.findMany({
        where: { status: 'PUBLISHED' },
        include: { protocols: { where: { status: 'PUBLISHED' } }, summaries: true },
        orderBy: { publishedAt: 'desc' },
      });
      return NextResponse.json(episodes);
    }
    ```

---
### 5. Push Subscription API

-   [ ] **Task 5.1: Implement Push Subscription Management API:** Create the endpoint for saving and deleting a user's web push subscription object.
    *   **Command:** `mkdir -p src/app/api/push-subscription`
    *   **File:** `src/app/api/push-subscription/route.ts`
    *   **Action:** Create the file with `POST` and `DELETE` handlers.
    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import { createClient } from '@/lib/supabase/server';
    import { prisma } from '@/lib/db';
    import { z } from 'zod';

    const pushSubscriptionSchema = z.object({
        endpoint: z.string().url(),
        keys: z.object({
            p256dh: z.string(),
            auth: z.string(),
        }),
    });

    export async function POST(req: NextRequest) {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        try {
            const body = pushSubscriptionSchema.parse(await req.json());
            await prisma.pushSubscription.upsert({
                where: { endpoint: body.endpoint },
                update: { userId: user.id, keys: body.keys },
                create: { userId: user.id, endpoint: body.endpoint, keys: body.keys },
            });
            return NextResponse.json({ success: true });
        } catch (error) {
            if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 });
            return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
        }
    }

    export async function DELETE(req: NextRequest) {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        try {
            const { endpoint } = await req.json();
            if (!endpoint) return NextResponse.json({ error: "Endpoint is required" }, { status: 400 });

            await prisma.pushSubscription.deleteMany({
                where: { userId: user.id, endpoint: endpoint },
            });
            return new NextResponse(null, { status: 204 });
        } catch(error) {
            return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 });
        }
    }
    ```