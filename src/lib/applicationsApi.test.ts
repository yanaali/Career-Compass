import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createApplicationsApi } from "./applicationsApi";

const fetchMock = vi.fn();
const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock); });
afterEach(() => vi.unstubAllGlobals());

async function connected(username?: string, password?: string) {
  const api = createApplicationsApi(username, password);
  fetchMock.mockResolvedValueOnce(json({ headerName: "X-CSRF-TOKEN", token: "csrf" })).mockResolvedValueOnce(json([]));
  await api.connect();
  return api;
}

it("uses same-origin cookies without a Basic header for Cognito sessions", async () => {
  await connected();
  expect(fetchMock.mock.calls[0][1].credentials).toBe("same-origin");
  expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
});

it("uploads multipart documents with CSRF and lets the browser set the boundary", async () => {
  const api = await connected("compass", "test");
  fetchMock.mockResolvedValueOnce(json({ id: "doc" }));
  await api.upload(new File(["Java and AWS"], "resume.txt", { type: "text/plain" }), "resume");
  const [url, options] = fetchMock.mock.calls[2];
  expect(url).toBe("/api/documents");
  expect(options.body).toBeInstanceOf(FormData);
  expect(options.body.get("kind")).toBe("resume");
  expect(options.headers["Content-Type"]).toBeUndefined();
  expect(options.headers["X-CSRF-TOKEN"]).toBe("csrf");
});

it("sends only a question to the copilot, never an owner ID or untrusted source list", async () => {
  const api = await connected();
  fetchMock.mockResolvedValueOnce(json({ message: "Java [S1]", sources: [] }));
  await api.chat("Which experience fits?");
  const [url, options] = fetchMock.mock.calls[2];
  expect(url).toBe("/api/copilot/chat");
  expect(JSON.parse(options.body)).toEqual({ question: "Which experience fits?" });
  expect(options.headers["X-CSRF-TOKEN"]).toBe("csrf");
});

it("invalidates the server session with a CSRF-protected logout request", async () => {
  const api = await connected();
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
  await api.logout();
  expect(fetchMock.mock.calls[2][0]).toBe("/api/auth/logout");
  expect(fetchMock.mock.calls[2][1].headers["X-CSRF-TOKEN"]).toBe("csrf");
});
