import { create } from "zustand";
import { api, endpoints } from "@/lib/api";

export interface AnalyticsOverview {
  totalSessions: number;
  averageScore: number;
  scoreChange: number;
  practiceStreak: number;
  totalPracticeTime: number;
}

export interface ProgressDataPoint {
  date: string;
  avgScore: number;
  sessions: number;
}

export interface SkillBreakdown {
  discovery: number;
  productKnowledge: number;
  objectionHandling: number;
  rapportBuilding: number;
  valueCommunication: number;
  closing: number;
  communication: number;
}

export interface Recommendation {
  priority: "high" | "medium" | "low";
  category: string;
  suggestion: string;
  reasoning: string;
}

interface AnalyticsState {
  overview: AnalyticsOverview | null;
  progress: ProgressDataPoint[];
  skillBreakdown: SkillBreakdown | null;
  recommendations: Recommendation[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchOverview: () => Promise<void>;
  fetchProgress: (period?: string) => Promise<void>;
  fetchSkillBreakdown: () => Promise<void>;
  fetchRecommendations: () => Promise<void>;
  fetchAll: () => Promise<void>;
  clearAnalytics: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  overview: null,
  progress: [],
  skillBreakdown: null,
  recommendations: [],
  loading: false,
  error: null,

  fetchOverview: async () => {
    set({ loading: true, error: null });
    try {
      const overview = await api.get<AnalyticsOverview>(
        endpoints.analytics.overview
      );
      set({ overview, loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch overview",
        loading: false,
      });
    }
  },

  fetchProgress: async (period = "30d") => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<{ dataPoints: ProgressDataPoint[] }>(
        `${endpoints.analytics.progress}?period=${period}`
      );
      set({ progress: data.dataPoints, loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch progress",
        loading: false,
      });
    }
  },

  fetchSkillBreakdown: async () => {
    set({ loading: true, error: null });
    try {
      const skillBreakdown = await api.get<SkillBreakdown>(
        endpoints.analytics.skills
      );
      set({ skillBreakdown, loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch skill breakdown",
        loading: false,
      });
    }
  },

  fetchRecommendations: async () => {
    set({ loading: true, error: null });
    try {
      const data = await api.get<{ recommendations: Recommendation[] }>(
        endpoints.analytics.recommendations
      );
      set({ recommendations: data.recommendations, loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch recommendations",
        loading: false,
      });
    }
  },

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      await Promise.all([
        get().fetchOverview(),
        get().fetchProgress(),
        get().fetchSkillBreakdown(),
        get().fetchRecommendations(),
      ]);
      set({ loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch analytics",
        loading: false,
      });
    }
  },

  clearAnalytics: () =>
    set({
      overview: null,
      progress: [],
      skillBreakdown: null,
      recommendations: [],
      loading: false,
      error: null,
    }),
}));
