import { useState, useEffect, useCallback, useRef } from 'react';
import Vapi from '@vapi-ai/web';

export interface TranscriptEntry {
  timestamp: number;
  speaker: 'user' | 'ai';
  text: string;
  duration: number;
}

interface UseVapiOptions {
  publicKey?: string; // Optional, can fall back to env var
}

interface UseVapiReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;

  // Call state
  isSpeaking: boolean;
  transcript: TranscriptEntry[];
  callDuration: number;
  volumeLevel: number;
  callId: string | null;

  // Methods
  startCall: (assistantId: string) => Promise<void>;
  endCall: () => void;
  setMuted: (muted: boolean) => void;
  isMuted: boolean;

  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useVapi = (options: UseVapiOptions = {}): UseVapiReturn => {
  // Get public key from options or environment
  const publicKey = options.publicKey || process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

  console.log('[Vapi Debug] useVapi hook initialized');
  console.log('[Vapi Debug] Public key exists:', !!publicKey);

  // Vapi instance (persisted across re-renders)
  const vapiRef = useRef<Vapi | null>(null);

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [callId, setCallId] = useState<string | null>(null);
  const [isMuted, setIsMutedState] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timer for call duration
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Initialize Vapi instance
  useEffect(() => {
    if (!publicKey) {
      console.error('Vapi public key not provided');
      setError('Vapi configuration missing. Please check environment variables.');
      return;
    }

    if (!vapiRef.current) {
      try {
        vapiRef.current = new Vapi(publicKey);
        console.log('Vapi instance initialized');
      } catch (err) {
        console.error('Failed to initialize Vapi:', err);
        setError('Failed to initialize voice AI');
      }
    }

    return () => {
      // Cleanup on unmount
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch (err) {
          console.error('Error stopping Vapi on cleanup:', err);
        }
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [publicKey]);

  // Set up event listeners
  useEffect(() => {
    const vapi = vapiRef.current;
    if (!vapi) return;

    // Helper to ensure speaker is enabled and audio context is active
    const ensureSpeakerEnabled = () => {
      try {
        // Resume audio context if suspended (browser autoplay policy)
        if (typeof window !== 'undefined' && (window as any).AudioContext) {
          const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            // Check all audio contexts
            const audioContexts = (window as any).__vapiAudioContexts || [];
            audioContexts.forEach((ctx: any) => {
              if (ctx.state === 'suspended') {
                console.log('[Vapi Debug] Resuming suspended audio context');
                ctx.resume().catch((err: any) => console.error('Failed to resume audio context:', err));
              }
            });
          }
        }

        // Try to explicitly enable speaker output if available
        if (typeof (vapi as any).isSpeakerMuted === 'function') {
          const speakerMuted = (vapi as any).isSpeakerMuted();
          console.log('[Vapi Debug] Speaker muted status:', speakerMuted);

          if (speakerMuted && typeof (vapi as any).setSpeakerMuted === 'function') {
            (vapi as any).setSpeakerMuted(false);
            console.log('[Vapi Debug] Speaker unmuted');
          }
        }

        // Try accessing Vapi's internal audio elements
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach((audio, index) => {
          console.log(`[Vapi Debug] Audio element ${index}:`, {
            paused: audio.paused,
            muted: audio.muted,
            volume: audio.volume,
            src: audio.src?.substring(0, 50)
          });

          // Ensure audio elements are not muted and have volume
          if (audio.muted) {
            audio.muted = false;
            console.log(`[Vapi Debug] Unmuted audio element ${index}`);
          }
          if (audio.volume === 0) {
            audio.volume = 1.0;
            console.log(`[Vapi Debug] Set volume to 1.0 for audio element ${index}`);
          }
        });
      } catch (err) {
        console.error('Error checking/setting speaker state:', err);
      }
    };

    // Call started
    const handleCallStart = () => {
      console.log('[Vapi Debug] ===== CALL STARTED EVENT =====');
      console.log('[Vapi Debug] This should appear when call begins');
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);

      // Start duration timer
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setCallDuration(elapsed);
        }
      }, 1000);

      // Ensure speaker is enabled after call starts
      setTimeout(() => {
        ensureSpeakerEnabled();
      }, 500);
    };

    // Call ended
    const handleCallEnd = () => {
      console.log('Call ended');
      setIsConnected(false);
      setIsConnecting(false);
      setIsSpeaking(false);
      setCallId(null);

      // Stop duration timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    // AI started speaking
    const handleSpeechStart = () => {
      console.log('AI started speaking');
      setIsSpeaking(true);

      // Ensure speaker is enabled when AI speaks
      ensureSpeakerEnabled();
    };

    // AI stopped speaking
    const handleSpeechEnd = () => {
      console.log('AI stopped speaking');
      setIsSpeaking(false);
    };

    // Log all events for debugging
    const handleAllEvents = (event: string, data: any) => {
      console.log(`[Vapi Event] ${event}:`, data);
    };

    // Volume level (for visualizer)
    const handleVolumeLevel = (level: number) => {
      setVolumeLevel(level);
    };

    // Messages (transcripts, function calls, etc.)
    const handleMessage = (message: any) => {
      console.log('[Vapi Message Debug] Type:', message.type, 'Full message:', message);

      // Handle transcript messages
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        console.log('[Vapi Transcript] Role:', message.role, 'Text:', message.transcript);

        const entry: TranscriptEntry = {
          timestamp: Date.now(),
          speaker: message.role === 'user' ? 'user' : 'ai',
          text: message.transcript,
          duration: 0, // We'll calculate this based on time between messages
        };

        setTranscript((prev) => {
          // Calculate duration for previous entry if it's from the same speaker type
          const updated = [...prev];
          if (updated.length > 0) {
            const lastEntry = updated[updated.length - 1];
            lastEntry.duration = Math.floor(
              (entry.timestamp - lastEntry.timestamp) / 1000
            );
          }
          return [...updated, entry];
        });
      }

      // Store call ID if provided
      if (message.type === 'call-start' && message.callId) {
        console.log('[Vapi] Call ID set:', message.callId);
        setCallId(message.callId);
      }

      // Log conversation update messages (might contain audio info)
      if (message.type === 'conversation-update') {
        console.log('[Vapi Conversation Update]:', message);
      }
    };

    // Error handling
    const handleError = (error: any) => {
      console.error('Vapi error:', error);

      let errorMessage = 'An error occurred during the call';

      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Check for specific errors
      if (errorMessage.includes('microphone') || errorMessage.includes('permission')) {
        errorMessage = 'Microphone access denied. Please allow microphone permissions and try again.';
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }

      setError(errorMessage);
      setIsConnecting(false);
      setIsConnected(false);
    };

    // Register all event listeners
    vapi.on('call-start', handleCallStart);
    vapi.on('call-end', handleCallEnd);
    vapi.on('speech-start', handleSpeechStart);
    vapi.on('speech-end', handleSpeechEnd);
    vapi.on('volume-level', handleVolumeLevel);
    vapi.on('message', handleMessage);
    vapi.on('error', handleError);

    // Log all events for debugging audio issues
    const events = ['call-start', 'call-end', 'speech-start', 'speech-end', 'message', 'error', 'volume-level'];
    events.forEach(eventName => {
      vapi.on(eventName as any, (data: any) => {
        console.log(`[Vapi Event Debug] ${eventName}:`, data);
      });
    });

    // Cleanup event listeners
    return () => {
      vapi.off('call-start', handleCallStart);
      vapi.off('call-end', handleCallEnd);
      vapi.off('speech-start', handleSpeechStart);
      vapi.off('speech-end', handleSpeechEnd);
      vapi.off('volume-level', handleVolumeLevel);
      vapi.off('message', handleMessage);
      vapi.off('error', handleError);
    };
  }, []);

  // Start call
  const startCall = useCallback(async (assistantId: string) => {
    const vapi = vapiRef.current;

    console.log('[Vapi Debug] startCall called with assistantId:', assistantId);
    console.log('[Vapi Debug] Vapi instance exists:', !!vapi);

    if (!vapi) {
      console.error('[Vapi Debug] Vapi not initialized!');
      setError('Vapi not initialized');
      return;
    }

    if (!assistantId) {
      console.error('[Vapi Debug] No assistant ID provided!');
      setError('No assistant ID provided');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      setTranscript([]); // Clear previous transcript
      setCallDuration(0);

      console.log('[Vapi Debug] Starting call with assistant:', assistantId);
      console.log('[Vapi Debug] Vapi instance:', vapi);

      await vapi.start(assistantId);

      console.log('[Vapi Debug] vapi.start() completed');
    } catch (err: any) {
      console.error('[Vapi Debug] Failed to start call:', err);
      setError(err.message || 'Failed to start call');
      setIsConnecting(false);
    }
  }, []);

  // End call
  const endCall = useCallback(() => {
    const vapi = vapiRef.current;

    if (!vapi) {
      console.warn('Vapi not initialized');
      return;
    }

    try {
      console.log('Ending call');
      vapi.stop();
    } catch (err) {
      console.error('Error ending call:', err);
    }
  }, []);

  // Set muted state (microphone)
  const setMuted = useCallback((muted: boolean) => {
    const vapi = vapiRef.current;

    if (!vapi) {
      console.warn('Vapi not initialized');
      return;
    }

    try {
      vapi.setMuted(muted);
      setIsMutedState(muted);
      console.log('[Vapi Debug] Microphone muted:', muted);
    } catch (err) {
      console.error('Error setting mute state:', err);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isConnected,
    isConnecting,
    isSpeaking,
    transcript,
    callDuration,
    volumeLevel,
    callId,
    startCall,
    endCall,
    setMuted,
    isMuted,
    error,
    clearError,
  };
};
