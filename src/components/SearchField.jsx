import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";

const MAX_RECENTS = 5;

function loadRecents(key) {
  if (!key || typeof localStorage === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(raw) ? raw.filter((s) => typeof s === "string").slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

/**
 * Search field modelled on the platform one: a leading search affordance, a
 * trailing cancel button that appears only while there is text, and an optional
 * recent-searches menu.
 *
 * `<input type="search">` is the native web equivalent of NSSearchField, so
 * that is the element used - it brings the right semantics and the on-screen
 * keyboard's Search key on mobile. Its built-in clear button is suppressed in
 * CSS because it cannot be styled and would duplicate ours.
 *
 * A term joins the recents list only when committed (Enter or picked from the
 * menu), never on every keystroke - otherwise the menu fills with prefixes of
 * whatever was last typed.
 */
export default function SearchField({
  value,
  onChange,
  placeholder = "Search",
  label = "Search",
  recentsKey,
  autoFocus = false,
}) {
  const [recents, setRecents] = useState(() => loadRecents(recentsKey));
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const listId = useId();

  const persist = useCallback(
    (next) => {
      setRecents(next);
      if (!recentsKey) return;
      try {
        localStorage.setItem(recentsKey, JSON.stringify(next));
      } catch {
        /* still works for this session */
      }
    },
    [recentsKey]
  );

  const commit = useCallback(
    (term) => {
      const t = term.trim();
      if (!t) return;
      persist([t, ...recents.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENTS));
    },
    [persist, recents]
  );

  // Dismiss the menu on an outside click, the way a real menu behaves.
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e) {
      if (!wrapRef.current?.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [menuOpen]);

  function onKeyDown(e) {
    if (e.key === "Escape") {
      // Escape clears the field first, and only then gives up focus.
      if (value) {
        e.stopPropagation();
        onChange("");
      }
      setMenuOpen(false);
    } else if (e.key === "Enter") {
      commit(value);
      setMenuOpen(false);
    } else if (e.key === "ArrowDown" && recents.length) {
      e.preventDefault();
      setMenuOpen(true);
    }
  }

  function clear() {
    onChange("");
    inputRef.current?.focus();
  }

  const showMenu = menuOpen && recents.length > 0;

  return (
    <div className="searchfield" ref={wrapRef}>
      <span className="searchfield-icon" aria-hidden="true">
        <Search size={15} strokeWidth={2.5} />
      </span>

      <input
        ref={inputRef}
        type="search"
        className="searchfield-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        // Focus covers keyboard traversal; click covers tapping back into a
        // field that already had focus, which fires no focus event.
        onFocus={() => recents.length && !value && setMenuOpen(true)}
        onClick={() => recents.length && !value && setMenuOpen(true)}
        placeholder={placeholder}
        aria-label={label}
        autoFocus={autoFocus}
        autoComplete="off"
        aria-expanded={showMenu}
        aria-controls={showMenu ? listId : undefined}
      />

      {/* Cancel button exists only while there is something to cancel. */}
      {value && (
        <button type="button" className="searchfield-clear" onClick={clear} aria-label="Clear search" title="Clear search">
          <X size={14} strokeWidth={2.75} aria-hidden="true" />
        </button>
      )}

      {showMenu && (
        <ul className="searchfield-menu" id={listId} role="listbox" aria-label="Recent searches">
          <li className="searchfield-menu-head" role="presentation">Recent Searches</li>
          {recents.map((r) => (
            <li key={r} role="option" aria-selected={false}>
              <button
                type="button"
                className="searchfield-menu-item"
                onClick={() => {
                  onChange(r);
                  commit(r);
                  setMenuOpen(false);
                  inputRef.current?.focus();
                }}
              >
                {r}
              </button>
            </li>
          ))}
          <li role="presentation">
            <button
              type="button"
              className="searchfield-menu-item searchfield-menu-clear"
              onClick={() => {
                persist([]);
                setMenuOpen(false);
              }}
            >
              Clear Recents
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
