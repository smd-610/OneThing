import { create } from "zustand";
import type { ViewMode } from "@/types/todo";
import dayjs from "dayjs";

type Theme = "light" | "dark";

interface UiState {
  viewMode: ViewMode;
  selectedDate: string;
  theme: Theme;
  setViewMode: (mode: ViewMode) => void;
  setSelectedDate: (date: string) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("onething-theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  localStorage.setItem("onething-theme", theme);
}

export const useUiStore = create<UiState>((set) => ({
  viewMode: "day",
  selectedDate: dayjs().format("YYYY-MM-DD"),
  theme: getInitialTheme(),

  setViewMode: (mode) => set({ viewMode: mode }),

  setSelectedDate: (date) => set({ selectedDate: date }),

  toggleTheme: () => {
    set((state) => {
      const next = state.theme === "light" ? "dark" : "light";
      applyTheme(next);
      return { theme: next };
    });
  },

  initTheme: () => {
    const theme = getInitialTheme();
    applyTheme(theme);
    set({ theme });
  },
}));
