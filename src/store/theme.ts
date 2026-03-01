import { create } from "zustand";
import { loadJSON, saveJSON } from "../lib/storage";

type Theme = "light" | "dark";

type State = {
  theme: Theme;
  toggle: () => void;
  set: (t: Theme) => void;
};

const KEY = "cc_theme_v1";

function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export const useTheme = create<State>((set, get) => ({
  theme: loadJSON<Theme>(KEY, "light"),
  toggle: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    saveJSON(KEY, next);
    set({ theme: next });
    applyTheme(next);
  },
  set: (t) => {
    saveJSON(KEY, t);
    set({ theme: t });
    applyTheme(t);
  }
}));

// Call once on app boot
export function initTheme() {
  try {
    const t = loadJSON<Theme>(KEY, "light");
    applyTheme(t);
  } catch {
    // ignore
  }
}
