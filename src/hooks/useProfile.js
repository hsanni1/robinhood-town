import { useCallback, useState } from "react";

const KEY = "rht-profile";
const EMPTY = { username: "", x: "", wallet: "" };

function load() {
  if (typeof localStorage === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return EMPTY;
}

// localStorage-backed player profile: username, X handle, wallet address.
export function useProfile() {
  const [profile, setProfile] = useState(load);

  const save = useCallback((next) => {
    setProfile(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  return { profile, save };
}
