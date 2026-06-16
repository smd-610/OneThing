import { invoke } from "@tauri-apps/api/core";
import dayjs from "dayjs";
import {
  getSetting,
  fetchIncompleteTodosWithDueDate,
  isReminderSent,
  markReminderSent,
} from "./database";

const CHECK_INTERVAL_MS = 60_000;
let isRunning = false;

async function checkAndSendReminders(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  try {
    const enabled = await getSetting("reminders_enabled");
    if (enabled !== "true") return;

    const smtpHost = await getSetting("smtp_host");
    const smtpPort = await getSetting("smtp_port");
    const smtpUser = await getSetting("smtp_user");
    const smtpPass = await getSetting("smtp_pass");
    const emailTo = await getSetting("email_to");

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !emailTo) return;

    const todos = await fetchIncompleteTodosWithDueDate();
    const now = dayjs();

    for (const todo of todos) {
      if (!todo.dueDate) continue;
      const dueDate = dayjs(todo.dueDate);
      if (!dueDate.isValid() || dueDate.isBefore(now)) continue;

      const minutesUntilDue = dueDate.diff(now, "minute");

      // 1 day before (window: 1440 to 1380 minutes)
      if (minutesUntilDue <= 1440 && minutesUntilDue > 1380) {
        const alreadySent = await isReminderSent(todo.id, "one_day");
        if (!alreadySent) {
          try {
            await sendReminderEmail(
              { smtpHost, smtpPort: Number(smtpPort), smtpUser, smtpPass, emailTo },
              todo.title,
              todo.dueDate,
              "day"
            );
            await markReminderSent(todo.id, "one_day");
          } catch (err) {
            console.error(`Failed to send 1-day reminder for "${todo.title}":`, err);
          }
        }
      }

      // 1 hour before (window: 60 to 30 minutes)
      if (minutesUntilDue <= 60 && minutesUntilDue > 30) {
        const alreadySent = await isReminderSent(todo.id, "one_hour");
        if (!alreadySent) {
          try {
            await sendReminderEmail(
              { smtpHost, smtpPort: Number(smtpPort), smtpUser, smtpPass, emailTo },
              todo.title,
              todo.dueDate,
              "hour"
            );
            await markReminderSent(todo.id, "one_hour");
          } catch (err) {
            console.error(`Failed to send 1-hour reminder for "${todo.title}":`, err);
          }
        }
      }
    }
  } catch (err) {
    console.error("Reminder check failed:", err);
  } finally {
    isRunning = false;
  }
}

async function sendReminderEmail(
  config: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    emailTo: string;
  },
  title: string,
  dueDate: string,
  type: "day" | "hour"
): Promise<void> {
  const label = type === "day" ? "1 天" : "1 小时";
  const formattedDate = dayjs(dueDate).format("YYYY-MM-DD HH:mm");
  const subject = `[OneThing] 提醒：「${title}」将在 ${label} 后到期`;
  const body = `你有一个待办事项即将到期：\n\n任务：${title}\n到期时间：${formattedDate}\n剩余时间：约 ${label}\n\n请尽快处理。`;

  await invoke("send_email", {
    smtpHost: config.smtpHost,
    smtpPort: config.smtpPort,
    smtpUser: config.smtpUser,
    smtpPass: config.smtpPass,
    to: config.emailTo,
    subject,
    body,
  });
}

let started = false;

export function startReminderScheduler(): void {
  if (started) return;
  started = true;
  checkAndSendReminders();
  setInterval(checkAndSendReminders, CHECK_INTERVAL_MS);
}
