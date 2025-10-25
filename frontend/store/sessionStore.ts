import { create } from 'zustand';
import { Session, TranscriptEntry } from '@/types';

interface SessionState {
  currentSession: Session | null;
  isConnected: boolean;
  isAISpeaking: boolean;
  transcript: TranscriptEntry[];
  audioLevel: number;
  duration: number;

  // Actions
  setCurrentSession: (session: Session | null) => void;
  setIsConnected: (connected: boolean) => void;
  setIsAISpeaking: (speaking: boolean) => void;
  addTranscriptEntry: (entry: TranscriptEntry) => void;
  updateAudioLevel: (level: number) => void;
  incrementDuration: () => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentSession: null,
  isConnected: false,
  isAISpeaking: false,
  transcript: [],
  audioLevel: 0,
  duration: 0,

  setCurrentSession: (session) => set({ currentSession: session }),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setIsAISpeaking: (speaking) => set({ isAISpeaking: speaking }),
  addTranscriptEntry: (entry) => set((state) => ({
    transcript: [...state.transcript, entry]
  })),
  updateAudioLevel: (level) => set({ audioLevel: level }),
  incrementDuration: () => set((state) => ({ duration: state.duration + 1 })),
  resetSession: () => set({
    currentSession: null,
    isConnected: false,
    isAISpeaking: false,
    transcript: [],
    audioLevel: 0,
    duration: 0,
  }),
}));
