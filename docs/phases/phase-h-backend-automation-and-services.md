Of course. Here is the detailed, atomic to-do list for Phase H, formatted as `phase-h-backend-automation-and-services.md`.

This phase is another critical backend-heavy stage that focuses on building the automated "magic" of the application. It covers both the content ingestion pipeline (from YouTube to our database via Gemini) and the push notification engine for reminders.

---

# **Phase H: Backend Automation and Service Integration**

**Goal:** Build the automated engines that power the app's dynamic nature. This includes implementing the **Content Ingestion Pipeline** (YouTube API -> Gemini API -> DB) and the **Reminder Scheduling Engine** (Vercel Cron -> FCM Push Notifications).

**Prerequisite:** Phase D (Database) must be complete. A Google Cloud Platform project must be set up with the YouTube Data API v3 and Google Gemini API enabled. A Firebase project must be set up for Cloud Messaging. All necessary API keys must be available.

---

### 1. YouTube & Gemini Content Ingestion Pipeline

-   [ ] **Task 1.1: Install YouTube API and Transcript Libraries:** Install the necessary libraries to interact with the YouTube API and fetch transcripts.
    ```bash
    npm install googleapis youtube-transcript
    ```

-   [ ] **Task 1.2: Add New Environment Variables:** Add the new API keys to your environment configuration.
    *   **File:** `.env.example`
    *   **Action:** Add the following lines.
    ```env
    # YouTube & Gemini Configuration
    YOUTUBE_API_KEY=
    YOUTUBE_CHANNEL_ID= # The ID of the Huberman Lab channel
    GEMINI_API_KEY=
    ```

-   [ ] **Task 1.3: Create YouTube Service Library:** Create a centralized library for interacting with the YouTube Data API.
    *   **File:** `src/lib/youtube/client.ts`
    *   **Action:** Create the file with functions to fetch the latest videos from the specified channel.
    ```typescript
    import { google } from 'googleapis';

    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });

    export async function getLatestVideos(channelId: string, since: Date) {
      const response = await youtube.search.list({
        part: ['snippet'],
        channelId: channelId,
        order: 'date',
        type: ['video'],
        publishedAfter: since.toISOString(),
      });
      return response.data.items || [];
    }
    ```

-   [ ] **Task 1.4: Create Transcript Service Library:** Create a library to fetch the transcript for a given video ID.
    *   **File:** `src/lib/youtube/transcript.ts`
    *   **Action:** Create a wrapper around the `youtube-transcript` library.
    ```typescript
    import { YoutubeTranscript } from 'youtube-transcript';

    export async function fetchTranscript(videoId: string): Promise<string> {
      try {
        const transcriptParts = await YoutubeTranscript.fetchTranscript(videoId);
        return transcriptParts.map(part => part.text).join(' ');
      } catch (error) {
        console.error(`Could not fetch transcript for video ID: ${videoId}`, error);
        throw new Error('Transcript not available for this video.');
      }
    }
    ```

