import { useCallback, useEffect, useState } from "react";

const STORE_KEY = "rht-theme"; // "dark" | "light", absent = follow the clock

function isNightNow() {
  const hour = new Date().getHours();
  return hour < 6 || hour >= 19;
}

function storedTheme() {
  try {
    const v = localStorage.getItem(STORE_KEY);
    return v === "dark" || v === "light" ? v : null;
  } catch {
    return null; // private mode / storage disabled
  }
}

/**
 * Day/night theme. Defaults to the player's real local clock (timezone-aware
 * via Date()), but an explicit choice wins and is remembered across visits -
 * otherwise the clock would silently undo the toggle a minute later.
 */
export function useDayNight() {
  const [manual, setManual] = useState(storedTheme);
  const [night, setNight] = useState(() => {
    const saved = storedTheme();
    return saved ? saved === "dark" : isNightNow();
  });

  useEffect(() => {
    if (manual) return; // an explicit choice is not overridden by the clock
    const id = setInterval(() => setNight(isNightNow()), 60000);
    return () => clearInterval(id);
  }, [manual]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", night ? "dark" : "light");
  }, [night]);

  const toggle = useCallback(() => {
    setNight((n) => {
      const next = !n;
      const value = next ? "dark" : "light";
      setManual(value);
      try {
        localStorage.setItem(STORE_KEY, value);
      } catch {
        /* still applies for this session */
      }
      return next;
    });
  }, []);

  /** Drop the override and go back to following the clock. */
  const followClock = useCallback(() => {
    setManual(null);
    try {
      localStorage.removeItem(STORE_KEY);
    } catch {
      /* ignore */
    }
    setNight(isNightNow());
  }, []);

  return { night, toggle, followClock, manual: Boolean(manual) };
}
