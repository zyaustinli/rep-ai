import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { SessionHint } from '@/types';

interface UseHintsReturn {
  hints: SessionHint[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to poll for RAG hints during a practice session
 *
 * Polls every 2 seconds when call is active (isConnected=true)
 * Accumulates all hints received during the session
 * Buffers hints while AI is speaking and displays them after AI finishes
 * Errors are logged but don't break the session
 */
export const useHints = (sessionId: string, isConnected: boolean, isSpeaking: boolean): UseHintsReturn => {
  const [hints, setHints] = useState<SessionHint[]>([]); // Displayed hints
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const bufferedHintsRef = useRef<SessionHint[]>([]); // Hints waiting to be displayed
  const previousSpeakingRef = useRef<boolean>(false); // Track previous speaking state
  const isSpeakingRef = useRef<boolean>(isSpeaking); // Always have current isSpeaking value
  const seenHintIdsRef = useRef<Set<string>>(new Set()); // Track all hint IDs we've seen

  // Keep isSpeakingRef in sync with isSpeaking prop
  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // Effect to flush buffer when AI stops speaking
  useEffect(() => {
    // Detect transition from speaking to not speaking
    if (previousSpeakingRef.current && !isSpeaking) {
      // AI just stopped speaking - flush buffered hints
      if (bufferedHintsRef.current.length > 0) {
        console.log(`[useHints] AI stopped speaking, displaying ${bufferedHintsRef.current.length} buffered hint(s)`);

        setHints(prev => [...prev, ...bufferedHintsRef.current]);

        // Mark buffered hints as seen
        bufferedHintsRef.current.forEach(h => seenHintIdsRef.current.add(h.id));

        // Clear buffer
        bufferedHintsRef.current = [];
      }
    }

    // Update previous speaking state
    previousSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    // Only poll when call is active
    if (!isConnected) {
      // Stop polling when call ends
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Function to fetch hints
    const fetchHints = async () => {
      try {
        setIsLoading(true);
        const response = await apiClient.sessions.getHints(sessionId);
        const newHints = response.data.hints || [];

        if (newHints.length > 0) {
          // Filter out hints we've already seen
          const uniqueNewHints = newHints.filter((h: SessionHint) => !seenHintIdsRef.current.has(h.id));

          if (uniqueNewHints.length > 0) {
            if (isSpeakingRef.current) {
              // AI is speaking - buffer the hints
              console.log(`[useHints] AI speaking, buffering ${uniqueNewHints.length} new hint(s)`);
              bufferedHintsRef.current = [...bufferedHintsRef.current, ...uniqueNewHints];
              // Note: Don't mark as seen yet - will mark when displayed
            } else {
              // AI not speaking - display immediately
              console.log(`[useHints] AI not speaking, displaying ${uniqueNewHints.length} new hint(s) immediately`);
              setHints(prev => [...prev, ...uniqueNewHints]);
              // Mark as seen
              uniqueNewHints.forEach((h: SessionHint) => seenHintIdsRef.current.add(h.id));
            }
          }
        }

        setError(null);
      } catch (err: any) {
        // Log error but don't break the session
        console.error('[useHints] Error fetching hints:', err);
        setError(err.message || 'Failed to fetch hints');
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchHints();

    // Start polling every 2 seconds
    pollIntervalRef.current = setInterval(fetchHints, 2000);

    // Cleanup on unmount or when call ends
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [sessionId, isConnected]);

  return {
    hints,
    isLoading,
    error
  };
};
