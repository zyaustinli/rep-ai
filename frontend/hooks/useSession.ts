import { useState, useCallback } from "react";
import api from "@/lib/api";
import { Session } from "@/types";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/sessions/${sessionId}`);
      const data = response.data;
      setSession(data);
      return data;
    } catch (err: any) {
      setError(err.message || "Failed to fetch session");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(
    async (scenarioId: string, productId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.post('/api/sessions', {
          scenarioId,
          productId,
        });
        const data = response.data;
        setSession(data);
        return data;
      } catch (err: any) {
        setError(err.message || "Failed to create session");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/api/sessions/${sessionId}`);
      if (session?.id === sessionId) {
        setSession(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete session");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [session]);

  const analyzeSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/api/sessions/${sessionId}/analyze`);
      return response.data;
    } catch (err: any) {
      setError(err.message || "Failed to analyze session");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAnalysis = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/sessions/${sessionId}/analysis`);
      return response.data;
    } catch (err: any) {
      setError(err.message || "Failed to get analysis");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    session,
    loading,
    error,
    fetchSession,
    createSession,
    deleteSession,
    analyzeSession,
    getAnalysis,
  };
}
