import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTypewriter } from "../lib/useTypewriter";
import { useTasks } from "../store/tasks";
import { usePomodoro } from "../store/pomodoro";
import { useApplications } from "../store/applications";
import { Input } from "../ui/Input";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { CheckCircle2, Timer, BriefcaseBusiness, Sparkles } from "lucide-react";

export function HomePage() {
  const heroTitle = useTypewriter("Plan your day, focus deeper, and keep applications moving.", 22, 120);

  // Quick Start (real, not a demo)
  const tasks = useTasks();
  const pomo = usePomodoro();
  const apps = useApplications();

  const [quickTask, setQuickTask] = useState("");
  const [quickCompany, setQuickCompany] = useState("");
  const [quickRole, setQuickRole] = useState("");

  const stats = useMemo(() => {
    const remaining = tasks.tasks.filter((t) => !t.done).length;
    const totalApps = apps.items.length;
    return { remaining, totalApps };
  }, [tasks.tasks, apps.items]);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-2 md:items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200">
            <Sparkles size={14} />
            A calmer workspace for job search + deep work
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-3xl font-semibold tracking-tight md:text-5xl dark:text-slate-50"
          >
            {heroTitle}
            <span className="inline-block w-[10px] animate-pulse align-baseline text-blue-500">▍</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.45 }} className="text-slate-600 dark:text-slate-300">
            Career Compass helps you stay consistent: capture tasks, run focus sessions, and keep your applications moving, without juggling five different tools.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.45 }} className="flex flex-wrap gap-2">
            <Link to="/dashboard">
              <Button>Open dashboard</Button>
            </Link>
            <Link to="/resources">
              <Button variant="secondary">Browse resources</Button>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26, duration: 0.45 }} className="grid gap-3 pt-4 sm:grid-cols-2">
            <MiniFeature icon={<CheckCircle2 size={18} />} title="Task list" desc="Fast task capture, persists locally." />
            <MiniFeature icon={<Timer size={18} />} title="Pomodoro" desc="Focus/break timer with custom minutes." />
            <MiniFeature icon={<BriefcaseBusiness size={18} />} title="Applications" desc="Track status + next follow-up." />
            <MiniFeature icon={<Sparkles size={18} />} title="Tiny AI" desc="Optional assistant for bullets/interviews." />
          </motion.div>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200 dark:text-slate-200">Quick start</div>

            <div className="grid gap-3">
              <div className="rounded-2xl border bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <div className="text-xs text-slate-500 dark:text-slate-400">Today</div>
                <div className="pt-1 text-sm text-slate-700 dark:text-slate-200 dark:text-slate-200">
                  {stats.remaining} tasks left • {stats.totalApps} applications tracked
                </div>
              </div>

              <div className="rounded-2xl border p-4 dark:border-slate-800">
                <div className="text-sm font-medium dark:text-slate-200">Add a task</div>
                <div className="pt-2 flex gap-2">
                  <Input
                    value={quickTask}
                    onChange={(e) => setQuickTask(e.target.value)}
                    placeholder="e.g., Apply to 2 roles"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        tasks.addTask(quickTask);
                        setQuickTask("");
                      }
                    }}
                  />
                  <Button
                    onClick={() => {
                      tasks.addTask(quickTask);
                      setQuickTask("");
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border p-4 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium dark:text-slate-200">Start a focus session</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {pomo.mode === "focus" ? `${pomo.focusMinutes} min focus` : `${pomo.breakMinutes} min break`}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      if (!pomo.running) pomo.start();
                    }}
                  >
                    Focus now
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border p-4 dark:border-slate-800">
                <div className="text-sm font-medium dark:text-slate-200">Pin an application</div>
                <div className="pt-2 grid grid-cols-2 gap-2">
                  <Input value={quickCompany} onChange={(e) => setQuickCompany(e.target.value)} placeholder="Company" />
                  <Input value={quickRole} onChange={(e) => setQuickRole(e.target.value)} placeholder="Role" />
                </div>
                <div className="pt-2">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      if (!quickCompany.trim() || !quickRole.trim()) return;
                      apps.add({
                        company: quickCompany.trim(),
                        role: quickRole.trim(),
                        status: "Interested",
                        link: undefined,
                        nextFollowUp: undefined,
                        notes: undefined
                      });
                      setQuickCompany("");
                      setQuickRole("");
                    }}
                  >
                    Save
                  </Button>
                </div>
                <div className="pt-2 text-xs text-slate-500 dark:text-slate-400">
                  Built by Aaliyan Muhammad ,  ideas & feedback welcome.
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-sm font-medium dark:text-slate-100">About</div>
          <div className="pt-2 text-sm text-slate-600 dark:text-slate-300">
            A lightweight tool designed for people actively applying. Keep momentum with simple habits: today’s tasks, a focus timer, and a clean application log.
          </div>
        </Card>
        <Card>
          <div className="text-sm font-medium dark:text-slate-100">Stay on track</div>
          <div className="pt-2 text-sm text-slate-600 dark:text-slate-300">
            Track applications with one clear next step, add follow-up dates, and keep notes in one place so nothing slips.
          </div>
        </Card>
        <Card>
          <div className="text-sm font-medium dark:text-slate-100">Built with care</div>
          <div className="pt-2 text-sm text-slate-600 dark:text-slate-300">
            Career Compass is built by Aaliyan Muhammad, based on the real rhythm of applying and studying. If it helps you, I would love to hear what you'd add next.
          </div>
        </Card>
      </section>
    </div>
  );
}

function MiniFeature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border bg-white p-3 shadow-soft">
      <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-xl bg-slate-900 text-white">{icon}</div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-slate-500">{desc}</div>
      </div>
    </div>
  );
}
