import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getAllSettings, setSetting } from "@/lib/database";
import { Mail, Send, CheckCircle, XCircle, Sparkles } from "lucide-react";

const SETTING_KEYS = [
  "smtp_host",
  "smtp_port",
  "smtp_user",
  "smtp_pass",
  "email_to",
  "reminders_enabled",
  "ai_api_key",
  "ai_base_url",
  "ai_model",
] as const;

const LABELS: Record<string, string> = {
  smtp_host: "SMTP 服务器",
  smtp_port: "端口",
  smtp_user: "用户名（邮箱地址）",
  smtp_pass: "密码 / 应用专用密码",
  email_to: "收件邮箱",
  reminders_enabled: "启用提醒",
  ai_api_key: "API Key",
  ai_base_url: "接口地址",
  ai_model: "模型名称",
};

const PLACEHOLDERS: Record<string, string> = {
  smtp_host: "smtp.qq.com",
  smtp_port: "465",
  smtp_user: "your-email@qq.com",
  smtp_pass: "授权码",
  email_to: "your-email@qq.com",
  ai_api_key: "sk-...",
  ai_base_url: "https://api.deepseek.com/v1",
  ai_model: "deepseek-chat",
};

export function SettingsView() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [testMsg, setTestMsg] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getAllSettings();
      setSettings(s);
      setLoaded(true);
    })();
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    for (const key of SETTING_KEYS) {
      const val = settings[key] ?? "";
      if (key === "reminders_enabled") {
        await setSetting(key, val || "false");
      } else {
        await setSetting(key, val);
      }
    }
    setSaved(true);
  };

  const handleTest = async () => {
    setTestStatus("sending");
    setTestMsg("");
    try {
      await invoke("send_email", {
        smtpHost: settings.smtp_host || "",
        smtpPort: Number(settings.smtp_port) || 465,
        smtpUser: settings.smtp_user || "",
        smtpPass: settings.smtp_pass || "",
        to: settings.email_to || "",
        subject: "[OneThing] 邮件测试",
        body: "如果你收到这封邮件，说明 SMTP 配置正确！",
      });
      setTestStatus("ok");
      setTestMsg("测试邮件已发送，请检查收件箱");
    } catch (err) {
      setTestStatus("error");
      setTestMsg(String(err));
    }
  };

  if (!loaded) return null;

  const remindersEnabled = settings.reminders_enabled === "true";

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 pt-6 pb-4 border-b">
        <h2 className="text-xl font-semibold tracking-tight">设置</h2>
        <p className="text-sm text-muted-foreground">邮件提醒配置</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-8 py-6 max-w-lg space-y-6">
          {/* Reminder toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">邮件提醒</p>
                <p className="text-xs text-muted-foreground">
                  到期前 1 天和 1 小时发送邮件通知
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                const next = remindersEnabled ? "false" : "true";
                handleChange("reminders_enabled", next);
                await setSetting("reminders_enabled", next);
              }}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                remindersEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  remindersEnabled ? "translate-x-5.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* SMTP fields */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">SMTP 配置</h3>
            {(["smtp_host", "smtp_port", "smtp_user", "smtp_pass"] as const).map(
              (key) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {LABELS[key]}
                  </label>
                  <Input
                    type={key === "smtp_pass" ? "password" : "text"}
                    value={settings[key] ?? ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={PLACEHOLDERS[key]}
                  />
                </div>
              )
            )}
          </div>

          {/* Email to */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">收件设置</h3>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                {LABELS.email_to}
              </label>
              <Input
                type="email"
                value={settings.email_to ?? ""}
                onChange={(e) => handleChange("email_to", e.target.value)}
                placeholder={PLACEHOLDERS.email_to}
              />
            </div>
          </div>

          {/* AI Configuration */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI 智能提取配置
            </h3>
            <p className="text-xs text-muted-foreground">
              支持 OpenAI、DeepSeek、Qwen、Kimi 等兼容接口
            </p>
            {(["ai_base_url", "ai_model", "ai_api_key"] as const).map(
              (key) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    {LABELS[key]}
                  </label>
                  <Input
                    type={key === "ai_api_key" ? "password" : "text"}
                    value={settings[key] ?? ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={PLACEHOLDERS[key]}
                  />
                </div>
              )
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1">
              保存设置
            </Button>
            <Button
              variant="outline"
              onClick={handleTest}
              disabled={testStatus === "sending"}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {testStatus === "sending" ? "发送中..." : "测试发送"}
            </Button>
          </div>

          {saved && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">
              设置已保存
            </p>
          )}
          {testStatus === "ok" && (
            <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-3.5 w-3.5" />
              {testMsg}
            </div>
          )}
          {testStatus === "error" && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <XCircle className="h-3.5 w-3.5" />
              {testMsg}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