-   [ ] **Task 1.5: Create AI Content Processing Service:** Create a service that takes a transcript and uses Gemini to extract structured data.
    *   **File:** `src/lib/ai/content-processor.ts`
    *   **Action:** Create a function that sends a transcript to Gemini with a specialized prompt.
    ```typescript
    import { GoogleGenerativeAI } from '@google/generative-ai';

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    export async function extractProtocolsFromTranscript(transcript: string) {
      const prompt = `
        Analyze the following podcast transcript. Your task is to extract actionable health and wellness protocols.
        For each protocol found, provide its name, a concise description, a step-by-step implementation guide, and a relevant category.
        Additionally, create a main summary for the entire episode.
        Return the data as a single, minified JSON object with no markdown formatting. The structure should be:
        {
          "episodeSummary": "string",
          "protocols": [
            {
              "name": "string",
              "category": "string",
              "description": "string",
              "implementationGuide": "string"
            }
          ]
        }
        
        Transcript:
        ---
        ${transcript}
        ---
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      // Add robust JSON parsing here
      return JSON.parse(responseText);
    }
    ```

-   [ ] **Task 1.6: Create the Content Ingestion API Route:** Build the main API endpoint that orchestrates the entire pipeline.
    *   **Command:** `mkdir -p src/app/api/cron/ingest-content`
    *   **File:** `src/app/api/cron/ingest-content/route.ts`
    *   **Action:** Create the `GET` handler. This route must be protected (e.g., by a secret token in the URL) because it will be called by a cron job.
    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import { prisma } from '@/lib/db';
    import { getLatestVideos } from '@/lib/youtube/client';
    import { fetchTranscript } from '@/lib/youtube/transcript';
    import { extractProtocolsFromTranscript } from '@/lib/ai/content-processor';

    export async function GET(req: NextRequest) {
      // IMPORTANT: Add security check here, e.g., check for a secret bearer token
      // if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
      //   return new NextResponse('Unauthorized', { status: 401 });
      // }
      
      const channelId = process.env.YOUTUBE_CHANNEL_ID!;
      
      // 1. Find the last checked video's date
      const lastEpisode = await prisma.episode.findFirst({ orderBy: { publishedAt: 'desc' } });
      const lastCheckDate = lastEpisode?.publishedAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days ago

      // 2. Fetch new videos from YouTube
      const newVideos = await getLatestVideos(channelId, lastCheckDate);

      // 3. Process each new video
      for (const video of newVideos) {
        const videoId = video.id!.videoId!;
        const existingEpisode = await prisma.episode.findUnique({ where: { sourceUrl: `https://www.youtube.com/watch?v=${videoId}` } });
        if (existingEpisode) continue; // Skip if already processed

        try {
          // 4. Get transcript
          const transcript = await fetchTranscript(videoId);

          // 5. Use AI to extract structured data
          const structuredData = await extractProtocolsFromTranscript(transcript);

          // 6. Save to database as DRAFT
          await prisma.episode.create({
            data: {
              title: video.snippet!.title!,
              publishedAt: new Date(video.snippet!.publishedAt!),
              sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
              description: video.snippet!.description!,
              status: 'DRAFT',
              summaries: {
                create: [{ content: structuredData.episodeSummary, type: 'ai_summary' }]
              },
              protocols: {
                create: structuredData.protocols.map(p => ({
                  name: p.name,
                  category: p.category,
                  description: p.description,
                  implementationGuide: p.implementationGuide,
                  status: 'DRAFT',
                }))
              }
            }
          });

        } catch (error) {
          console.error(`Failed to process video ${videoId}:`, error);
          // Optional: Log this failure to a separate table for admin review
        }
      }

      return NextResponse.json({ success: true, processed: newVideos.length });
    }
    ```

-   [ ] **Task 1.7: Configure Vercel Cron Job:**
    *   **File:** `vercel.json`
    *   **Action:** Create or update this file in the project root to define the scheduled job.
    ```json
    {
      "crons": [
        {
          "path": "/api/cron/ingest-content",
          "schedule": "0 5 * * *"
        }
      ]
    }
    ```

---
### 2. Push Notification Engine (Reminders)

-   [ ] **Task 2.1: Install Web Push Library:** Install the library for sending VAPID-secured push notifications.
    ```bash
    npm install web-push
    ```

-   [ ] **Task 2.2: Generate VAPID Keys:** Generate VAPID keys for securing push notifications.
    *   **Command:** `npx web-push generate-vapid-keys`
    *   **Action:** Run this command once in your terminal. It will output a public and a private key.

-   [ ] **Task 2.3: Add VAPID Keys to Environment:** Add the generated keys and your contact email to the environment variables.
    *   **File:** `.env.example`
    *   **Action:** Add the following lines.
    ```env
    # Web Push VAPID Keys
    NEXT_PUBLIC_VAPID_PUBLIC_KEY=
    VAPID_PRIVATE_KEY=
    VAPID_MAILTO=mailto:your-email@example.com
    ```

-   [ ] **Task 2.4: Create Reminder Dispatcher API Route:** Create the API route that will be triggered by a cron job to find and send due reminders.
    *   **Command:** `mkdir -p src/app/api/cron/dispatch-reminders`
    *   **File:** `src/app/api/cron/dispatch-reminders/route.ts`
    *   **Action:** Create the `GET` handler.
    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import { prisma } from '@/lib/db';
    import webpush from 'web-push';

    webpush.setVapidDetails(
      process.env.VAPID_MAILTO!,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    export async function GET(req: NextRequest) {
      // Add security check here
      
      const now = new Date();
      const currentHour = now.getUTCHours();
      const currentMinute = now.getUTCMinutes();
      // Find users whose local time matches the current UTC time
      // This is a complex query that may need refinement, but the concept is:
      // Find all active reminders where the user's local time is now.

      const dueReminders = await prisma.userReminder.findMany({
        where: { isActive: true }, // Simplified for this example
        include: {
          user: { include: { pushSubscriptions: true } },
          protocol: true,
        }
      });

      for (const reminder of dueReminders) {
        // More sophisticated timezone logic is needed here in a real app
        const userTime = reminder.reminderTime.split(':');
        // This is a placeholder for a real timezone check
        if (parseInt(userTime[0]) === currentHour && parseInt(userTime[1]) === currentMinute) {
          
          const payload = JSON.stringify({
            title: `Protocolize Reminder: ${reminder.protocol.name}`,
            body: reminder.protocol.description,
          });

          for (const sub of reminder.user.pushSubscriptions) {
            try {
              await webpush.sendNotification(sub as any, payload);
            } catch (error) {
              console.error('Failed to send push notification, may be expired.', error);
              // Optional: Delete expired subscription from DB
            }
          }
        }
      }

      return NextResponse.json({ success: true });
    }
    ```

-   [ ] **Task 2.5: Configure Vercel Cron Job for Reminders:**
    *   **File:** `vercel.json`
    *   **Action:** Add a new entry to the `crons` array. This one will run every minute.
    ```json
    {
      "crons": [
        {
          "path": "/api/cron/ingest-content",
          "schedule": "0 5 * * *"
        },
        {
          "path": "/api/cron/dispatch-reminders",
          "schedule": "* * * * *"
        }
      ]
    }
    ```