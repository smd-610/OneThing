import { useState, useEffect } from "react";
import { getAllSettings } from "@/lib/database";

interface AiSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  loaded: boolean;
}

export function useAiSettings(): AiSettings {
  const [settings, setSettings] = useState<AiSettings>({
    apiKey: "",
    baseUrl: "",
    model: "",
    loaded: false,
  });

  useEffect(() => {
    (async () => {
      const all = await getAllSettings();
      setSettings({
        apiKey: all.ai_api_key ?? "",
        baseUrl: all.ai_base_url ?? "",
        model: all.ai_model ?? "",
        loaded: true,
      });
    })();
  }, []);

  return settings;
}
