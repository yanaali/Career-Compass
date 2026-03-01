import React, { useEffect, useMemo, useState } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Textarea } from "../ui/Input";
import { useTasks } from "../store/tasks";
import { usePomodoro } from "../store/pomodoro";
import { useApplications, Status } from "../store/applications";
import { formatDate } from "../lib/format";
import { Trash2, Plus, Play, Pause, RotateCcw, CheckCircle2 } from "lucide-react";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight dark:text-slate-50">Dashboard</h2>
        <p className="text-slate-600 dark:text-slate-300">Your daily workspace for focus and applications.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TasksPanel />
        <PomodoroPanel />
        <ApplicationsPanel />
      </div>
    </div>
  );
}

function TasksPanel() {
  const { tasks, addTask, toggle, remove, clearDone } = useTasks();
  const [title, setTitle] = useState("");

  const remaining = tasks.filter((t) => !t.done).length;

  return (
    <Card className="lg:col-span-1">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold dark:text-slate-100">Tasks</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{remaining} remaining</div>
        </div>
        <Button variant="ghost" onClick={clearDone} disabled={!tasks.some((t) => t.done)}>
          <CheckCircle2 size={16} />
          Clear done
        </Button>
      </div>

      <div className="pt-3 flex gap-2">
        <Input
          placeholder="Add a task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addTask(title);
              setTitle("");
            }
          }}
        />
        <Button
          onClick={() => {
            addTask(title);
            setTitle("");
          }}
        >
          <Plus size={16} />
          Add
        </Button>
      </div>

      <div className="pt-4 space-y-2">
        {tasks.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400">No tasks yet. Add your top 3 for today.</div>}
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-2 rounded-2xl border p-3">
            <label className="flex flex-1 items-center gap-2">
              <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
              <div className="min-w-0">
                <div className={t.done ? "truncate text-sm line-through text-slate-400" : "truncate text-sm"}>
                  {t.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Created {formatDate(t.createdAt)}</div>
              </div>
            </label>
            <button className="rounded-xl p-2 hover:bg-slate-50 dark:bg-slate-900/40" onClick={() => remove(t.id)} aria-label="Delete task">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function PomodoroPanel() {
  const p = usePomodoro();
  const [focus, setFocus] = useState(p.focusMinutes);
  const [brk, setBrk] = useState(p.breakMinutes);

  useEffect(() => {
    const id = setInterval(() => p.tick(), 1000);
    return () => clearInterval(id);
  }, [p]);

  const mm = Math.floor(p.secondsLeft / 60)
    .toString()
    .padStart(2, "0");
  const ss = (p.secondsLeft % 60).toString().padStart(2, "0");

  return (
    <Card className="lg:col-span-1">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold dark:text-slate-100">Pomodoro</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Mode: {p.mode}</div>
        </div>
        <Button variant="ghost" onClick={p.switchMode}>
          Switch
        </Button>
      </div>

      <div className="pt-4 text-center">
        <div className="text-5xl font-semibold tabular-nums">
          {mm}:{ss}
        </div>
        <div className="pt-1 text-sm text-slate-600 dark:text-slate-300">
          {p.running ? "Running" : "Paused"} • {p.focusMinutes}/{p.breakMinutes} minutes
        </div>

        <div className="pt-4 flex justify-center gap-2">
          {!p.running ? (
            <Button onClick={p.start}>
              <Play size={16} />
              Start
            </Button>
          ) : (
            <Button variant="secondary" onClick={p.pause}>
              <Pause size={16} />
              Pause
            </Button>
          )}
          <Button variant="ghost" onClick={p.reset}>
            <RotateCcw size={16} />
            Reset
          </Button>
        </div>
      </div>

      <div className="pt-5 grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Focus minutes</div>
          <Input type="number" min={10} max={90} value={focus} onChange={(e) => setFocus(Number(e.target.value))} />
        </div>
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Break minutes</div>
          <Input type="number" min={3} max={30} value={brk} onChange={(e) => setBrk(Number(e.target.value))} />
        </div>
        <div className="col-span-2">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => p.setMinutes(clamp(focus, 10, 90), clamp(brk, 3, 30))}
          >
            Save timer settings
          </Button>
        </div>
      </div>

      <div className="pt-3 text-xs text-slate-500 dark:text-slate-400">
        Tip: Keep one clear next step per application (apply, follow up, or prep). That’s how momentum stays effortless.
      </div>
    </Card>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
}

function ApplicationsPanel() {
  const { items, add, update, remove } = useApplications();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<Status>("Interested");
  const [link, setLink] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");
  const [notes, setNotes] = useState("");

  const stats = useMemo(() => {
    const by: Record<Status, number> = { Interested: 0, Applied: 0, Interview: 0, Offer: 0, Rejected: 0 };
    for (const it of items) by[it.status] += 1;
    return by;
  }, [items]);

  return (
    <Card className="lg:col-span-1">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold dark:text-slate-100">Applications</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Applied {stats.Applied} • Interview {stats.Interview} • Offer {stats.Offer}
          </div>
        </div>
      </div>

      <div className="pt-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
          <Input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
          >
            {(["Interested", "Applied", "Interview", "Offer", "Rejected"] as Status[]).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Input type="date" value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)} />
        </div>
        <Input placeholder="Link (optional)" value={link} onChange={(e) => setLink(e.target.value)} />
        <Textarea placeholder="Notes (optional)" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button
          className="w-full"
          onClick={() => {
            if (!company.trim() || !role.trim()) return;
            add({
              company: company.trim(),
              role: role.trim(),
              status,
              link: link.trim() || undefined,
              nextFollowUp: nextFollowUp ? new Date(nextFollowUp).toISOString() : undefined,
              notes: notes.trim() || undefined
            });
            setCompany("");
            setRole("");
            setLink("");
            setNextFollowUp("");
            setNotes("");
            setStatus("Interested");
          }}
        >
          <Plus size={16} />
          Add application
        </Button>
      </div>

      <div className="pt-4 space-y-2">
        {items.length === 0 && <div className="text-sm text-slate-500 dark:text-slate-400">No entries yet. Add the next role you’ll apply to.</div>}
        {items.map((it) => (
          <div key={it.id} className="rounded-2xl border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{it.company}</div>
                <div className="truncate text-sm text-slate-600 dark:text-slate-300">{it.role}</div>
                <div className="pt-1 text-xs text-slate-500 dark:text-slate-400">
                  Status:{" "}
                  <select
                    className="rounded-lg border px-2 py-1"
                    value={it.status}
                    onChange={(e) => update(it.id, { status: e.target.value as Status })}
                  >
                    {(["Interested", "Applied", "Interview", "Offer", "Rejected"] as Status[]).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                {it.nextFollowUp && <div className="pt-1 text-xs text-slate-500 dark:text-slate-400">Follow-up: {formatDate(it.nextFollowUp)}</div>}
                {it.link && (
                  <a className="pt-1 block text-xs text-slate-700 hover:underline" href={it.link} target="_blank" rel="noreferrer">
                    Open link
                  </a>
                )}
                {it.notes && <div className="pt-2 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{it.notes}</div>}
              </div>

              <button className="rounded-xl p-2 hover:bg-slate-50 dark:bg-slate-900/40" onClick={() => remove(it.id)} aria-label="Delete application">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
