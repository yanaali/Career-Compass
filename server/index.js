import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Tiny AI: chat endpoint. If OPENAI_API_KEY is missing, returns offline guidance.
app.post("/api/ai/chat", async (req, res) => {
  const { messages } = req.body ?? {};
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: "messages must be an array" });
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    // Offline fallback (still useful for demos)
    const last = messages[messages.length - 1]?.content ?? "";
    const reply = offlineReply(last);
    return res.json({ mode: "offline", message: reply });
  }

  try {
    const { OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: key });

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const system = {
      role: "system",
      content:
        "You are Career Compass, a concise assistant for interview prep and job search planning. " +
        "Ask 1-2 clarifying questions only if essential. Prefer actionable bullet points, checklists, and examples. " +
        "Avoid sensitive personal data. Keep responses under 220 words unless asked."
    };

    const completion = await client.chat.completions.create({
      model,
      messages: [system, ...messages],
      temperature: 0.4
    });

    const text = completion.choices?.[0]?.message?.content ?? "No response.";
    return res.json({ mode: "openai", message: text });
  } catch (err) {
    return res.status(500).json({ error: "AI request failed", details: String(err?.message || err) });
  }
});

function offlineReply(userText) {
  const t = String(userText || "").toLowerCase();
  if (t.includes("resume") || t.includes("bullet")) {
    return "Offline mode: Try this bullet formula  -  **Action + Tool + Outcome (metric)**. Example: “Built a React dashboard using TanStack Query; reduced load time by 35% via caching + pagination.” Paste a bullet and I’ll rewrite it.";
  }
  if (t.includes("interview") || t.includes("tell me about yourself")) {
    return "Offline mode: Use **Present → Past → Proof → Pull-forward**. (1) What you do now, (2) 1–2 relevant experiences, (3) a quick impact metric, (4) why this role. Want SWE intern, backend, or frontend version?";
  }
  if (t.includes("applications") || t.includes("follow up")) {
    return "Offline mode: Follow-up template: 1) context (role + date), 2) 1-sentence value (why fit), 3) clear ask (timeline/next step), 4) thanks. Add 1 specific detail from the conversation if you have it.";
  }
  return "Offline mode: I can help with interview answers, resume bullets, or a weekly job-search plan. Tell me your goal (internship/new grad), stack, and what you want to improve.";
}

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
