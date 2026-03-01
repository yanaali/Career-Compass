import { create } from "zustand";
import { loadJSON, saveJSON } from "../lib/storage";

export type Status = "Interested" | "Applied" | "Interview" | "Offer" | "Rejected";

export type Application = {
  id: string;
  company: string;
  role: string;
  status: Status;
  link?: string;
  nextFollowUp?: string; // ISO date
  notes?: string;
  createdAt: string;
};

type State = {
  items: Application[];
  add: (a: Omit<Application, "id" | "createdAt">) => void;
  update: (id: string, patch: Partial<Application>) => void;
  remove: (id: string) => void;
};

const KEY = "cc_apps_v1";

export const useApplications = create<State>((set, get) => ({
  items: loadJSON<Application[]>(KEY, []),
  add: (a) => {
    const next = [{ ...a, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...get().items];
    saveJSON(KEY, next);
    set({ items: next });
  },
  update: (id, patch) => {
    const next = get().items.map((it) => (it.id === id ? { ...it, ...patch } : it));
    saveJSON(KEY, next);
    set({ items: next });
  },
  remove: (id) => {
    const next = get().items.filter((it) => it.id !== id);
    saveJSON(KEY, next);
    set({ items: next });
  }
}));
