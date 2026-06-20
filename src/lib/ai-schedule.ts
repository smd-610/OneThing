import type { Priority } from "@/types/todo";

export interface ScheduleItem {
  title: string;
  dueDate: string;
  priority: Priority;
}

export async function extractSchedules(
  text: string,
  today: string,
  apiKey: string,
  baseUrl: string,
  model: string
): Promise<ScheduleItem[]> {
  if (!apiKey) throw new Error("请先在设置页配置 AI API Key");
  if (!baseUrl) throw new Error("请先在设置页配置 AI 接口地址");
  if (!model) throw new Error("请先在设置页配置 AI 模型名称");

  const systemPrompt = `你是一个日程提取助手。用户会输入一段文字，你需要从中提取出所有的待办事项或日程安排。
今天的日期是 ${today}。
请以 JSON 数组格式返回，每个元素包含：
- title: 任务标题（简短概括）
- dueDate: 完整日期，格式 "YYYY-MM-DD" 或带时间 "YYYY-MM-DDTHH:mm"
- priority: "high" | "medium" | "low"，根据紧急程度推断

规则：
- "明天"指 ${today} 的下一天，"后天"指下两天，"下周X"指从今天算起的下一个星期X
- 如果提到具体时间（如"下午3点"），dueDate 使用 "YYYY-MM-DDTHH:mm" 格式（24小时制）
- 如果没有时间信息，dueDate 只用日期部分 "YYYY-MM-DD"
- 无法判断优先级时用 "medium"
- 提取不到任何日程时返回空数组 []
- 只返回 JSON 数组，不要其他文字、不要 markdown 代码块`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const url = baseUrl.replace(/\/+$/, "") + "/chat/completions";
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`API 请求失败 (${res.status}): ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? "";

    if (!content.trim()) {
      return [];
    }

    // Extract JSON array from response, handling extra text and code fences
    const cleaned = content
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : cleaned;

    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed)) {
      throw new Error("AI 返回格式异常：不是数组");
    }

    return parsed.map((item: Record<string, unknown>) => ({
      title: String(item.title ?? "未命名任务"),
      dueDate: String(item.dueDate ?? today),
      priority: (["high", "medium", "low"].includes(item.priority as string)
        ? item.priority
        : "medium") as Priority,
    }));
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("AI 请求超时（30秒），请检查网络连接");
    }
    if (err instanceof TypeError && String(err).includes("fetch")) {
      throw new Error(
        "网络请求失败，可能是 CORS 限制。请检查接口地址是否正确，或尝试使用支持 CORS 的 API 服务"
      );
    }
    throw err;
  }
}
