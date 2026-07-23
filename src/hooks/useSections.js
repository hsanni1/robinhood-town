import { useEffect, useState } from "react";

const API = (import.meta.env.VITE_SUGGESTIONS_API ?? "/api") + "/sections";

/**
 * Live section-status map ({ sectionId: "open" | "maintenance" }) set by the
 * admin. Polls every 20s; on any failure it keeps the last good value and
 * treats missing sections as open, so the app never locks itself out.
 */
export function useSections() {
  const [sections, setSections] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(API, { headers: { accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled && data && typeof data === "object") setSections(data);
      } catch {
        /* keep last good; default open */
      }
    }
    load();
    const id = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return sections;
}
