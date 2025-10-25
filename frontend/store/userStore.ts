import { create } from "zustand";
import { api, endpoints } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  experience_level: string | null;
  subscription_tier: string;
  preferences: any;
}

export interface UserStats {
  totalSessions: number;
  averageScore: number;
  lastSessionDate: string | null;
  practiceStreak: number;
  totalPracticeTime: number;
  mostImprovedSkill: string | null;
}

interface UserState {
  user: User | null;
  stats: UserStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  fetchUserStats: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  stats: null,
  loading: false,
  error: null,

  setUser: (user) => set({ user }),

  fetchUserStats: async () => {
    set({ loading: true, error: null });
    try {
      const stats = await api.get<UserStats>(endpoints.user.stats);
      set({ stats, loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch user stats",
        loading: false,
      });
    }
  },

  updateProfile: async (data) => {
    set({ loading: true, error: null });
    try {
      const updatedUser = await api.patch<User>(endpoints.user.me, data);
      set({ user: updatedUser, loading: false });
    } catch (error: any) {
      set({
        error: error.message || "Failed to update profile",
        loading: false,
      });
      throw error;
    }
  },

  clearUser: () =>
    set({ user: null, stats: null, loading: false, error: null }),
}));
