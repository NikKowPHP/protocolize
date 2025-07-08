import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import AuthErrorDisplay from './AuthErrorDisplay';
import { EvaluationResult } from '@/lib/ai/generation-service';

interface VoiceRecorderProps {
  questionId: string;
  questionContent: string;
  idealAnswer: string;
  onRecordingComplete: (result: {
    transcription: string;
    evaluation: EvaluationResult;
  }) => void;
  onTranscribing: (isTranscribing: boolean) => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  questionId,
  questionContent,
  idealAnswer,
  onRecordingComplete,
  onTranscribing,
}) => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  const [volume, setVolume] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);

  const timerRef = useRef<number | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const setupAudioContext = (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 2048;
    source.connect(analyser);
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
  };

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    analyser.getByteTimeDomainData(dataArray);
    
    if (ctx) {
      ctx.fillStyle = 'rgb(249, 250, 251)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgb(59, 130, 246)';
      ctx.beginPath();
      
      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        x += sliceWidth;
      }
      
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += (dataArray[i] - 128) * (dataArray[i] - 128);
      }
      const rms = Math.sqrt(sum / bufferLength);
      setVolume(rms);
    }
    
    animationRef.current = requestAnimationFrame(drawWaveform);
  };

  const startTimer = () => {
    const startTime = Date.now();
    timerRef.current = window.setInterval(() => {
      setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
  };

  const startRecording = async () => {
    if (!user) return;
    setRecordingTime(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setupAudioContext(stream);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      drawWaveform();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAndAssess(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access in your browser settings to continue.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      setIsRecording(false);
      onTranscribing(true);
      setRecordingTime(0);
    }
  };

  const transcribeAndAssess = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('question', questionContent);
      formData.append('idealAnswer', idealAnswer);
      formData.append('questionId', questionId);

      const response = await fetch('/api/voice-processing', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Assessment failed');
      }

      const result = await response.json();
      onRecordingComplete(result);
    } catch (err) {
      setError('Answer assessment failed. Please try recording your answer again.');
      console.error('Assessment error:', err);
    } finally {
      onTranscribing(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return (
    <div className="mt-6 space-y-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width="400"
          height="100"
          className="w-full h-20 bg-gray-50 rounded-lg mb-2 border"
        />
        <div className="flex items-center gap-4 absolute bottom-2 left-2">
          {isRecording && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-red-600">
                {String(Math.floor(recordingTime / 60)).padStart(2, '0')}:
                {String(recordingTime % 60).padStart(2, '0')}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-100"
                style={{ width: `${Math.min(volume * 10, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`w-full py-3 px-4 rounded-md text-white font-semibold ${
            isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>
      
      {error && (
        <div className="mt-4">
          <AuthErrorDisplay error={error} />
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;