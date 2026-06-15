import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Pencil } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { PriorityBadge } from "./PriorityBadge";
import { useTodoStore } from "@/stores/todo-store";
import { useShallow } from "zustand/react/shallow";
import type { Todo } from "@/types/todo";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
  const { toggleTodo, deleteTodo, updateTodo } = useTodoStore(
    useShallow((s) => ({
      toggleTodo: s.toggleTodo,
      deleteTodo: s.deleteTodo,
      updateTodo: s.updateTodo,
    }))
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveTitle = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== todo.title) {
      updateTodo(todo.id, { title: trimmed });
    } else {
      setEditTitle(todo.title);
    }
    setIsEditing(false);
  };

  const dueDateObj = todo.dueDate ? dayjs(todo.dueDate) : null;
  const hasTime = todo.dueDate?.includes("T") ?? false;
  const dueDateLabel = dueDateObj
    ? dueDateObj.isSame(dayjs(), "day")
      ? "今天"
      : dueDateObj.fromNow()
    : null;
  const dueTimeLabel = hasTime && dueDateObj ? dueDateObj.format("HH:mm") : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-card transition-all hover:shadow-sm",
        isDragging && "shadow-lg opacity-90 z-50",
        todo.completed && "opacity-60"
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <Checkbox
        checked={todo.completed}
        onCheckedChange={() => toggleTodo(todo.id)}
      />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveTitle();
              if (e.key === "Escape") {
                setEditTitle(todo.title);
                setIsEditing(false);
              }
            }}
            className="w-full bg-transparent border-none outline-none text-sm font-medium text-foreground p-0"
          />
        ) : (
          <span
            className={cn(
              "text-sm font-medium cursor-text",
              todo.completed && "line-through text-muted-foreground"
            )}
            onClick={() => setIsEditing(true)}
          >
            {todo.title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {dueTimeLabel && (
          <span className="text-xs font-medium text-primary tabular-nums">{dueTimeLabel}</span>
        )}
        {dueDateLabel && (
          <span className="text-xs text-muted-foreground">{dueDateLabel}</span>
        )}
        <PriorityBadge priority={todo.priority} />
        <button
          onClick={() => setIsEditing(true)}
          className="text-muted-foreground/50 hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => deleteTodo(todo.id)}
          className="text-muted-foreground/50 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
