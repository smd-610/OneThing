import Database from "@tauri-apps/plugin-sql";
import type { Todo, CreateTodoInput, UpdateTodoInput } from "@/types/todo";

const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS todos (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority    TEXT CHECK(priority IN ('high','medium','low')) DEFAULT 'medium',
  completed   INTEGER DEFAULT 0,
  due_date    TEXT,
  sort_order  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
`;

let db: Database | null = null;
let dbPromise: Promise<Database> | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;
  if (!dbPromise) {
    dbPromise = Database.load("sqlite:todo.db").then(async (database) => {
      await database.execute(CREATE_TABLE);
      db = database;
      return database;
    });
  }
  return dbPromise;
}

function rowToTodo(row: Record<string, unknown>): Todo {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? "",
    priority: (row.priority as Todo["priority"]) ?? "medium",
    completed: Boolean(row.completed),
    dueDate: (row.due_date as string) ?? null,
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function fetchTodos(dueDate?: string): Promise<Todo[]> {
  const database = await getDb();
  let rows: Record<string, unknown>[];
  if (dueDate) {
    rows = await database.select(
      "SELECT * FROM todos WHERE due_date = $1 ORDER BY sort_order, created_at DESC",
      [dueDate]
    );
  } else {
    rows = await database.select(
      "SELECT * FROM todos ORDER BY sort_order, created_at DESC"
    );
  }
  return rows.map(rowToTodo);
}

export async function fetchTodosByDateRange(
  startDate: string,
  endDate: string
): Promise<Todo[]> {
  const database = await getDb();
  const rows: Record<string, unknown>[] = await database.select(
    "SELECT * FROM todos WHERE due_date >= $1 AND due_date <= $2 ORDER BY sort_order",
    [startDate, endDate]
  );
  return rows.map(rowToTodo);
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const database = await getDb();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await database.execute(
    `INSERT INTO todos (id, title, description, priority, due_date, sort_order, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      id,
      input.title,
      input.description ?? "",
      input.priority ?? "medium",
      input.dueDate ?? null,
      0,
      now,
      now,
    ]
  );
  return {
    id,
    title: input.title,
    description: input.description ?? "",
    priority: input.priority ?? "medium",
    completed: false,
    dueDate: input.dueDate ?? null,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateTodo(
  id: string,
  fields: UpdateTodoInput
): Promise<void> {
  const database = await getDb();
  const sets: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (fields.title !== undefined) {
    sets.push(`title = $${paramIndex++}`);
    params.push(fields.title);
  }
  if (fields.description !== undefined) {
    sets.push(`description = $${paramIndex++}`);
    params.push(fields.description);
  }
  if (fields.priority !== undefined) {
    sets.push(`priority = $${paramIndex++}`);
    params.push(fields.priority);
  }
  if (fields.completed !== undefined) {
    sets.push(`completed = $${paramIndex++}`);
    params.push(fields.completed ? 1 : 0);
  }
  if (fields.dueDate !== undefined) {
    sets.push(`due_date = $${paramIndex++}`);
    params.push(fields.dueDate);
  }
  if (fields.sortOrder !== undefined) {
    sets.push(`sort_order = $${paramIndex++}`);
    params.push(fields.sortOrder);
  }

  sets.push(`updated_at = $${paramIndex++}`);
  params.push(new Date().toISOString());
  params.push(id);

  await database.execute(
    `UPDATE todos SET ${sets.join(", ")} WHERE id = $${paramIndex}`,
    params
  );
}

export async function deleteTodo(id: string): Promise<void> {
  const database = await getDb();
  await database.execute("DELETE FROM todos WHERE id = $1", [id]);
}

export async function reorderTodos(ids: string[]): Promise<void> {
  const database = await getDb();
  const now = new Date().toISOString();
  await database.execute("BEGIN");
  try {
    for (let i = 0; i < ids.length; i++) {
      await database.execute(
        "UPDATE todos SET sort_order = $1, updated_at = $2 WHERE id = $3",
        [i, now, ids[i]]
      );
    }
    await database.execute("COMMIT");
  } catch (e) {
    await database.execute("ROLLBACK");
    throw e;
  }
}
