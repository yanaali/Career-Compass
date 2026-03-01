import React from "react";
import { NavLink } from "react-router-dom";
import { Compass, LayoutDashboard, Sparkles, Mail, Sun, Moon } from "lucide-react";
import { cn } from "../lib/format";
import { AnimatedOutlet } from "./AnimatedOutlet";
import { useTheme } from "../store/theme";
import { AiAssistantButton } from "./AiAssistant";

export function AppShell() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-slate-50 to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur dark:bg-slate-950/70 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-blue-600 text-white shadow-soft dark:bg-blue-500">
              <Compass size={18} />
            </div>
            <div className="leading-tight text-slate-900 dark:text-slate-100">
              <div className="font-semibold">Career Compass</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Focus • Apply • Follow up</div>
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
              className="hidden rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-900/50 md:inline-flex"
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

      <footer className="border-t bg-white dark:bg-slate-950 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>© {new Date().getFullYear()} Career Compass • Built by Aaliyan Muhammad</div>
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
      className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/50"
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
          "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-900/50",
          isActive && "bg-slate-100 font-medium dark:bg-slate-900/60"
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
        cn("flex-1 rounded-xl px-3 py-2 text-center text-sm hover:bg-slate-50 dark:hover:bg-slate-900/50", isActive && "bg-slate-100 font-medium dark:bg-slate-900/60")
      }
    >
      {label}
    </NavLink>
  );
}
