import {
  Sun,
  Moon,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import type { ViewMode } from "@/types/todo";
import dayjs from "dayjs";

const navItems: { mode: ViewMode; label: string; icon: typeof Sun }[] = [
  { mode: "day", label: "今天", icon: CalendarDays },
  { mode: "week", label: "本周", icon: CalendarRange },
  { mode: "month", label: "本月", icon: CalendarClock },
  { mode: "year", label: "本年", icon: Calendar },
];

export function Sidebar() {
  const { viewMode, setViewMode, setSelectedDate, theme, toggleTheme } =
    useUiStore();

  const handleNavClick = (mode: ViewMode) => {
    setViewMode(mode);
    setSelectedDate(dayjs().format("YYYY-MM-DD"));
  };

  return (
    <aside className="w-56 h-full flex flex-col border-r bg-card shrink-0">
      <div className="px-5 py-5">
        <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">
              O
            </span>
          </div>
          OneThing
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {dayjs().format("dddd, MMMM D")}
        </p>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ mode, label, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => handleNavClick(mode)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
              viewMode === mode
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="px-3 py-4">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors cursor-pointer"
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
          {theme === "light" ? "深色模式" : "浅色模式"}
        </button>
      </div>
    </aside>
  );
}
