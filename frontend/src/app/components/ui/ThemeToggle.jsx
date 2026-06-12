import { Sun, Moon } from "lucide-react";
import { cn } from "../ui/utils";
import { useEffect, useState } from "react";

export function ThemeToggle({ className, compact = false }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      setIsDark(stored === "dark");
    } else {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggle = () => setIsDark((prev) => !prev);

  return (
    <button
      onClick={toggle}
      className={cn(
        "group flex items-center gap-3 transition-all duration-200 text-sm font-semibold",
        compact
          ? "p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400"
          : "px-3.5 py-2.5 rounded-xl w-full text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/10 hover:text-indigo-600 dark:hover:text-indigo-300 text-gray-500 dark:text-gray-400",
        className
      )}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? <Sun className={cn("flex-shrink-0", compact ? "w-4 h-4" : "w-4 h-4")} /> : <Moon className={cn("flex-shrink-0", compact ? "w-4 h-4" : "w-4 h-4")} />}
      {!compact && <span>{isDark ? "Light Mode" : "Dark Mode"}</span>}
    </button>
  );
}
