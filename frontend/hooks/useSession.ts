import { useState, useCallback } from "react";
import { api, endpoints } from "@/lib/api";
import { Session } from "@/types";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Session>(endpoints.sessions.get(sessionId));
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
        const data = await api.post<Session>(endpoints.sessions.create, {
          scenarioId,
          productId,
        });
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
      await api.delete(endpoints.sessions.delete(sessionId));
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
      const data = await api.post(endpoints.sessions.analyze(sessionId));
      return data;
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
      const data = await api.get(endpoints.sessions.getAnalysis(sessionId));
      return data;
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
