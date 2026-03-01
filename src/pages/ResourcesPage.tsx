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
  const [username, setUsername] = useState("vercel");
  const [q, setQ] = useState(username);

  const repos = useQuery({
    queryKey: ["githubRepos", q],
    queryFn: async (): Promise<Repo[]> => {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(q)}/repos?per_page=10&sort=updated`);
      if (!res.ok) throw new Error("GitHub request failed");
      return res.json();
    }
  });

  const quote = useQuery({
    queryKey: ["quote"],
    queryFn: async (): Promise<{ content: string; author: string }> => {
      // Public endpoint from quotable
      const res = await fetch("https://api.quotable.io/random?tags=technology|famous-quotes");
      if (!res.ok) throw new Error("Quote request failed");
      return res.json();
    }
  });

  const sorted = useMemo(() => {
    if (!repos.data) return [];
    return [...repos.data].sort((a, b) => b.stargazers_count - a.stargazers_count);
  }, [repos.data]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight dark:text-slate-50">Resources</h2>
        <p className="text-slate-600 dark:text-slate-300">Helpful extras: explore GitHub profiles and grab a daily nudge to keep moving.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-semibold dark:text-slate-100">GitHub explorer</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Fetches latest repos and sorts by stars.</div>
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="GitHub username (e.g., yanaali)" />
            <Button
              variant="secondary"
              onClick={() => setQ(username.trim() || "vercel")}
              disabled={repos.isFetching}
            >
              <Search size={16} />
              Search
            </Button>
          </div>

          <div className="pt-4 space-y-3">
            {repos.isLoading && <div className="text-sm text-slate-500 dark:text-slate-400">Loading repos…</div>}
            {repos.isError && <div className="text-sm text-red-600">Couldn’t load repos. Try another username.</div>}
            {sorted.map((r) => (
              <div key={r.id} className="rounded-2xl border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{r.full_name}</div>
                    <div className="pt-1 text-xs text-slate-500 dark:text-slate-400">
                      ⭐ {r.stargazers_count} • {r.language ?? "Unknown"} • Updated {new Date(r.updated_at).toLocaleDateString()}
                    </div>
                    {r.description && <div className="pt-2 text-sm text-slate-600 dark:text-slate-300">{r.description}</div>}
                  </div>
                  <a className="rounded-xl p-2 hover:bg-slate-50 dark:bg-slate-900/40" href={r.html_url} target="_blank" rel="noreferrer" aria-label="Open repo">
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="font-semibold dark:text-slate-100">Daily nudge</div>
          <div className="pt-2 text-sm text-slate-600 dark:text-slate-300">
            Sometimes you just need a tiny push before you apply to one more role.
          </div>
          <div className="pt-4">
            {quote.isLoading && <div className="text-sm text-slate-500 dark:text-slate-400">Loading quote…</div>}
            {quote.isError && <div className="text-sm text-red-600">Couldn’t load quote.</div>}
            {quote.data && (
              <div className="rounded-2xl border bg-slate-50 dark:bg-slate-900/40 p-4">
                <div className="text-sm">“{quote.data.content}”</div>
                <div className="pt-2 text-xs text-slate-500 dark:text-slate-400"> -  {quote.data.author}</div>
              </div>
            )}
          </div>

        </Card>
      </div>
    </div>
  );
}
