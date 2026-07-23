import { useEffect, useState } from "react";

const KEY = "rht-streak";

function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function load() {
  if (typeof localStorage === "undefined") return { count: 0, best: 0, lastDay: null };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { count: 0, best: 0, lastDay: null };
}

/**
 * Daily streak: checks in once on mount. Same day = no change; consecutive day
 * = +1; a missed day (or first ever visit) restarts the streak at 1.
 */
export function useStreak() {
  const [state, setState] = useState(load);

  useEffect(() => {
    const today = dayKey();
    const yesterday = dayKey(new Date(Date.now() - 86400000));
    setState((prev) => {
      if (prev.lastDay === today) return prev; // already counted today
      const count = prev.lastDay === yesterday ? prev.count + 1 : 1;
      const next = { count, best: Math.max(count, prev.best || 0), lastDay: today };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return state;
}
