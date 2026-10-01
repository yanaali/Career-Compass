import { create } from "zustand";
import { loadJSON, saveJSON } from "../lib/storage";
import { createApplicationsApi } from "../lib/applicationsApi";

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
  mode: "local" | "server";
  busy: boolean;
  error: string | null;
  authMode: "basic" | "oidc";
  sessionId: number;
  initializeAuth: () => Promise<void>;
  connect: (username?: string, password?: string) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  refresh: () => Promise<boolean>;
  importLocal: () => Promise<boolean>;
  add: (a: Omit<Application, "id" | "createdAt">) => Promise<boolean>;
  update: (id: string, patch: Partial<Application>) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
};

const KEY = "cc_apps_v1";

let api: ReturnType<typeof createApplicationsApi> | undefined;
let initialized = false;

export function serverApi() {
  if (!api) throw new Error("Connect to your server workspace on the dashboard first.");
  return api;
}

export const useApplications = create<State>((set, get) => {
  async function run(work: () => Promise<void>): Promise<boolean> {
    if (get().busy) return false;
    set({ busy: true, error: null });
    try {
      await work();
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to save applications. Please retry." });
      return false;
    } finally {
      set({ busy: false });
    }
  }

  function commit(items: Application[]) {
    if (get().mode === "local") saveJSON(KEY, items);
    set({ items });
  }

  async function save(item: Application) {
    const saved = api ? await api.save(item) : item;
    const exists = get().items.some((it) => it.id === saved.id);
    commit(exists ? get().items.map((it) => it.id === saved.id ? saved : it) : [saved, ...get().items]);
  }

  return {
    items: loadJSON<Application[]>(KEY, []), mode: "local", busy: false, error: null, authMode: "basic", sessionId: 0,
    initializeAuth: async () => {
      if (initialized) return;
      initialized = true;
      try {
        const response = await fetch("/api/auth/config", { signal: AbortSignal.timeout(5000) });
        if (!response.ok) return;
        const config = await response.json() as { mode: string };
        if (config.mode === "oidc") {
          set({ authMode: "oidc" });
          await get().connect();
        }
      } catch { /* The browser-only demo also works without the Java API. */ }
    },
    connect: (username, password) => run(async () => {
      const candidate = createApplicationsApi(username, password);
      const items = await candidate.connect();
      api = candidate;
      set({ items, mode: "server", sessionId: get().sessionId + 1 });
    }),
    disconnect: () => run(async () => {
      if (get().authMode === "oidc" && api) await api.logout();
      api = undefined;
      set({ items: loadJSON<Application[]>(KEY, []), mode: "local", error: null, sessionId: get().sessionId + 1 });
    }),
    refresh: () => run(async () => { if (api) set({ items: await api.list() }); }),
    importLocal: () => run(async () => {
      if (api) set({ items: await api.importLocal(loadJSON<Application[]>(KEY, [])) });
    }),
    add: (a) => run(() => save({ ...a, id: crypto.randomUUID(), createdAt: new Date().toISOString() })),
    update: (id, patch) => run(async () => {
      const item = get().items.find((it) => it.id === id);
      if (item) await save({ ...item, ...patch, id: item.id, createdAt: item.createdAt });
    }),
    remove: (id) => run(async () => {
      if (api) await api.remove(id);
      commit(get().items.filter((it) => it.id !== id));
    })
  };
});
