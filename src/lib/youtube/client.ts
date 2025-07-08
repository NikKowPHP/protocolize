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