import React, { useMemo, useState } from "react";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import { Card } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { apiPost } from "../lib/api";

type Msg = { role: "user" | "assistant"; content: string };

export function AiAssistantButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} className="whitespace-nowrap">
        <MessageSquare size={16} />
        AI helper
      </Button>
      {open && <AiAssistantModal onClose={() => setOpen(false)} />}
    </>
  );
}

function AiAssistantModal({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Paste a resume bullet, interview prompt, or job description. I’ll help you refine it. (Tip: try “rewrite this bullet with a metric”.)"
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
      const res = await apiPost<{ message: string; mode: string }>("/api/ai/chat", { messages: next });
      setMessages([...next, { role: "assistant", content: res.message }]);
    } catch (e) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            "Couldn’t reach the AI endpoint. If you want AI: run `npm run dev` (starts server too) and set OPENAI_API_KEY in `.env`."
        }
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/30 p-4 md:place-items-center">
      <div className="w-full max-w-2xl">
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-2xl bg-slate-900 text-white dark:bg-blue-500">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="font-semibold">Career Compass Assistant</div>
                <div className="text-xs text-slate-500">Tiny AI add-on (optional)</div>
              </div>
            </div>
            <button className="rounded-xl p-2 hover:bg-slate-50" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-auto px-4 py-3">
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
                        : "max-w-[85%] rounded-2xl bg-slate-100 dark:bg-slate-900/60 px-3 py-2 text-sm text-slate-900"
                    }
                  >
                    {m.content}
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
              Privacy note: If you enable OpenAI, messages are sent to your local server which forwards them to OpenAI.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
