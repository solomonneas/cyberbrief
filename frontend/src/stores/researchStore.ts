import { create } from 'zustand';
import type { ResearchBundle, RateLimitState } from '../types';

export type ResearchPhase =
  | 'idle'
  | 'searching'
  | 'synthesizing'
  | 'extracting'
  | 'generating'
  | 'complete'
  | 'error';

interface ResearchState {
  phase: ResearchPhase;
  progress: number;
  progressMessage: string;
  error: string | null;
  currentBundle: ResearchBundle | null;
  rateLimit: RateLimitState;

  setPhase: (phase: ResearchPhase, message?: string) => void;
  setProgress: (progress: number, message?: string) => void;
  setError: (error: string | null) => void;
  setCurrentBundle: (bundle: ResearchBundle | null) => void;
  decrementRateLimit: () => void;
  resetRateLimit: () => void;
  reset: () => void;
}

const getTodayResetTime = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
};

const INITIAL_RATE_LIMIT: RateLimitState = {
  remaining: 10,
  limit: 10,
  resetAt: getTodayResetTime(),
};

export const useResearchStore = create<ResearchState>()((set) => ({
  phase: 'idle',
  progress: 0,
  progressMessage: '',
  error: null,
  currentBundle: null,
  rateLimit: INITIAL_RATE_LIMIT,

  setPhase: (phase, message) => {
    const progressMap: Record<ResearchPhase, number> = {
      idle: 0,
      searching: 20,
      synthesizing: 50,
      extracting: 75,
      generating: 90,
      complete: 100,
      error: 0,
    };
    set({
      phase,
      progress: progressMap[phase],
      progressMessage: message ?? phase,
      error: phase === 'error' ? undefined : null,
    });
  },

  setProgress: (progress, message) =>
    set((state) => ({
      progress,
      progressMessage: message ?? state.progressMessage,
    })),

  setError: (error) =>
    set({
      error,
      phase: error ? 'error' : 'idle',
    }),

  setCurrentBundle: (bundle) => set({ currentBundle: bundle }),

  decrementRateLimit: () =>
    set((state) => ({
      rateLimit: {
        ...state.rateLimit,
        remaining: Math.max(0, state.rateLimit.remaining - 1),
      },
    })),

  resetRateLimit: () =>
    set({
      rateLimit: {
        ...INITIAL_RATE_LIMIT,
        resetAt: getTodayResetTime(),
      },
    }),

  reset: () =>
    set({
      phase: 'idle',
      progress: 0,
      progressMessage: '',
      error: null,
      currentBundle: null,
    }),
}));
