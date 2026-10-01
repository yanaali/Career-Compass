import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Application } from "./applications";

const localItem: Application = {
  id: "00000000-0000-0000-0000-000000000001", company: "Local", role: "Engineer",
  status: "Applied", createdAt: "2020-01-01T00:00:00Z"
};
const serverItem: Application = { ...localItem, company: "Server", status: "Interview" };
let storage: Map<string, string>;
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.resetModules();
  storage = new Map([["cc_apps_v1", JSON.stringify([localItem])]]);
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value)
  });
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function connectedStore() {
  const { useApplications } = await import("./applications");
  fetchMock.mockResolvedValueOnce(response({ token: "csrf-token", headerName: "X-CSRF-TOKEN" }))
    .mockResolvedValueOnce(response([serverItem]));
  expect(await useApplications.getState().connect("compass", "secret")).toBe(true);
  return useApplications;
}

describe("application persistence", () => {
  it("creates server applications without sending createdAt and stores the server timestamp", async () => {
    const store = await connectedStore();
    const saved = { ...serverItem, id: "00000000-0000-0000-0000-000000000002", createdAt: "2026-10-01T01:18:06.742Z" };
    fetchMock.mockResolvedValueOnce(response(saved));
    expect(await store.getState().add({ company: saved.company, role: saved.role, status: saved.status })).toBe(true);
    const [url, options] = fetchMock.mock.calls[2];
    const body = JSON.parse(options.body);
    expect(url).toBe(`/api/applications/${body.id}`);
    expect(body.id).toBeTruthy();
    expect(body).not.toHaveProperty("createdAt");
    expect(store.getState().items[0]).toEqual(saved);
    expect(JSON.parse(storage.get("cc_apps_v1")!)).toEqual([localItem]);
  });

  it("omits createdAt on server updates and retains the timestamp returned by the server", async () => {
    const store = await connectedStore();
    fetchMock.mockResolvedValueOnce(response({ ...serverItem, status: "Offer" }));
    expect(await store.getState().update(serverItem.id, { status: "Offer", createdAt: "2099-01-01T00:00:00Z" })).toBe(true);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).not.toHaveProperty("createdAt");
    expect(store.getState().items[0].createdAt).toBe(serverItem.createdAt);
  });

  it("still generates creation timestamps for browser-only applications", async () => {
    const { useApplications } = await import("./applications");
    const before = Date.now();
    expect(await useApplications.getState().add({ company: "Local", role: "Engineer", status: "Applied" })).toBe(true);
    const saved = useApplications.getState().items[0];
    expect(Date.parse(saved.createdAt)).toBeGreaterThanOrEqual(before);
    expect(Date.parse(saved.createdAt)).toBeLessThanOrEqual(Date.now());
    expect(JSON.parse(storage.get("cc_apps_v1")!)[0]).toEqual(saved);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps browser mode working without a server", async () => {
    const { useApplications } = await import("./applications");
    expect(await useApplications.getState().update(localItem.id, { status: "Offer" })).toBe(true);
    expect(JSON.parse(storage.get("cc_apps_v1")!)[0].status).toBe("Offer");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("connects without modifying browser data and restores it on disconnect", async () => {
    const store = await connectedStore();
    expect(store.getState().items).toEqual([serverItem]);
    expect(JSON.parse(storage.get("cc_apps_v1")!)).toEqual([localItem]);
    expect([...storage.values()].join("")).not.toContain("secret");
    store.getState().disconnect();
    expect(store.getState().items).toEqual([localItem]);
    expect(store.getState().mode).toBe("local");
  });

  it("retains local data when sign-in fails", async () => {
    const { useApplications } = await import("./applications");
    fetchMock.mockResolvedValueOnce(response({}, 401));
    expect(await useApplications.getState().connect("compass", "wrong")).toBe(false);
    expect(useApplications.getState().items).toEqual([localItem]);
    expect(useApplications.getState().mode).toBe("local");
    expect(useApplications.getState().error).toContain("Sign-in failed");
  });

  it("does not show an unsuccessful save as successful or fall back to local storage", async () => {
    const store = await connectedStore();
    fetchMock.mockResolvedValueOnce(response({}, 500));
    expect(await store.getState().update(serverItem.id, { status: "Offer" })).toBe(false);
    expect(store.getState().items).toEqual([serverItem]);
    expect(JSON.parse(storage.get("cc_apps_v1")!)).toEqual([localItem]);
    expect(store.getState().busy).toBe(false);
    expect(store.getState().error).toBeTruthy();
  });

  it("imports a copy with authentication and CSRF protection", async () => {
    const store = await connectedStore();
    fetchMock.mockResolvedValueOnce(response([serverItem]));
    expect(await store.getState().importLocal()).toBe(true);
    const [url, options] = fetchMock.mock.calls[2];
    expect(url).toBe("/api/applications/import");
    expect(options.headers["X-CSRF-TOKEN"]).toBe("csrf-token");
    expect(options.headers.Authorization).toBe(`Basic ${btoa("compass:secret")}`);
    expect(JSON.parse(options.body)).toEqual({ items: [localItem] });
    expect(JSON.parse(storage.get("cc_apps_v1")!)).toEqual([localItem]);
  });

  it("keeps an application visible after a failed delete", async () => {
    const store = await connectedStore();
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    expect(await store.getState().remove(serverItem.id)).toBe(false);
    expect(store.getState().items).toEqual([serverItem]);
  });

  it("serializes mutations and prevents disconnect during a pending save", async () => {
    const store = await connectedStore();
    let resolve!: (value: Response) => void;
    fetchMock.mockReturnValueOnce(new Promise<Response>((done) => { resolve = done; }));
    const pending = store.getState().update(serverItem.id, { status: "Offer" });
    store.getState().disconnect();
    expect(store.getState().mode).toBe("server");
    expect(await store.getState().remove(serverItem.id)).toBe(false);
    resolve(response({ ...serverItem, status: "Offer" }));
    expect(await pending).toBe(true);
    expect(store.getState().items[0].status).toBe("Offer");
  });
});
