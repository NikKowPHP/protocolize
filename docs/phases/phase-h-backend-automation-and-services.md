# **Phase H: Backend Automation and Service Integration**

**Goal:** Build the automated engines that power the app's dynamic nature. This includes implementing the **Content Ingestion Pipeline** (YouTube API -> Gemini API -> DB) and the **Reminder Scheduling Engine** (Vercel Cron -> FCM Push Notifications).

**Prerequisite:** Phase D (Database) must be complete. A Google Cloud Platform project must be set up with the YouTube Data API v3 and Google Gemini API enabled. A Firebase project must be set up for Cloud Messaging. All necessary API keys must be available.

---

### 1. YouTube & Gemini Content Ingestion Pipeline

- [ ] **Task 1.1: Install YouTube and Transcript Libraries:** Install the necessary libraries to interact with the YouTube API and fetch transcripts.

  ```bash
  npm install googleapis youtube-transcript
  ```

- [ ] **Task 1.2: Add New Environment Variables:** Add the new API keys to your environment configuration file.

  - **File:** `.env.example`
  - **Action:** Add the following lines to the end of the file.

  ```env
  # YouTube & Gemini Configuration
  YOUTUBE_API_KEY=
  YOUTUBE_CHANNEL_ID=
  GEMINI_API_KEY=
  ```

- [ ] **Task 1.3: Create YouTube Service Library:** Create a centralized library for interacting with the YouTube Data API.

  - **Command:** `mkdir -p src/lib/youtube`
  - **File:** `src/lib/youtube/client.ts`
  - **Action:** Create the file with the following complete content.

  ```typescript
  import { google } from 'googleapis';

  if (!process.env.YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY is not defined in environment variables.');
  }

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
      maxResults: 10, // Check up to 10 latest videos
    });
    return response.data.items || [];
  }
  ```

- [ ] **Task 1.4: Create Transcript Service Library:** Create a library to fetch the transcript for a given video ID.

  - **File:** `src/lib/youtube/transcript.ts`
  - **Action:** Create the file with the following complete content.

  ```typescript
  import { YoutubeTranscript } from 'youtube-transcript';

  export async function fetchTranscript(videoId: string): Promise<string> {
    try {
      const transcriptParts = await YoutubeTranscript.fetchTranscript(videoId);
      if (!transcriptParts || transcriptParts.length === 0) {
        throw new Error('No transcript parts returned.');
      }
      return transcriptParts.map((part) => part.text).join(' ');
    } catch (error) {
      console.error(
        `Could not fetch transcript for video ID: ${videoId}`,
        error,
      );
      throw new Error('Transcript not available for this video.');
    }
  }
  ```

- [ ] **Task 1.5: Create AI Content Processing Service:** Create a service that takes a transcript and uses Gemini to extract structured data.

  - **File:** `src/lib/ai/content-processor.ts`
  - **Action:** Create the file with the following complete content.

  ````typescript
  import { GoogleGenerativeAI } from '@google/generative-ai';

  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not defined.');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  export async function extractProtocolsFromTranscript(transcript: string) {
    const prompt = `
      Analyze the following podcast transcript. Your task is to extract actionable health and wellness protocols.
      For each protocol found, provide its name, a concise description, a step-by-step implementation guide, and a relevant category (e.g., "Sleep", "Focus", "Nutrition", "Fitness", "Mental Health", "Circadian Rhythm").
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
      ${transcript.substring(0, 30000)}
      ---
    `;

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanedJson = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(cleanedJson);
    } catch (error) {
      console.error('Error processing transcript with Gemini:', error);
      throw new Error('Failed to parse AI response.');
    }
  }
  ````

