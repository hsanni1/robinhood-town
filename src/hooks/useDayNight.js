import { useEffect, useState } from "react";

function isNightNow() {
  const hour = new Date().getHours();
  return hour < 6 || hour >= 19;
}

/**
 * Auto day/night theme driven by the player's real local clock (timezone-aware
 * via Date()). Falls back to a manual override once the player toggles it.
 */
export function useDayNight() {
  const [night, setNight] = useState(isNightNow);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (manual) return;
    const id = setInterval(() => setNight(isNightNow()), 60000);
    return () => clearInterval(id);
  }, [manual]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", night ? "dark" : "light");
  }, [night]);

  const toggle = () => {
    setManual(true);
    setNight((n) => !n);
  };

  return { night, toggle };
}
