import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Report } from '../types';

interface ReportState {
  currentReport: Report | null;
  history: Report[];
  setCurrentReport: (report: Report | null) => void;
  addToHistory: (report: Report) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  getReportById: (id: string) => Report | undefined;
}

export const useReportStore = create<ReportState>()(
  persist(
    (set, get) => ({
      currentReport: null,
      history: [],

      setCurrentReport: (report) => set({ currentReport: report }),

      addToHistory: (report) =>
        set((state) => {
          const exists = state.history.some((r) => r.id === report.id);
          if (exists) {
            return {
              history: state.history.map((r) =>
                r.id === report.id ? report : r
              ),
            };
          }
          return { history: [report, ...state.history].slice(0, 50) };
        }),

      removeFromHistory: (id) =>
        set((state) => ({
          history: state.history.filter((r) => r.id !== id),
          currentReport:
            state.currentReport?.id === id ? null : state.currentReport,
        })),

      clearHistory: () => set({ history: [], currentReport: null }),

      getReportById: (id) => get().history.find((r) => r.id === id),
    }),
    {
      name: 'cyberbrief-reports',
      partialize: (state) => ({
        history: state.history,
      }),
    }
  )
);
