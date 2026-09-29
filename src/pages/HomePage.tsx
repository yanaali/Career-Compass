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
      <div className="text-center mb-6 p-6 rounded-3xl bg-gradient-to-r from-amber-100/30 via-sage-100/30 to-amber-100/30 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 border border-amber-200 dark:border-slate-700">
        <div className="mb-3 flex justify-center">
          <div className="relative grid h-16 w-16 place-items-center rounded-[1.5rem] bg-gradient-to-br from-amber-500 via-orange-400 to-sage-500 shadow-warm motion-safe:animate-[bounce_1.2s_ease-in-out_infinite] dark:from-amber-400 dark:via-orange-300 dark:to-sage-400 md:h-20 md:w-20">
            <div className="absolute inset-1 rounded-full border border-white/35" />
            <div className="absolute h-2.5 w-[2px] origin-bottom rounded-full bg-white/90 rotate-45" />
            <div className="absolute h-2.5 w-[2px] origin-bottom rounded-full bg-white/90 -rotate-45" />
            <div className="absolute h-2 w-2 rounded-full bg-white/90" />
            <div className="flex items-center justify-center gap-[3px] font-black tracking-[-0.18em] text-[1.55rem] leading-none text-white md:text-[1.8rem]">
              <span className="inline-block -rotate-12">C</span>
              <span className="inline-block rotate-12">C</span>
            </div>
          </div>
        </div>
        <div className="mt-1 text-lg font-semibold tracking-[-0.06em] text-amber-900 dark:text-amber-100 md:text-2xl">Career Compass</div>
        <p className="mt-2 text-center text-base font-medium tracking-tight text-amber-900/90 dark:text-amber-200">Your career development companion</p>
      </div>

      <section className="grid gap-6 md:grid-cols-2 md:items-center">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800 dark:border-slate-600 dark:bg-slate-800/95 dark:text-amber-100">
            <Sparkles size={14} className="text-amber-600 dark:text-amber-400" />
            A calmer workspace for job search + deep work
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="text-3xl font-semibold tracking-tight md:text-5xl text-slate-900 dark:text-slate-50"
          >
            {heroTitle}
            <span className="inline-block w-[10px] animate-pulse align-baseline text-amber-500 dark:text-amber-400">▍</span>
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

        <Card className="p-6 border-amber-100 dark:border-slate-700">
          <div className="space-y-4">
            <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">Quick start</div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-4 dark:border-slate-600 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 dark:shadow-inner">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-amber-700 dark:text-amber-300">Today</div>
                    <div className="pt-1 text-sm font-semibold text-amber-900 dark:text-slate-50">
                      {stats.remaining} tasks left • {stats.totalApps} applications tracked
                    </div>
                  </div>
                  <span className="text-2xl">📊</span>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 dark:border-slate-700 dark:bg-slate-800/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-amber-900 dark:text-amber-100">Add a task</div>
                    <div className="text-xs text-slate-500 dark:text-slate-300 pt-1">e.g., Apply to 2 roles</div>
                  </div>
                  <span className="text-2xl">✍️</span>
                </div>
                <div className="pt-2 flex gap-2">
                  <Input
                    value={quickTask}
                    onChange={(e) => setQuickTask(e.target.value)}
                    placeholder="What's next?"
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

              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 dark:border-slate-700 dark:bg-slate-800/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-amber-900 dark:text-amber-100">Start a focus session</div>
                    <div className="text-xs text-slate-500 dark:text-slate-300 pt-1">
                      {pomo.mode === "focus" ? `${pomo.focusMinutes} min focus` : `${pomo.breakMinutes} min break`}
                    </div>
                  </div>
                  <span className="text-2xl">⏱️</span>
                </div>
                <div className="pt-2">
                  <Button
                    className="w-full"
                    onClick={() => {
                      if (!pomo.running) pomo.start();
                    }}
                  >
                    Focus now
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 dark:border-slate-700 dark:bg-slate-800/60 p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-sm font-medium text-amber-900 dark:text-amber-100">Pin an application</div>
                  <span className="text-2xl">💼</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={quickCompany} onChange={(e) => setQuickCompany(e.target.value)} placeholder="Company" />
                  <Input value={quickRole} onChange={(e) => setQuickRole(e.target.value)} placeholder="Role" />
                </div>
                <div className="pt-2">
                  <Button
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

              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">About</div>
              <div className="pt-2 text-sm text-slate-600 dark:text-slate-300">
                A lightweight tool designed for people actively applying. Keep momentum with simple habits: today's tasks, a focus timer, and a clean application log.
              </div>
            </div>
            <span className="text-3xl">📝</span>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">Stay on track</div>
              <div className="pt-2 text-sm text-slate-600 dark:text-slate-300">
                Track applications with one clear next step, add follow-up dates, and keep notes in one place so nothing slips.
              </div>
            </div>
            <span className="text-3xl">📌</span>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">Build habits</div>
              <div className="pt-2 text-sm text-slate-600 dark:text-slate-300">
                Stay focused with Pomodoro timers, celebrate wins, and develop steady progress in your career journey.
              </div>
            </div>
            <span className="text-3xl">✨</span>
          </div>
        </Card>

      </section>
    </div>
  );
}

function MiniFeature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50/60 p-3 shadow-soft dark:bg-slate-800/60 dark:border-slate-700">
      <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-xl bg-amber-600 text-white dark:bg-amber-600">{icon}</div>
      <div>
        <div className="text-sm font-medium text-amber-900 dark:text-amber-100">{title}</div>
        <div className="text-xs text-amber-700 dark:text-amber-300">{desc}</div>
      </div>
    </div>
  );
}
