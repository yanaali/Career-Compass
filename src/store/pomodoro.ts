import { create } from "zustand";
import { loadJSON, saveJSON } from "../lib/storage";

type Mode = "focus" | "break";

type State = {
  mode: Mode;
  secondsLeft: number;
  running: boolean;
  focusMinutes: number;
  breakMinutes: number;
  setMinutes: (focus: number, brk: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  switchMode: () => void;
};

const KEY = "cc_pomodoro_v1";

type Persist = Pick<State, "mode" | "secondsLeft" | "running" | "focusMinutes" | "breakMinutes">;

export const usePomodoro = create<State>((set, get) => ({
  ...loadJSON<Persist>(KEY, {
    mode: "focus",
    secondsLeft: 25 * 60,
    running: false,
    focusMinutes: 25,
    breakMinutes: 5
  }),
  setMinutes: (focus, brk) => {
    const next: Persist = { ...get(), focusMinutes: focus, breakMinutes: brk, running: false, mode: "focus", secondsLeft: focus * 60 };
    saveJSON(KEY, next);
    set(next);
  },
  start: () => {
    const next: Persist = { ...get(), running: true };
    saveJSON(KEY, next);
    set(next);
  },
  pause: () => {
    const next: Persist = { ...get(), running: false };
    saveJSON(KEY, next);
    set(next);
  },
  reset: () => {
    const focus = get().focusMinutes;
    const next: Persist = { ...get(), mode: "focus", secondsLeft: focus * 60, running: false };
    saveJSON(KEY, next);
    set(next);
  },
  tick: () => {
    const s = get().secondsLeft;
    if (!get().running) return;
    if (s <= 0) {
      get().switchMode();
      return;
    }
    const next: Persist = { ...get(), secondsLeft: s - 1 };
    saveJSON(KEY, next);
    set(next);
  },
  switchMode: () => {
    const mode = get().mode === "focus" ? "break" : "focus";
    const mins = mode === "focus" ? get().focusMinutes : get().breakMinutes;
    const next: Persist = { ...get(), mode, secondsLeft: mins * 60, running: false };
    saveJSON(KEY, next);
    set(next);
  }
}));
