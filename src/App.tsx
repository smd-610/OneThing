import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DayView } from "@/components/views/DayView";
import { WeekView } from "@/components/views/WeekView";
import { MonthView } from "@/components/views/MonthView";
import { YearView } from "@/components/views/YearView";
import { SettingsView } from "@/components/views/SettingsView";
import { useUiStore } from "@/stores/ui-store";
import { startReminderScheduler } from "@/lib/reminder-scheduler";

function App() {
  const { viewMode, initTheme } = useUiStore();

  useEffect(() => {
    initTheme();
    startReminderScheduler();
  }, [initTheme]);

  const renderView = () => {
    switch (viewMode) {
      case "day":
        return <DayView />;
      case "week":
        return <WeekView />;
      case "month":
        return <MonthView />;
      case "year":
        return <YearView />;
      case "settings":
        return <SettingsView />;
    }
  };

  return <AppShell>{renderView()}</AppShell>;
}

export default App;
