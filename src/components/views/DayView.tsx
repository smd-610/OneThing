import { useState, useEffect, useCallback } from "react";
import { Plus, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TodoList } from "@/components/shared/TodoList";
import { TodoForm } from "@/components/shared/TodoForm";
import { SmartAddDialog } from "@/components/shared/SmartAddDialog";
import { CompletionBar } from "@/components/shared/CompletionBar";
import { useTodoStore } from "@/stores/todo-store";
import { useUiStore } from "@/stores/ui-store";
import type { Priority } from "@/types/todo";
import dayjs from "dayjs";

export function DayView() {
  const { todos, loadTodos, addTodo } = useTodoStore();
  const { selectedDate, setSelectedDate } = useUiStore();
  const [quickAddValue, setQuickAddValue] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [smartAddOpen, setSmartAddOpen] = useState(false);

  const loadDayTodos = useCallback(async () => {
    await loadTodos(selectedDate);
  }, [selectedDate, loadTodos]);

  useEffect(() => {
    loadDayTodos();
  }, [loadDayTodos]);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddValue.trim()) return;
    await addTodo(quickAddValue.trim(), selectedDate);
    setQuickAddValue("");
  };

  const handleFormSubmit = (data: {
    title: string;
    description: string;
    priority: Priority;
    dueDate: string | null;
  }) => {
    addTodo(data.title, data.dueDate ?? selectedDate, data.priority, data.description);
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const isToday = dayjs(selectedDate).isSame(dayjs(), "day");

  const navigateDate = (direction: -1 | 1) => {
    setSelectedDate(dayjs(selectedDate).add(direction, "day").format("YYYY-MM-DD"));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateDate(-1)}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                {dayjs(selectedDate).format("MMMM D, YYYY")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isToday ? "今天" : dayjs(selectedDate).format("dddd")}
              </p>
            </div>
            <button
              onClick={() => navigateDate(1)}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSmartAddOpen(true)}>
              <Sparkles className="h-4 w-4" />
              智能添加
            </Button>
            <Button onClick={() => setFormOpen(true)} size="sm">
              <Plus className="h-4 w-4" />
              添加任务
            </Button>
          </div>
        </div>

        {todos.length > 0 && (
          <CompletionBar completed={completedCount} total={todos.length} />
        )}
      </div>

      {/* Quick add */}
      <div className="px-8 py-3 border-b">
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <Input
            value={quickAddValue}
            onChange={(e) => setQuickAddValue(e.target.value)}
            placeholder="快速添加任务..."
            className="flex-1"
          />
        </form>
      </div>

      {/* Task list */}
      <ScrollArea className="flex-1">
        <div className="px-8 py-4">
          <TodoList
            todos={todos}
            emptyTitle="今天没有任务"
            emptyDescription="在上方输入框快速添加任务，或点击「添加任务」"
          />
        </div>
      </ScrollArea>

      <TodoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultDate={selectedDate}
        onSubmit={handleFormSubmit}
      />

      <SmartAddDialog
        open={smartAddOpen}
        onOpenChange={setSmartAddOpen}
        defaultDate={selectedDate}
        onDone={loadDayTodos}
      />
    </div>
  );
}
