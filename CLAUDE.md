# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

OneThing 是一个 Tauri 2 桌面待办事项应用，前端使用 React 19 + TypeScript，数据存储使用 SQLite。界面全部中文化，设计风格对标 Linear + Things 3。

## 常用命令

```bash
# 开发模式（启动 Vite + Tauri 窗口，Rust 代码变更自动重编译）
npm run tauri dev

# 生产构建（类型检查 + 前端打包 + Rust release 构建）
npm run tauri build

# 仅前端开发（不开 Tauri 窗口，适合快速 UI 调试）
npm run dev

# 仅类型检查
npx tsc --noEmit

# 仅前端打包
npx vite build
```

首次 `tauri dev` 需编译约 417 个 Rust crate，后续重编译约 30 秒。SQLite 数据库 `todo.db` 在首次启动时自动创建于系统应用数据目录。

**Rust 工具链要求：** `tauri-plugin-sql` 2.x 依赖的 `brotli` 8.x 在部分稳定版 Rust 上编译失败，需使用 `rustup default nightly`。

## 架构

### 数据流

```
SQLite (todo.db)  ←→  database.ts（懒加载单例，参数化查询）
                              ↓
                      todo-store.ts（Zustand：乐观更新，pendingToggles 防抖）
                              ↓
                      React 组件（useTodoStore + useShallow selector）
```

### 两个 Zustand Store

- **`todo-store.ts`** — `todos[]`、`isLoading`，CRUD + `reorderTodos`（事务性）。所有写操作先执行异步 DB 再乐观更新本地状态。`pendingToggles` Set 防止快速双击 toggle 的竞态问题。
- **`ui-store.ts`** — `viewMode`（day/week/month/year）、`selectedDate`（YYYY-MM-DD 字符串）、`theme`（light/dark）。主题通过 localStorage 持久化（key: `onething-theme`），切换时在 `<html>` 上添加/移除 `.dark` class。

### 视图切换

不使用路由。`App.tsx` 读取 `uiStore.viewMode` 条件渲染对应视图组件。周视图/月视图点击某天时，设置 `selectedDate` 并切换 `setViewMode("day")` 钻入日视图。

### 数据库层（`src/lib/database.ts`）

- 通过 `dbPromise` 懒加载单例（防止并发初始化竞态）
- `reorderTodos` 使用 BEGIN/COMMIT/ROLLBACK 事务包裹批量 UPDATE
- 所有查询使用 `$1, $2, ...` 参数化占位符，禁止字符串拼接
- ID 由前端通过 `crypto.randomUUID()` 生成

### UI 组件

- **shadcn/ui 基础组件** 在 `components/ui/` — 手动编写，非 CLI 生成。使用 `cn()` 工具函数（clsx + tailwind-merge）。
- **共享组件** 在 `components/shared/` — TodoItem（@dnd-kit 拖拽）、TodoForm（Dialog 弹窗）、TodoList（DndContext 包裹）、PriorityBadge、CompletionBar、EmptyState。
- **视图组件** 在 `components/views/` — DayView、WeekView、MonthView、YearView。

### 主题系统

Tailwind CSS v4 使用 CSS 配置（无 `tailwind.config.js`）。主题变量在 `index.css` 中定义为 oklch 色彩空间的 CSS 变量，`:root` 为浅色，`.dark` 为深色。`@theme` 块将变量映射为 Tailwind 工具类。

### 日期处理

`dayjs` 使用 `zh-cn` locale（在 `main.tsx` 中设置）。所有日期以 `YYYY-MM-DD` 字符串存储和比较。周起始日为周一（ISO 标准）。`relativeTime` 插件用于到期日相对时间显示。

## 关键约定

- **界面语言：** 所有用户可见文本必须为中文，禁止英文。
- **导入路径：** 使用 `@/` 路径别名（映射到 `src/`）。
- **TypeScript：** 严格模式，开启 `noUnusedLocals` 和 `noUnusedParameters`。
- **无路由：** 视图通过 Zustand 状态切换，不使用 URL 路由。
- **Rust 后端：** 极简设计 — `lib.rs` 仅注册插件，无自定义 Tauri 命令，所有业务逻辑在 TypeScript 层。
- **SQLite 权限：** 当前仅授权 `sql:allow-execute` 和 `sql:allow-select`。若需新增 SQL 插件功能，须同步更新 `src-tauri/capabilities/default.json`。

## Cargo.toml 备注

- `tauri` 使用 `default-features = false` 以排除 `compression` 特性（该特性引入 `brotli` 8.x，与部分 Rust 工具链不兼容）。
- 仅启用 `wry` 和 `common-controls-v6` 特性。
