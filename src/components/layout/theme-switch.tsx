// Lucian UX/UI Prompt #021 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#021
"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import "./theme-switch.css";

const subscribe = () => () => {};
/** Matches the knob's 0.9 s spring so the page follows once the sun/moon lands. */
const SWITCH_MS = 900;
const STARS = [
  { left: 30, top: 20 },
  { left: 58, top: 56, delay: -0.6, size: 3 },
  { left: 86, top: 26, delay: -1.2 },
  { left: 44, top: 72, delay: -1.8, size: 3 },
  { left: 110, top: 60, delay: -0.9, size: 2 },
  { left: 20, top: 46, delay: -1.5, size: 2 },
] as const;

/**
 * Day–night switch for the site theme. It starts from the resolved theme
 * (system preference until the user picks); pressing it sets light or dark.
 * The provider disables transitions while the theme class changes, so the
 * switch animates first and applies the theme when the motion ends.
 */
export function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [pending, setPending] = useState<boolean | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const night = pending ?? (mounted && resolvedTheme === "dark");
  const toggle = () => {
    const next = !night;
    setPending(next);
    if (timer.current) clearTimeout(timer.current);
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    timer.current = setTimeout(
      () => {
        timer.current = null;
        setTheme(next ? "dark" : "light");
        setPending(null);
      },
      reduced ? 0 : SWITCH_MS,
    );
  };

  return (
    <div className="flex min-w-0 items-center gap-3 text-sm text-muted">
      <span>Giao diện</span>
      <span className={night ? "u021 is-night" : "u021"}>
        <button
          className="u021-sw"
          type="button"
          role="switch"
          aria-checked={night}
          aria-label="Giao diện tối"
          disabled={!mounted}
          onClick={toggle}
        >
          <span className="u021-halo" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="u021-stars" aria-hidden="true">
            {STARS.map((star) => (
              <i
                key={`${star.left},${star.top}`}
                style={{
                  left: star.left,
                  top: star.top,
                  ...("delay" in star
                    ? { animationDelay: `${star.delay}s` }
                    : {}),
                  ...("size" in star
                    ? { width: star.size, height: star.size }
                    : {}),
                }}
              />
            ))}
          </span>
          <span className="u021-clouds" aria-hidden="true">
            <i />
            <i />
          </span>
          <span className="u021-knob" aria-hidden="true">
            <span className="u021-moon">
              <i />
              <i />
              <i />
            </span>
          </span>
        </button>
      </span>
    </div>
  );
}
