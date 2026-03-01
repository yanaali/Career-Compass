import { create } from "zustand";
import { loadJSON, saveJSON } from "../lib/storage";

export type Task = {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
};

type State = {
  tasks: Task[];
  addTask: (title: string) => void;
  toggle: (id: string) => void;
  remove: (id: string) => void;
  clearDone: () => void;
};

const KEY = "cc_tasks_v1";

export const useTasks = create<State>((set, get) => ({
  tasks: loadJSON<Task[]>(KEY, []),
  addTask: (title) => {
    const t = title.trim();
    if (!t) return;
    const next = [
      { id: crypto.randomUUID(), title: t, done: false, createdAt: new Date().toISOString() },
      ...get().tasks
    ];
    saveJSON(KEY, next);
    set({ tasks: next });
  },
  toggle: (id) => {
    const next = get().tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    saveJSON(KEY, next);
    set({ tasks: next });
  },
  remove: (id) => {
    const next = get().tasks.filter((t) => t.id !== id);
    saveJSON(KEY, next);
    set({ tasks: next });
  },
  clearDone: () => {
    const next = get().tasks.filter((t) => !t.done);
    saveJSON(KEY, next);
    set({ tasks: next });
  }
}));
