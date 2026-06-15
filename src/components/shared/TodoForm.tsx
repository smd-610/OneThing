import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Priority, Todo } from "@/types/todo";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";

interface TodoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  todo?: Todo | null;
  defaultDate?: string;
  onSubmit: (data: { title: string; description: string; priority: Priority; dueDate: string | null }) => void;
}

const priorities: { value: Priority; label: string }[] = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
];

export function TodoForm({
  open,
  onOpenChange,
  todo,
  defaultDate,
  onSubmit,
}: TodoFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [dueTime, setDueTime] = useState("");

  useEffect(() => {
    if (open) {
      setTitle(todo?.title ?? "");
      setDescription(todo?.description ?? "");
      setPriority(todo?.priority ?? "medium");
      if (todo?.dueDate) {
        const parsed = dayjs(todo.dueDate);
        setDueDate(parsed.format("YYYY-MM-DD"));
        setDueTime(todo.dueDate.includes("T") ? parsed.format("HH:mm") : "");
      } else {
        setDueDate(defaultDate ?? dayjs().format("YYYY-MM-DD"));
        setDueTime("");
      }
    }
  }, [open, todo, defaultDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const mergedDueDate = dueTime ? `${dueDate}T${dueTime}` : dueDate;
    onSubmit({ title: title.trim(), description, priority, dueDate: mergedDueDate });
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate(defaultDate ?? dayjs().format("YYYY-MM-DD"));
    setDueTime("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{todo ? "编辑任务" : "新建任务"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="任务标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="text-base"
            />
          </div>
          <div>
            <Input
              placeholder="描述（可选）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {priorities.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPriority(value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
                  priority === value
                    ? value === "high"
                      ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-400 dark:border-red-700"
                      : value === "medium"
                      ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-700"
                      : "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-700"
                    : "border-input text-muted-foreground hover:bg-accent"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex-1"
            />
            <Input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-32"
              placeholder="时间（可选）"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!title.trim()}>
              {todo ? "保存更改" : "添加任务"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
