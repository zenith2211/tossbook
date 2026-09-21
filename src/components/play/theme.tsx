"use client";

import { useEffect, useState } from "react";

export const THEME_KEY = "tb.theme";

/**
 * Runs before first paint so the page never flashes the wrong theme.
 * Dark obsidian is the premium default; only an explicit "light" choice opts in.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_KEY,
)});if(t==="light"){document.documentElement.classList.add("theme-light")}}catch(e){}})()`;

function readTheme(): "light" | "dark" {
  return document.documentElement.classList.contains("theme-light") ? "light" : "dark";
}

export function useTheme() {
  // Start as "dark" to match the pre-paint default, then sync once mounted.
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => setTheme(readTheme()), []);

  function toggle() {
    const next = readTheme() === "light" ? "dark" : "light";
    document.documentElement.classList.toggle("theme-light", next === "light");
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* private mode — the choice just won't persist */
    }
    setTheme(next);
  }

  return { theme, toggle };
}

/** iOS-style switch used by the profile settings rows. */
export function Switch({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-brand" : "bg-line"}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`}
      />
    </button>
  );
}
