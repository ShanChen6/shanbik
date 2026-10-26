"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const subscribe = () => () => {};

export function ThemeSelect() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  return (
    <label className="flex min-w-0 items-center gap-2 text-sm text-muted">
      <span>Giao diện</span>
      <select
        className="touch-control rounded-lg border border-border bg-surface px-3 text-foreground"
        value={mounted ? theme : "system"}
        onChange={(event) => setTheme(event.target.value)}
        disabled={!mounted}
      >
        <option value="system">Hệ thống</option>
        <option value="light">Sáng</option>
        <option value="dark">Tối</option>
      </select>
    </label>
  );
}
