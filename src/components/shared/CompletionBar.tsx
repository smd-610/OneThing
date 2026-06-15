import { cn } from "@/lib/utils";

interface CompletionBarProps {
  completed: number;
  total: number;
  className?: string;
}

export function CompletionBar({ completed, total, className }: CompletionBarProps) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground font-medium tabular-nums shrink-0">
        {completed}/{total}
      </span>
    </div>
  );
}
