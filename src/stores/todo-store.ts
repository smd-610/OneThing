import { create } from "zustand";
import type { Todo, Priority, UpdateTodoInput } from "@/types/todo";
import {
  fetchTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  reorderTodos,
} from "@/lib/database";

interface TodoState {
  todos: Todo[];
  isLoading: boolean;
  loadTodos: (dueDate?: string) => Promise<void>;
  addTodo: (title: string, dueDate: string, priority?: Priority, description?: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  updateTodo: (id: string, fields: UpdateTodoInput) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  reorderTodos: (ids: string[]) => Promise<void>;
}

const pendingToggles = new Set<string>();

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  isLoading: false,

  loadTodos: async (dueDate?: string) => {
    if (pendingToggles.size > 0) {
      await new Promise<void>((resolve) => {
        const check = () => {
          if (pendingToggles.size === 0) resolve();
          else setTimeout(check, 10);
        };
        check();
      });
    }
    set({ isLoading: true });
    try {
      const todos = await fetchTodos(dueDate);
      set({ todos, isLoading: false });
    } catch (error) {
      console.error("Failed to load todos:", error);
      set({ isLoading: false });
    }
  },

  addTodo: async (title: string, dueDate: string, priority?: Priority, description?: string) => {
    try {
      const todo = await createTodo({ title, dueDate, priority, description });
      set((state) => ({ todos: [todo, ...state.todos] }));
    } catch (error) {
      console.error("Failed to create todo:", error);
    }
  },

  toggleTodo: async (id: string) => {
    if (pendingToggles.has(id)) return;
    pendingToggles.add(id);
    try {
      const currentTodo = get().todos.find((t) => t.id === id);
      if (!currentTodo) return;
      const newCompleted = !currentTodo.completed;
      await updateTodo(id, { completed: newCompleted });
      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === id ? { ...t, completed: newCompleted, updatedAt: new Date().toISOString() } : t
        ),
      }));
    } catch (error) {
      console.error("Failed to toggle todo:", error);
    } finally {
      pendingToggles.delete(id);
    }
  },

  updateTodo: async (id: string, fields: UpdateTodoInput) => {
    try {
      await updateTodo(id, fields);
      set((state) => ({
        todos: state.todos.map((t) =>
          t.id === id ? { ...t, ...fields, updatedAt: new Date().toISOString() } : t
        ),
      }));
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  },

  deleteTodo: async (id: string) => {
    try {
      await deleteTodo(id);
      set((state) => ({ todos: state.todos.filter((t) => t.id !== id) }));
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  },

  reorderTodos: async (ids: string[]) => {
    try {
      await reorderTodos(ids);
      const todoMap = new Map(get().todos.map((t) => [t.id, t]));
      const reordered = ids
        .map((id) => todoMap.get(id))
        .filter(Boolean) as Todo[];
      set({ todos: reordered });
    } catch (error) {
      console.error("Failed to reorder todos:", error);
    }
  },
}));
