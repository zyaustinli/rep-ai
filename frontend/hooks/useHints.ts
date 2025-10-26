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
 * Errors are logged but don't break the session
 */
export const useHints = (sessionId: string, isConnected: boolean): UseHintsReturn => {
  const [hints, setHints] = useState<SessionHint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
          // Append new hints (oldest first, newest last)
          setHints(prev => {
            // Avoid duplicates by checking IDs
            const existingIds = new Set(prev.map(h => h.id));
            const uniqueNewHints = newHints.filter((h: SessionHint) => !existingIds.has(h.id));
            return [...prev, ...uniqueNewHints];
          });

          console.log(`[useHints] Received ${newHints.length} new hint(s)`);
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
