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