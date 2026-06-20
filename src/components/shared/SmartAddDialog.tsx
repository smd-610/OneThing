import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PriorityBadge } from "./PriorityBadge";
import { useAiSettings } from "@/hooks/use-ai-settings";
import { useTodoStore } from "@/stores/todo-store";
import { useShallow } from "zustand/react/shallow";
import { extractSchedules, type ScheduleItem } from "@/lib/ai-schedule";
import { Sparkles, Loader2, AlertCircle, Trash2 } from "lucide-react";
import dayjs from "dayjs";

interface SmartAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: string;
  onDone: () => void;
}

type Phase = "input" | "loading" | "preview";

export function SmartAddDialog({
  open,
  onOpenChange,
  defaultDate,
  onDone,
}: SmartAddDialogProps) {
  const { apiKey, baseUrl, model, loaded } = useAiSettings();
  const { addTodo } = useTodoStore(useShallow((s) => ({ addTodo: s.addTodo })));

  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("input");
  const [results, setResults] = useState<(ScheduleItem & { checked: boolean })[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setText("");
      setPhase("input");
      setResults([]);
      setError("");
    }
  }, [open]);

  const handleParse = async () => {
    if (!text.trim()) return;
    setPhase("loading");
    setError("");
    try {
      const items = await extractSchedules(
        text.trim(),
        defaultDate,
        apiKey,
        baseUrl,
        model
      );
      if (items.length === 0) {
        setError("未从文本中提取到日程信息，请尝试输入包含日期或时间的内容");
        setPhase("input");
        return;
      }
      setResults(items.map((item) => ({ ...item, checked: true })));
      setPhase("preview");
    } catch (err) {
      setError(String(err));
      setPhase("input");
    }
  };

  const handleConfirm = async () => {
    const checked = results.filter((r) => r.checked);
    await Promise.all(
      checked.map((item) => addTodo(item.title, item.dueDate, item.priority))
    );
    handleClose();
    onDone();
  };

  const handleClose = () => {
    setText("");
    setPhase("input");
    setResults([]);
    setError("");
    onOpenChange(false);
  };

  const toggleCheck = (index: number) => {
    setResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, checked: !r.checked } : r))
    );
  };

  const removeItem = (index: number) => {
    setResults((prev) => prev.filter((_, i) => i !== index));
  };

  const formatDueDate = (dueDate: string) => {
    const d = dayjs(dueDate);
    if (dueDate.includes("T")) {
      return d.format("M月D日 HH:mm");
    }
    return d.format("M月D日");
  };

  const hasApiKey = loaded && apiKey.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            智能添加
          </DialogTitle>
        </DialogHeader>

        {!hasApiKey ? (
          <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                请先配置 AI 接口
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                前往设置页填写 API Key、接口地址和模型名称
              </p>
            </div>
          </div>
        ) : phase === "input" ? (
          <>
            <div className="space-y-3">
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setError("");
                }}
                placeholder="粘贴一段包含日程的文字，例如：&#10;&#10;明天下午3点产品评审会，下周一前提交设计稿，6月25号上午去医院体检"
                className="w-full h-36 px-3 py-2 text-sm rounded-md border border-input bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus
              />
              {error && (
                <div className="flex items-start gap-2 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleParse} disabled={!text.trim()}>
                <Sparkles className="h-4 w-4" />
                AI 解析
              </Button>
            </DialogFooter>
          </>
        ) : phase === "loading" ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">正在分析文本...</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-2">
                识别到 {results.filter((r) => r.checked).length} 个日程，取消不需要的项目
              </p>
              {results.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2.5 rounded-lg border bg-card"
                >
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => toggleCheck(index)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDueDate(item.dueDate)}
                    </p>
                  </div>
                  <PriorityBadge priority={item.priority} />
                  <button
                    onClick={() => removeItem(index)}
                    className="text-muted-foreground/50 hover:text-destructive transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPhase("input")}>
                返回
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={results.filter((r) => r.checked).length === 0}
              >
                确认添加 {results.filter((r) => r.checked).length} 项
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
