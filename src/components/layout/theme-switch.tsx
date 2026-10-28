// Lucian UX/UI Prompt #219 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#219
"use client";

import { useRef, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";
import "./theme-switch.css";

const subscribe = () => () => {};

function Sun() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="3" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M8 1.5v1.4M8 13.1v1.4M1.5 8h1.4M13.1 8h1.4M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" />
      </g>
    </svg>
  );
}
function Moon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M13.5 9.8A5.6 5.6 0 0 1 6.2 2.5a5.6 5.6 0 1 0 7.3 7.3z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Sun/moon theme button. Going dark, the dark page spreads in a circle from
 * the button over the whole page; going light, the dark circle shrinks back
 * into the button. Uses the View Transitions API on the real page; without
 * it, or with reduced motion, the theme switches at once.
 */
export function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const button = useRef<HTMLButtonElement>(null);
  const dark = mounted && resolvedTheme === "dark";
  const toggle = () => {
    const next = dark ? "light" : "dark";
    const root = document.documentElement;
    // Same DOM change next-themes makes (attribute="class"), applied inside
    // the transition callback so the new snapshot already has the theme.
    const apply = () => {
      root.classList.remove("light", "dark");
      root.classList.add(next);
      root.style.colorScheme = next;
      // Render the moon/sun now so the new snapshot already shows it.
      flushSync(() => setTheme(next));
    };
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced || typeof document.startViewTransition !== "function") {
      apply();
      return;
    }
    const b = button.current!.getBoundingClientRect(),
      cx = b.left + b.width / 2,
      cy = b.top + b.height / 2,
      // Far enough to cover the farthest viewport corner.
      r = Math.hypot(
        Math.max(cx, window.innerWidth - cx),
        Math.max(cy, window.innerHeight - cy),
      );
    root.style.setProperty("--u219-cx", `${cx}px`);
    root.style.setProperty("--u219-cy", `${cy}px`);
    root.style.setProperty("--u219-r", `${Math.ceil(r)}px`);
    root.classList.add("u219-vt", next === "dark" ? "u219-in" : "u219-out");
    button.current!.classList.add("u219-named");
    const transition = document.startViewTransition(apply);
    void transition.finished.finally(() => {
      root.classList.remove("u219-vt", "u219-in", "u219-out");
      button.current?.classList.remove("u219-named");
    });
  };

  return (
    <div className="flex min-w-0 items-center gap-3 text-sm text-muted">
      <span>Giao diện</span>
      <button
        ref={button}
        className={dark ? "u219 is-dark" : "u219"}
        type="button"
        role="switch"
        aria-checked={dark}
        aria-label="Giao diện tối"
        disabled={!mounted}
        onClick={toggle}
      >
        <span className="u219-tg">{dark ? <Moon /> : <Sun />}</span>
      </button>
    </div>
  );
}
