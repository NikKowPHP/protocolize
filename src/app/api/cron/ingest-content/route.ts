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
    const existingEpisode = await prisma.episode.findFirst({
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