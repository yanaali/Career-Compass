import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Sparkles, Mail, Sun, Moon } from "lucide-react";
import { cn } from "../lib/format";
import { AnimatedOutlet } from "./AnimatedOutlet";
import { useTheme } from "../store/theme";
import { AiAssistantButton } from "./AiAssistant";
import { useApplications } from "../store/applications";

export function AppShell() {
  React.useEffect(() => { void useApplications.getState().initializeAuth(); }, []);
  return (
    <div className="min-h-screen bg-gradient-cozy dark:bg-gradient-cozy-dark">
      <header className="sticky top-0 z-20 border-b border-amber-100 bg-white/70 backdrop-blur dark:bg-slate-950/90 dark:border-slate-700">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="relative grid h-9 w-9 place-items-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-400 to-sage-500 text-white shadow-warm dark:from-amber-400 dark:via-orange-300 dark:to-sage-400">
              <div className="absolute inset-1 rounded-full border border-white/35" />
              <div className="absolute h-2.5 w-[2px] origin-bottom rounded-full bg-white/90 rotate-45" />
              <div className="absolute h-2.5 w-[2px] origin-bottom rounded-full bg-white/90 -rotate-45" />
              <div className="absolute h-2 w-2 rounded-full bg-white/90" />
              <div className="flex items-center justify-center gap-[2px] font-black tracking-[-0.18em] text-[1.05rem] leading-none">
                <span className="inline-block -rotate-12">C</span>
                <span className="inline-block rotate-12">C</span>
              </div>
            </div>
            <div className="leading-tight text-slate-900 dark:text-slate-100">
              <div className="font-semibold">Career Compass</div>
              <div className="text-xs text-amber-600 dark:text-amber-400">Focus • Apply • Follow up</div>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            <TopLink to="/" label="Home" icon={<Sparkles size={16} />} />
            <TopLink to="/dashboard" label="Dashboard" icon={<LayoutDashboard size={16} />} />
            <TopLink to="/resources" label="Resources" icon={<Sparkles size={16} />} />
            <TopLink to="/contact" label="Contact" icon={<Mail size={16} />} />
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AiAssistantButton />
            <a
              href="https://github.com/"
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 md:inline-flex"
              title="See the code on GitHub."
            >
              GitHub
            </a>
          </div>
        </div>

        <div className="mx-auto flex max-w-6xl gap-1 px-4 pb-3 md:hidden">
          <BottomLink to="/" label="Home" />
          <BottomLink to="/dashboard" label="Dashboard" />
          <BottomLink to="/resources" label="Resources" />
          <BottomLink to="/contact" label="Contact" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <AnimatedOutlet />
      </main>

      <footer className="border-t border-amber-100 bg-white/50 dark:bg-slate-950/90 dark:border-slate-700">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>© {new Date().getFullYear()} Career Compass</div>
            <div className="flex gap-3">
              <a className="hover:underline" href="/contact">Contact</a>
              <a className="hover:underline" href="/resources">Resources</a>
              <a className="hover:underline" href="https://opensource.org/licenses/MIT" target="_blank" rel="noreferrer">MIT</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white/70 px-3 py-2 text-sm text-slate-700 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      aria-label="Toggle theme"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}

function TopLink({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-amber-100 dark:text-slate-200 dark:hover:bg-slate-800",
          isActive && "bg-amber-200 font-medium text-amber-900 shadow-sm dark:bg-amber-500/20 dark:text-amber-100 dark:border dark:border-amber-400/30"
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

function BottomLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex-1 rounded-xl px-3 py-2 text-center text-sm text-slate-700 transition-colors hover:bg-amber-100 dark:text-slate-200 dark:hover:bg-slate-800",
          isActive && "bg-amber-200 font-medium text-amber-900 dark:bg-amber-500/20 dark:text-amber-100 dark:border dark:border-amber-400/30"
        )
      }
    >
      {label}
    </NavLink>
  );
}