- [ ] **Task 1.6: Create the Content Ingestion API Route:** Build the main API endpoint that orchestrates the entire pipeline.

  - **Command:** `mkdir -p src/app/api/cron/ingest-content`
  - **File:** `src/app/api/cron/ingest-content/route.ts`
  - **Action:** Create the file with the following complete content for the `GET` handler.

  ```typescript
  import { NextRequest, NextResponse } from 'next/server';
  import { prisma } from '@/lib/db';
  import { getLatestVideos } from '@/lib/youtube/client';
  import { fetchTranscript } from '@/lib/youtube/transcript';
  import { extractProtocolsFromTranscript } from '@/lib/ai/content-processor';

  export async function GET(req: NextRequest) {
    if (
      req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!channelId) {
      return NextResponse.json(
        { error: 'YOUTUBE_CHANNEL_ID not configured.' },
        { status: 500 },
      );
    }

    const lastEpisode = await prisma.episode.findFirst({
      orderBy: { publishedAt: 'desc' },
    });
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const lastCheckDate = lastEpisode?.publishedAt
      ? lastEpisode.publishedAt > sevenDaysAgo
        ? lastEpisode.publishedAt
        : sevenDaysAgo
      : sevenDaysAgo;

    const newVideos = await getLatestVideos(channelId, lastCheckDate);
    let processedCount = 0;

    for (const video of newVideos) {
      const videoId = video.id?.videoId;
      if (!videoId) continue;

      const sourceUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const existingEpisode = await prisma.episode.findUnique({
        where: { sourceUrl },
      });
      if (existingEpisode) continue;

      try {
        const transcript = await fetchTranscript(videoId);
        const structuredData = await extractProtocolsFromTranscript(transcript);

        await prisma.episode.create({
          data: {
            title: video.snippet!.title!,
            publishedAt: new Date(video.snippet!.publishedAt!),
            sourceUrl: sourceUrl,
            description: video.snippet!.description!,
            status: 'DRAFT',
            summaries: {
              create: [
                { content: structuredData.episodeSummary, type: 'ai_summary' },
              ],
            },
            protocols: {
              create: structuredData.protocols.map((p: any) => ({
                name: p.name,
                category: p.category,
                description: p.description,
                implementationGuide: p.implementationGuide,
                status: 'DRAFT',
                isFree: false,
              })),
            },
          },
        });
        processedCount++;
      } catch (error) {
        console.error(
          `Failed to process video ${videoId}:`,
          error instanceof Error ? error.message : 'Unknown error',
        );
      }
    }

    return NextResponse.json({ success: true, processed: processedCount });
  }
  ```

- [ ] **Task 1.7: Configure Vercel Cron Job:**
  - **File:** `vercel.json`
  - **Action:** Create or update this file in the project root to define the scheduled job.
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/ingest-content",
        "schedule": "0 8 * * 1"
      }
    ]
  }
  ```
  _Note: This schedule runs at 8:00 AM UTC every Monday._

---

### 2. Push Notification Engine (Reminders)

- [ ] **Task 2.1: Install Web Push Library:** Install the library for sending VAPID-secured push notifications.

  ```bash
  npm install web-push
  ```

- [ ] **Task 2.2: Generate VAPID Keys:** Generate VAPID keys for securing push notifications.

  - **Command:** `npx web-push generate-vapid-keys`
  - **Action:** Run this command once in your terminal. It will output a public and a private key.

- [ ] **Task 2.3: Add VAPID Keys to Environment:** Add the generated keys and your contact email to the environment variables.

  - **File:** `.env.example`
  - **Action:** Add the following lines.

  ```env
  # Web Push VAPID Keys
  NEXT_PUBLIC_VAPID_PUBLIC_KEY=
  VAPID_PRIVATE_KEY=
  VAPID_MAILTO=mailto:your-email@example.com
  ```

  _Remember to populate the actual `.env` file with the generated keys._

- [ ] **Task 2.4: Create Reminder Dispatcher API Route:** Create the API route that will be triggered by a cron job to find and send due reminders.

  - **Command:** `mkdir -p src/app/api/cron/dispatch-reminders`
  - **File:** `src/app/api/cron/dispatch-reminders/route.ts`
  - **Action:** Create the file with the following complete `GET` handler.

  ```typescript
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
    const currentMinute = now.getUTCMinutes();
    const currentHour = now.getUTCHours();
    const currentTimeFormatted = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    const dueReminders = await prisma.userReminder.findMany({
      where: {
        isActive: true,
        reminderTime: currentTimeFormatted,
      },
      include: {
        user: { include: { pushSubscriptions: true } },
        protocol: true,
      },
    });

    const notifications = dueReminders.flatMap((reminder) => {
      const payload = JSON.stringify({
        title: `Protocolize Reminder: ${reminder.protocol.name}`,
        body: reminder.protocol.description.substring(0, 100) + '...', // Truncate for notification
      });

      return reminder.user.pushSubscriptions.map((sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: sub.keys as { p256dh: string; auth: string },
        };
        return webpush
          .sendNotification(pushSubscription, payload)
          .catch((error) => {
            console.error(
              `Failed to send notification to ${sub.endpoint.substring(0, 30)}. Error: ${error.message}`,
            );
            // If endpoint is expired or invalid, delete it
            if (error.statusCode === 410 || error.statusCode === 404) {
              return prisma.pushSubscription.delete({ where: { id: sub.id } });
            }
          });
      });
    });

    await Promise.all(notifications);

    return NextResponse.json({ success: true, sent: notifications.length });
  }
  ```

- [ ] **Task 2.5: Configure Vercel Cron Job for Reminders:**
  - **File:** `vercel.json`
  - **Action:** Add a new entry to the `crons` array. This one will run every 5 minutes.
  ```json
  {
    "crons": [
      {
        "path": "/api/cron/ingest-content",
        "schedule": "0 8 * * 1"
      },
      {
        "path": "/api/cron/dispatch-reminders",
        "schedule": "*/5 * * * *"
      }
    ]
  }
  ```
