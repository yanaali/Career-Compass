import React, { useMemo, useState } from "react";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { apiPost } from "../lib/api";
import { serverApi, useApplications } from "../store/applications";
import type { CopilotReply } from "../lib/applicationsApi";

type Msg = { role: "user" | "assistant"; content: string; sources?: CopilotReply["sources"]; warnings?: string[] };

export function AiAssistantButton() {
  const sessionId = useApplications((state) => state.sessionId);
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} className="whitespace-nowrap">
        <MessageSquare size={16} />
        Career copilot
      </Button>
      {open && <AiAssistantModal key={sessionId} onClose={() => setOpen(false)} />}
    </>
  );
}

function AiAssistantModal({ onClose }: { onClose: () => void }) {
  const { mode, authMode } = useApplications();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: mode === "server"
        ? "Ask about your saved applications, resume, job descriptions, or projects. I'll show source excerpts with my answer."
        : "I can help with resume bullets and interview preparation. Connect to your server workspace on the dashboard to ask about your saved career information."
    }
  ]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const quickPrompts = useMemo(
    () => [
      "Rewrite this resume bullet to be impact-focused:",
      "Give me a 60-second 'tell me about yourself' for SWE internships.",
      "Generate 5 behavioral questions + STAR outline for this role:"
    ],
    []
  );

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    const next = [...messages, { role: "user", content: trimmed } as Msg];
    setMessages(next);
    setText("");
    setBusy(true);

    try {
      if (mode === "server") {
        const res = await serverApi().chat(trimmed);
        setMessages([...next, { role: "assistant", content: res.message, sources: res.sources, warnings: res.warnings }]);
      } else {
        if (authMode === "oidc") throw new Error("Sign in on the dashboard to use your career copilot.");
        const res = await apiPost<{ message: string; mode: string }>("/api/ai/chat", {
          messages: next.map(({ role, content }) => ({ role, content }))
        });
        setMessages([...next, { role: "assistant", content: res.message }]);
      }
    } catch (e) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "The assistant is unavailable. Please try again."
        }
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/30 p-4 md:place-items-center">
      <div className="w-full max-w-2xl">
        <Card className="p-0 overflow-hidden !bg-white dark:!bg-slate-900">
          <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-900 text-white dark:bg-blue-500">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="font-semibold">Career Copilot</div>
                <div className="text-xs text-slate-500">{mode === "server" ? "Answers from your saved applications and documents" : "Connect on the dashboard to use your saved career information"}</div>
              </div>
            </div>
            <button className="rounded-xl p-2 hover:bg-slate-50" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-auto px-4 py-3">
            {mode === "server" && <p className="pb-3 text-xs text-slate-500">Try “Which of my experiences match this role?” or “Find applications mentioning AWS.” The first answer may take longer while new records are indexed. Each question is independent.</p>}
            <div className="flex flex-wrap gap-2 pb-3">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  className="rounded-full border px-3 py-1 text-xs hover:bg-slate-50"
                  onClick={() => setText(p)}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] rounded-2xl bg-slate-900 px-3 py-2 text-sm text-white"
                        : "max-w-[85%] rounded-2xl bg-slate-100 dark:bg-slate-900/60 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                    }
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    {m.sources?.map((source) => <details key={source.reference} className="mt-2 rounded-lg border p-2 text-xs">
                      <summary className="cursor-pointer">[{source.reference}] {source.title}</summary>
                      <p className="pt-1 whitespace-pre-wrap">{source.excerpt}</p>
                    </details>)}
                    {m.warnings?.map((warning, index) => <p key={index} className="mt-2 text-xs">{warning}</p>)}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="text-xs text-slate-500">
                  Thinking…
                </div>
              )}
            </div>
          </div>

          <div className="border-t p-3 dark:border-slate-800">
            <div className="flex gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ask something…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
              />
              <Button onClick={send} disabled={busy}>
                <Send size={16} />
                Send
              </Button>
            </div>
            <div className="pt-2 text-xs text-slate-500">
              {mode === "server" ? "Questions, indexed career text, and relevant excerpts are processed by the AI provider. Check source excerpts before using an answer." : "If AI is enabled, messages are sent to the AI provider."}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
