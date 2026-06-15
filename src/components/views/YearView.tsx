import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Flame, Trophy, CheckCircle2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUiStore } from "@/stores/ui-store";
import { fetchTodosByDateRange } from "@/lib/database";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";

const HEATMAP_LEVELS = [
  "bg-muted",
  "bg-emerald-200 dark:bg-emerald-900/40",
  "bg-emerald-300 dark:bg-emerald-800/60",
  "bg-emerald-400 dark:bg-emerald-700/80",
  "bg-emerald-500 dark:bg-emerald-600",
];

function getHeatLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 8) return 3;
  return 4;
}

interface DayData {
  date: dayjs.Dayjs;
  count: number;
  completed: number;
}

export function YearView() {
  const { selectedDate, setSelectedDate } = useUiStore();
  const [yearData, setYearData] = useState<Map<string, { count: number; completed: number }>>(new Map());
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);

  const year = dayjs(selectedDate).year();
  const yearStart = dayjs().year(year).startOf("year");
  const yearEnd = dayjs().year(year).endOf("year");

  const loadYearTodos = useCallback(async () => {
    const start = yearStart.format("YYYY-MM-DD");
    const end = yearEnd.format("YYYY-MM-DD");
    const todos = await fetchTodosByDateRange(start, end);

    const map = new Map<string, { count: number; completed: number }>();
    for (const todo of todos) {
      if (!todo.dueDate) continue;
      const existing = map.get(todo.dueDate) ?? { count: 0, completed: 0 };
      existing.count++;
      if (todo.completed) existing.completed++;
      map.set(todo.dueDate, existing);
    }
    setYearData(map);
  }, [year]);

  useEffect(() => {
    loadYearTodos();
  }, [loadYearTodos]);

  // Build weeks grid
  const startDate = yearStart.startOf("week");
  const weeks: dayjs.Dayjs[][] = [];
  let cursor = startDate;
  while (cursor.isBefore(yearEnd.add(1, "week"))) {
    const week: dayjs.Dayjs[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = cursor.add(1, "day");
    }
    weeks.push(week);
  }

  // Stats
  const allDays = Array.from(yearData.entries());
  const totalCompleted = allDays.reduce((sum, [, v]) => sum + v.completed, 0);
  const activeDays = allDays.filter(([, v]) => v.completed > 0).length;

  // Current streak
  let currentStreak = 0;
  let streakDate = dayjs();
  // Check if today has completions, if not start from yesterday
  const todayData = yearData.get(streakDate.format("YYYY-MM-DD"));
  if (!todayData || todayData.completed === 0) {
    streakDate = streakDate.subtract(1, "day");
  }
  while (streakDate.isAfter(yearStart.subtract(1, "day"))) {
    const data = yearData.get(streakDate.format("YYYY-MM-DD"));
    if (data && data.completed > 0) {
      currentStreak++;
      streakDate = streakDate.subtract(1, "day");
    } else {
      break;
    }
  }

  // Longest streak
  let longestStreak = 0;
  let tempStreak = 0;
  let d = yearStart;
  while (d.isBefore(yearEnd.add(1, "day"))) {
    const data = yearData.get(d.format("YYYY-MM-DD"));
    if (data && data.completed > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
    d = d.add(1, "day");
  }

  const monthLabels: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, index) => {
    const month = week[0].month();
    if (month !== lastMonth) {
      monthLabels.push({ label: week[0].format("MMM"), weekIndex: index });
      lastMonth = month;
    }
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 border-b">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedDate(dayjs(selectedDate).subtract(1, "year").format("YYYY-MM-DD"))}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{year}</h2>
            <p className="text-sm text-muted-foreground">年度总览</p>
          </div>
          <button
            onClick={() => setSelectedDate(dayjs(selectedDate).add(1, "year").format("YYYY-MM-DD"))}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-8 py-6">
          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-medium text-muted-foreground">
                  当前连续
                </span>
              </div>
              <span className="text-2xl font-bold">{currentStreak}</span>
              <span className="text-sm text-muted-foreground ml-1">天</span>
            </div>
            <div className="p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-muted-foreground">
                  最长连续
                </span>
              </div>
              <span className="text-2xl font-bold">{longestStreak}</span>
              <span className="text-sm text-muted-foreground ml-1">天</span>
            </div>
            <div className="p-4 rounded-xl border bg-card">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-medium text-muted-foreground">
                  总完成数
                </span>
              </div>
              <span className="text-2xl font-bold">{totalCompleted}</span>
              <span className="text-sm text-muted-foreground ml-1">
                跨越 {activeDays} 天
              </span>
            </div>
          </div>

          {/* Heatmap */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex gap-1">
              {/* Day labels */}
              <div className="flex flex-col gap-[3px] mr-2 pt-5">
                {["", "周一", "", "周三", "", "周五", ""].map((label, i) => (
                  <div
                    key={i}
                    className="h-[11px] flex items-center text-[10px] text-muted-foreground"
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              <div className="flex-1 overflow-x-auto">
                {/* Month labels */}
                <div className="flex gap-[3px] mb-1 h-4">
                  {monthLabels.map(({ label, weekIndex }) => (
                    <div
                      key={`${label}-${weekIndex}`}
                      className="text-[10px] text-muted-foreground"
                      style={{ marginLeft: weekIndex === 0 ? 0 : undefined }}
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {/* Grid */}
                <div className="flex gap-[3px]">
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-[3px]">
                      {week.map((date) => {
                        const dateStr = date.format("YYYY-MM-DD");
                        const data = yearData.get(dateStr);
                        const count = data?.count ?? 0;
                        const completed = data?.completed ?? 0;
                        const isCurrentYear = date.year() === year;

                        return (
                          <div
                            key={dateStr}
                            className={cn(
                              "w-[11px] h-[11px] rounded-[2px] transition-all cursor-pointer",
                              isCurrentYear
                                ? HEATMAP_LEVELS[getHeatLevel(completed)]
                                : "bg-transparent",
                              "hover:ring-1 hover:ring-primary/50 hover:ring-offset-1"
                            )}
                            onMouseEnter={() =>
                              setHoveredDay({ date, count, completed })
                            }
                            onMouseLeave={() => setHoveredDay(null)}
                            title={`${dateStr}: ${completed} completed`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Hover tooltip */}
            {hoveredDay && (
              <div className="mt-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {hoveredDay.date.format("MMMM D, YYYY")}
                </span>
                {" — "}
                {hoveredDay.completed} 已完成 / {hoveredDay.count} 总计
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-1.5 mt-4 justify-end">
              <span className="text-[10px] text-muted-foreground mr-1">少</span>
              {HEATMAP_LEVELS.map((level, i) => (
                <div
                  key={i}
                  className={cn("w-[11px] h-[11px] rounded-[2px]", level)}
                />
              ))}
              <span className="text-[10px] text-muted-foreground ml-1">多</span>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
