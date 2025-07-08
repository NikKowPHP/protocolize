import { SpeechClient } from '@google-cloud/speech';
import type { protos } from '@google-cloud/speech';
import type { SupabaseClient } from '@supabase/supabase-js';
import { rateLimiter } from './rateLimiter';

interface StreamingRecognizeStream extends NodeJS.ReadableStream {
  on(event: 'data', listener: (data: protos.google.cloud.speech.v1.StreamingRecognizeResponse) => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
  on(event: 'end', listener: () => void): this;
}

export class TranscriptionError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

export interface TranscriptionService {
  processTranscription: (supabase: SupabaseClient, filePath: string) => Promise<string>;
  streamTranscription: () => Promise<{
    stream: StreamingRecognizeStream;
    destroy: () => void;
  }>;
}

// Rate limit to 60 requests per minute
// Create rate limiter instance for transcription service
const getTranscriptionLimiter = rateLimiter({
  windowMs: 60_000, // 1 minute window
  max: 60 // max 60 requests per window
});

// Google Cloud Speech-to-Text configuration
export const createTranscriptionService = (): TranscriptionService => {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new TranscriptionError(
      'Google Cloud credentials not configured',
      'AUTH_MISSING'
    );
  }

  const speechClient = new SpeechClient({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
  });

  /**
   * Configuration for speech recognition
   */
  // Main recognition configuration
  const recognitionConfig: protos.google.cloud.speech.v1.IRecognitionConfig = {
    encoding: 'WEBM_OPUS',
    sampleRateHertz: 48000,
    languageCode: 'en-US',
    enableAutomaticPunctuation: true,
    model: 'default',
    useEnhanced: true,
    speechContexts: [{
      phrases: ['Laravel', 'PHP', 'JavaScript', 'TypeScript', 'React']
    }],
    metadata: {
      interactionType: 'DICTATION',
      microphoneDistance: 'NEARFIELD',
      recordingDeviceType: 'SMARTPHONE'
    }
  };

  const processTranscription = async (supabase: SupabaseClient, filePath: string): Promise<string> => {
    const limitCheck = getTranscriptionLimiter('transcription-service');
    if (!limitCheck.allowed) {
      throw new TranscriptionError(
        `Transcription rate limit exceeded. Try again in ${limitCheck.retryAfter} seconds`,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    
    try {
      if (!filePath || !filePath.includes('/')) {
        throw new TranscriptionError('Invalid file path format', 'INVALID_INPUT');
      }

      const { data, error } = await supabase.storage
        .from('recordings')
        .download(filePath);

      if (error || !data) {
        throw new TranscriptionError(
          `Failed to fetch audio file: ${error?.message || 'No data returned'}`,
          'STORAGE_ERROR'
        );
      }

      const fileSize = data.size;
      if (fileSize > 10 * 1024 * 1024) {
        throw new TranscriptionError('Audio file too large (max 10MB)', 'FILE_TOO_LARGE');
      }

      const audioBytes = await data.arrayBuffer();
      const audioContent = Buffer.from(audioBytes);

      const [operation] = await speechClient.longRunningRecognize({
        audio: { content: audioContent.toString('base64') },
        config: recognitionConfig
      });

      const [response] = await operation.promise();

      const transcription = response.results
        ?.map((result: protos.google.cloud.speech.v1.ISpeechRecognitionResult) => result.alternatives?.[0]?.transcript)
        .filter(Boolean)
        .join('\n');

      if (!transcription) {
        throw new TranscriptionError(
          'No transcription results found - possibly inaudible audio',
          'NO_RESULTS'
        );
      }

      return transcription;
    } catch (error) {
      console.error('Transcription error:', error);
      if (error instanceof TranscriptionError) {
        throw error;
      }
      throw new TranscriptionError(
        `Transcription failed: ${(error as Error).message}`,
        'UNKNOWN_ERROR'
      );
    }
  };

  const streamTranscription = async () => {
    const limitCheck = getTranscriptionLimiter('transcription-service');
    if (!limitCheck.allowed) {
      throw new Error(`Transcription rate limit exceeded. Try again in ${limitCheck.retryAfter} seconds`);
    }
    
    try {
      const streamingConfig: protos.google.cloud.speech.v1.IStreamingRecognitionConfig = {
        config: {
          ...recognitionConfig,
          model: 'video',
          enableWordConfidence: true,
        },
        interimResults: true,
        singleUtterance: false
      };

      const stream = speechClient
        .streamingRecognize(streamingConfig)
        .on('error', (err: Error) => {
          console.error('Streaming error:', err);
        });

      return {
        stream,
        destroy: () => {
          stream.destroy();
          speechClient.close();
        },
      };
    } catch (error) {
      console.error('Stream setup error:', error);
      throw new TranscriptionError(
        `Failed to start streaming: ${(error as Error).message}`,
        'STREAM_ERROR'
      );
    }
  };

  return {
    processTranscription,
    streamTranscription,
  };
};

export const transcriptionService = createTranscriptionService();