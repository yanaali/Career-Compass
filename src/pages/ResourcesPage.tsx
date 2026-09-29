import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { ExternalLink, Search } from "lucide-react";

type Repo = {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  updated_at: string;
};

export function ResourcesPage() {
  const [username, setUsername] = useState("");
  const [q, setQ] = useState("");

  const repos = useQuery({
    queryKey: ["githubRepos", q],
    enabled: q.trim() !== "",
    queryFn: async (): Promise<Repo[]> => {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(q)}/repos?per_page=10&sort=updated`);
      if (!res.ok) throw new Error("GitHub request failed");
      return res.json();
    }
  });

  const quote = useQuery({
    queryKey: ["quote"],
    queryFn: async (): Promise<{ content: string; author: string }> => {
      // Use local quotes to avoid API rate limits
      const quotes = [
        { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
        { content: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
        { content: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
        { content: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
        { content: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
        { content: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
        { content: "Do not watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
        { content: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
        { content: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
        { content: "Success is walking from failure to failure with no loss of enthusiasm.", author: "Winston Churchill" },
        { content: "Don't wait for opportunity. Create it.", author: "Unknown" },
        { content: "The best preparation for tomorrow is doing your best today.", author: "H. Jackson Brown Jr." }
      ];
      return quotes[Math.floor(Math.random() * quotes.length)];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10
  });

  const sorted = useMemo(() => {
    if (!repos.data) return [];
    return [...repos.data].sort((a, b) => b.stargazers_count - a.stargazers_count);
  }, [repos.data]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-amber-900 dark:text-amber-100">Resources</h2>
        <p className="text-slate-600 dark:text-slate-300">Helpful extras: explore GitHub profiles and grab a daily nudge to keep moving.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-amber-900 dark:text-amber-100">GitHub explorer</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Fetches latest repos and sorts by stars.</div>
            </div>
            <span className="text-2xl">🔍</span>
          </div>

          <div className="pt-3 flex gap-2">
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="GitHub username (e.g., yanaali)" />
            <Button
              variant="secondary"
              onClick={() => setQ(username.trim())}
              disabled={repos.isFetching || !username.trim()}
            >
              <Search size={16} />
              Search
            </Button>
          </div>

          <div className="pt-4 space-y-3">
            {q && repos.isLoading && <div className="text-sm text-slate-500 dark:text-slate-400">Loading repos…</div>}
            {q && repos.isError && <div className="text-sm text-red-600">Couldn't load repos. Try another username.</div>}
            {!q && <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/30 p-3 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300">Type a GitHub username to explore recent repos.</div>}
            {q && sorted.map((r) => (
              <div key={r.id} className="rounded-2xl border border-amber-200 bg-amber-50/40 dark:border-slate-700 dark:bg-slate-800/60 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-amber-900 dark:text-amber-100">{r.full_name}</div>
                    <div className="pt-1 text-xs text-slate-500 dark:text-slate-300">
                      ⭐ {r.stargazers_count} • {r.language ?? "Unknown"} • Updated {new Date(r.updated_at).toLocaleDateString()}
                    </div>
                    {r.description && <div className="pt-2 text-sm text-slate-600 dark:text-slate-300">{r.description}</div>}
                  </div>
                  <a className="rounded-xl p-2 hover:bg-amber-100 dark:hover:bg-slate-700" href={r.html_url} target="_blank" rel="noreferrer" aria-label="Open repo">
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-amber-900 dark:text-amber-100">Daily nudge</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Sometimes you just need a tiny push before you apply to one more role.</div>
            </div>
            <span className="text-2xl">💫</span>
          </div>
          <div className="pt-4">
            {quote.isPending && !quote.data && <div className="text-sm text-slate-500 dark:text-slate-400">Loading quote…</div>}
            {quote.isError && <div className="text-sm text-red-600">Couldn’t load quote.</div>}
            {quote.data && (
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-sage-50 dark:from-slate-800 dark:to-slate-900 dark:border-slate-600 dark:bg-slate-800/95 p-4">
                <div className="text-sm text-amber-900 dark:text-amber-50 italic">"{quote.data.content}"</div>
                <div className="pt-2 text-xs text-slate-500 dark:text-slate-300">— {quote.data.author}</div>
              </div>
            )}
          </div>

        </Card>
      </div>
    </div>
  );
}
