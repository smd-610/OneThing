# OneThing

一款现代化桌面待办事项应用，设计风格对标 Linear + Things 3。

## 技术栈

- **前端：** React 19 + TypeScript + Vite
- **桌面框架：** Tauri 2
- **UI：** Tailwind CSS v4 + shadcn/ui
- **状态管理：** Zustand
- **数据存储：** SQLite
- **拖拽排序：** @dnd-kit
- **邮件发送：** lettre (SMTP)
- **图标：** Lucide React

## 功能

### 任务管理

- 新增 / 编辑 / 删除待办事项
- 完成状态切换
- 拖拽排序
- 三级优先级（高 / 中 / 低）
- 具体到期时间（日期 + 小时分钟）

### 四种视图

| 视图 | 说明 |
|------|------|
| **今天** | 当日任务列表，快速添加，完成进度条 |
| **本周** | 7 天网格，显示每天任务数和完成进度，点击进入日视图 |
| **本月** | 日历布局，优先级彩色圆点，支持月份切换 |
| **本年** | GitHub 风格热力图，连续完成天数统计 |

### 邮件提醒

- 到期前 1 天和 1 小时自动发送邮件通知
- SMTP 邮件发送（支持 QQ邮箱、Gmail、163 等）
- 设置页一键配置，测试发送验证

### 主题

- 浅色 / 深色主题切换
- 跟随系统偏好

## 开发

### 环境要求

- [Node.js](https://nodejs.org/)
- [Rust](https://rustup.rs/)（推荐 nightly）
- Windows 需安装 [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run tauri dev
```

首次启动需编译 Rust 依赖，约 1-2 分钟。

### 生产构建

```bash
npm run tauri build
```

构建产物在 `src-tauri/target/release/bundle/` 下：

- `msi/OneThing_0.1.0_x64_en-US.msi` — Windows Installer
- `nsis/OneThing_0.1.0_x64-setup.exe` — NSIS 安装包

## 目录结构

```
src/
  lib/              # database.ts（SQLite）、reminder-scheduler.ts（邮件提醒）、utils.ts
  stores/           # todo-store.ts、ui-store.ts
  types/            # todo.ts
  components/
    ui/             # shadcn/ui 基础组件
    layout/         # AppShell、Sidebar
    shared/         # TodoItem、TodoForm、TodoList、PriorityBadge、CompletionBar、EmptyState
    views/          # DayView、WeekView、MonthView、YearView、SettingsView
src-tauri/
  src/              # lib.rs（Tauri 插件注册 + send_email 命令）
  capabilities/     # 应用权限配置
```

## 许可

MIT
