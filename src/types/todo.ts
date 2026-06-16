export type Priority = "high" | "medium" | "low";
export type ViewMode = "day" | "week" | "month" | "year" | "settings";

export interface Todo {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  completed: boolean;
  dueDate: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string | null;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  priority?: Priority;
  completed?: boolean;
  dueDate?: string | null;
  sortOrder?: number;
}
