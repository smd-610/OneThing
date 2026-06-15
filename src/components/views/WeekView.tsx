import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUiStore } from "@/stores/ui-store";
import { fetchTodosByDateRange } from "@/lib/database";
import type { Todo } from "@/types/todo";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";

const weekDays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

export function WeekView() {
  const { selectedDate, setSelectedDate, setViewMode } = useUiStore();
  const [weekTodos, setWeekTodos] = useState<Todo[]>([]);

  const weekStart = dayjs(selectedDate).startOf("week");
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    weekStart.add(i, "day")
  );

  const loadWeekTodos = useCallback(async () => {
    const start = weekStart.format("YYYY-MM-DD");
    const end = weekStart.add(6, "day").format("YYYY-MM-DD");
    const todos = await fetchTodosByDateRange(start, end);
    setWeekTodos(todos);
  }, [weekStart.format("YYYY-MM-DD")]);

  useEffect(() => {
    loadWeekTodos();
  }, [loadWeekTodos]);

  const getTodosForDate = (date: dayjs.Dayjs) =>
    weekTodos.filter((t) => t.dueDate && dayjs(t.dueDate).format("YYYY-MM-DD") === date.format("YYYY-MM-DD"));

  const navigateWeek = (direction: -1 | 1) => {
    setSelectedDate(
      dayjs(selectedDate).add(direction * 7, "day").format("YYYY-MM-DD")
    );
  };

  const handleDayClick = (date: dayjs.Dayjs) => {
    setSelectedDate(date.format("YYYY-MM-DD"));
    setViewMode("day");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 border-b">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {weekStart.format("MMM D")} — {weekStart.add(6, "day").format("MMM D, YYYY")}
            </h2>
            <p className="text-sm text-muted-foreground">本周视图</p>
          </div>
          <button
            onClick={() => navigateWeek(1)}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-8 py-6">
          <div className="grid grid-cols-7 gap-3">
            {weekDates.map((date, index) => {
              const dayTodos = getTodosForDate(date);
              const isToday = date.isSame(dayjs(), "day");
              const isSelected = date.format("YYYY-MM-DD") === selectedDate;
              const completedCount = dayTodos.filter((t) => t.completed).length;

              return (
                <button
                  key={date.format("YYYY-MM-DD")}
                  onClick={() => handleDayClick(date)}
                  className={cn(
                    "flex flex-col items-center p-4 rounded-xl border transition-all cursor-pointer",
                    "hover:shadow-md hover:border-primary/30",
                    isToday && "border-primary/50 bg-primary/5",
                    isSelected && !isToday && "border-primary bg-primary/5",
                    !isToday && !isSelected && "bg-card"
                  )}
                >
                  <span className="text-xs font-medium text-muted-foreground mb-1">
                    {weekDays[index]}
                  </span>
                  <span
                    className={cn(
                      "text-2xl font-semibold mb-3",
                      isToday
                        ? "text-primary"
                        : "text-foreground"
                    )}
                  >
                    {date.format("D")}
                  </span>

                  {dayTodos.length > 0 ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-foreground">
                        {dayTodos.length} 个任务
                      </span>
                      <div className="w-full h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width:
                              dayTodos.length > 0
                                ? `${Math.round((completedCount / dayTodos.length) * 100)}%`
                                : "0%",
                          }}
                        />
                      </div>
                      {completedCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {completedCount} 已完成
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">
                      暂无任务
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
