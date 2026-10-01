import { API_BASE_URL } from "./config";
import type { Application } from "../store/applications";

// Credentials and CSRF tokens live only in memory, never in browser storage.
export type CareerDocument = { id: string; filename: string; kind: string; contentType: string; sizeBytes: number; createdAt: string };
export type CopilotReply = { message: string; mode: string; sources: { reference: string; id: string; title: string; excerpt: string }[]; warnings?: string[] };

export function createApplicationsApi(username = "", password = "") {
  const bytes = new TextEncoder().encode(`${username}:${password}`);
  const authorization = `Basic ${btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""))}`;
  let csrf: { headerName: string; token: string } | undefined;

  async function request<T>(path = "", method = "GET", body?: unknown, prefix = "/api/applications"): Promise<T> {
    const multipart = body instanceof FormData;
    const response = await fetch(`${API_BASE_URL}${prefix}${path}`, {
      method,
      credentials: "same-origin",
      headers: {
        ...(username ? { Authorization: authorization } : {}),
        ...(body === undefined || multipart ? {} : { "Content-Type": "application/json" }),
        ...(method !== "GET" && csrf ? { [csrf.headerName]: csrf.token } : {})
      },
      body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
      signal: AbortSignal.timeout(prefix === "/api/copilot" ? 180000 : 60000)
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error("Sign-in failed. Check your username and password.");
      if (response.status === 403) throw new Error("Your session expired. Disconnect and sign in again.");
      if (response.status === 400) throw new Error(prefix === "/api/documents" ? "Choose a non-empty PDF or UTF-8 text file and a document purpose." : "Check your application fields, dates, and URL (http or https).");
      if (response.status === 413) throw new Error("Choose a file smaller than 5 MB.");
      if (response.status === 409) throw new Error("Your workspace has reached its document limit (20).");
      if (response.status === 503) throw new Error("This service is unavailable. Check the server configuration and try again.");
      throw new Error("The application server could not complete the request. Please retry.");
    }
    return response.status === 204 ? undefined as T : await response.json() as T;
  }

  return {
    async connect() {
      csrf = await request<{ headerName: string; token: string }>("/csrf");
      return request<Application[]>();
    },
    list: () => request<Application[]>(),
    // Normal saves use the server's creation time. Imports retain browser history.
    save: (item: Application) => request<Application>(`/${item.id}`, "PUT", { ...item, createdAt: undefined }),
    remove: (id: string) => request<void>(`/${id}`, "DELETE"),
    importLocal: (items: Application[]) => request<Application[]>("/import", "POST", { items }),
    logout: () => request<void>("/logout", "POST", undefined, "/api/auth"),
    documents: () => request<CareerDocument[]>("", "GET", undefined, "/api/documents"),
    upload: (file: File, kind: string) => {
      const body = new FormData(); body.append("file", file); body.append("kind", kind);
      return request<CareerDocument>("", "POST", body, "/api/documents");
    },
    deleteDocument: (id: string) => request<void>(`/${id}`, "DELETE", undefined, "/api/documents"),
    download: (id: string) => request<{ url: string }>(`/${id}/download`, "GET", undefined, "/api/documents"),
    chat: (question: string) => request<CopilotReply>("/chat", "POST", { question }, "/api/copilot")
  };
}
