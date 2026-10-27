"use client";
import { useSyncExternalStore } from "react";
const subscribe = (notify: () => void) => {
  const timer = setInterval(notify, 60_000);
  return () => clearInterval(timer);
};
const minute = () => Math.floor(Date.now() / 60_000) * 60_000;
/**
 * Current time rounded to the minute, or null during server rendering and
 * hydration so status badges never mismatch the static HTML.
 */
export function useNow(): number | null {
  const now = useSyncExternalStore(subscribe, minute, () => 0);
  return now || null;
}
const mountedSubscribe = () => () => {};
/** True only in the browser after hydration. */
export const useMounted = () =>
  useSyncExternalStore(
    mountedSubscribe,
    () => true,
    () => false,
  );
