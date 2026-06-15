import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUiStore } from "@/stores/ui-store";
import { fetchTodosByDateRange } from "@/lib/database";
import type { Todo, Priority } from "@/types/todo";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";

const weekDayHeaders = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

const priorityDotColor: Record<Priority, string> = {
  high: "bg-red-400 dark:bg-red-500",
  medium: "bg-amber-400 dark:bg-amber-500",
  low: "bg-emerald-400 dark:bg-emerald-500",
};

export function MonthView() {
  const { selectedDate, setSelectedDate, setViewMode } = useUiStore();
  const [monthTodos, setMonthTodos] = useState<Todo[]>([]);

  const currentMonth = dayjs(selectedDate).startOf("month");
  const calendarStart = currentMonth.startOf("week");
  const calendarEnd = currentMonth.endOf("month").endOf("week");

  const loadMonthTodos = useCallback(async () => {
    const start = calendarStart.format("YYYY-MM-DD");
    const end = calendarEnd.format("YYYY-MM-DD");
    const todos = await fetchTodosByDateRange(start, end);
    setMonthTodos(todos);
  }, [calendarStart.format("YYYY-MM-DD"), calendarEnd.format("YYYY-MM-DD")]);

  useEffect(() => {
    loadMonthTodos();
  }, [loadMonthTodos]);

  const calendarDays: dayjs.Dayjs[] = [];
  let cursor = calendarStart;
  while (cursor.isBefore(calendarEnd)) {
    calendarDays.push(cursor);
    cursor = cursor.add(1, "day");
  }

  const getTodosForDate = (date: dayjs.Dayjs) =>
    monthTodos.filter((t) => t.dueDate === date.format("YYYY-MM-DD"));

  const navigateMonth = (direction: -1 | 1) => {
    setSelectedDate(
      dayjs(selectedDate).add(direction, "month").format("YYYY-MM-DD")
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
            onClick={() => navigateMonth(-1)}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {currentMonth.format("MMMM YYYY")}
            </h2>
            <p className="text-sm text-muted-foreground">月视图</p>
          </div>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-8 py-6">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDayHeaders.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date) => {
              const dayTodos = getTodosForDate(date);
              const isCurrentMonth = date.month() === currentMonth.month();
              const isToday = date.isSame(dayjs(), "day");

              return (
                <button
                  key={date.format("YYYY-MM-DD")}
                  onClick={() => handleDayClick(date)}
                  className={cn(
                    "relative flex flex-col items-center py-2.5 rounded-lg transition-all min-h-[70px] cursor-pointer",
                    "hover:bg-accent/70",
                    !isCurrentMonth && "opacity-30",
                    isToday && "bg-primary/5 border border-primary/30",
                    !isToday && "border border-transparent"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isToday
                        ? "text-primary font-bold"
                        : "text-foreground"
                    )}
                  >
                    {date.format("D")}
                  </span>

                  {dayTodos.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-1 justify-center max-w-full">
                      {dayTodos.slice(0, 4).map((todo) => (
                        <div
                          key={todo.id}
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            priorityDotColor[todo.priority]
                          )}
                        />
                      ))}
                      {dayTodos.length > 4 && (
                        <span className="text-[9px] text-muted-foreground ml-0.5">
                          +{dayTodos.length - 4}
                        </span>
                      )}
                    </div>
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
