import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DayView } from "@/components/views/DayView";
import { WeekView } from "@/components/views/WeekView";
import { MonthView } from "@/components/views/MonthView";
import { YearView } from "@/components/views/YearView";
import { useUiStore } from "@/stores/ui-store";

function App() {
  const { viewMode, initTheme } = useUiStore();

  useEffect(() => {
    initTheme();
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
    }
  };

  return <AppShell>{renderView()}</AppShell>;
}

export default App;
