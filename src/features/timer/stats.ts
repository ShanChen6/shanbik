import { resultMs, type Solve } from "./solve";
/** A statistic: milliseconds, DNF, or not enough solves yet. */
export type Stat = number | "DNF" | null;
/** WCA 9f1: averages and means are rounded to the nearest centisecond. */
const round = (ms: number) => Math.round(ms / 10) * 10;
/** Solves are newest-first everywhere in the app; statistics read oldest-first. */
export const chronological = (solves: readonly Solve[]) =>
  [...solves].sort(
    (a, b) => a.timestamp - b.timestamp || b.id.localeCompare(a.id),
  );
export function best(solves: readonly Solve[]): Stat {
  const times = solves.map(resultMs).filter((ms): ms is number => ms !== null);
  return times.length ? Math.min(...times) : solves.length ? "DNF" : null;
}
export function worst(solves: readonly Solve[]): Stat {
  if (!solves.length) return null;
  const times = solves.map(resultMs);
  return times.includes(null) ? "DNF" : Math.max(...(times as number[]));
}
/** Mean of every result; any DNF makes it DNF (mo3 rule). */
export function meanOf(solves: readonly Solve[]): Stat {
  if (!solves.length) return null;
  const times = solves.map(resultMs);
  if (times.includes(null)) return "DNF";
  return round((times as number[]).reduce((a, b) => a + b, 0) / times.length);
}
/** Mean of finished solves only, ignoring DNF; for session overviews. */
export function successMean(solves: readonly Solve[]): Stat {
  const times = solves.map(resultMs).filter((ms): ms is number => ms !== null);
  return times.length
    ? round(times.reduce((a, b) => a + b, 0) / times.length)
    : solves.length
      ? "DNF"
      : null;
}
/** Solves trimmed from each end: 1 for Ao5/Ao12, 5% rounded up for longer sets. */
export const trimCount = (n: number) => Math.ceil(n * 0.05);
/**
 * Trimmed average of all given solves (Ao5/Ao12 rules): drop the best and worst
 * `trimCount` results, DNF counts as worst; more DNFs than trimmed → DNF.
 */
export function averageOf(solves: readonly Solve[]): Stat {
  if (solves.length < 3) return null;
  const trim = trimCount(solves.length),
    times = solves.map(resultMs);
  if (times.filter((t) => t === null).length > trim) return "DNF";
  const kept = times
    .map((t) => t ?? Infinity)
    .sort((a, b) => a - b)
    .slice(trim, times.length - trim);
  return round(kept.reduce((a, b) => a + b, 0) / kept.length);
}
/** Latest Ao`n`, or null with fewer than n solves. Input is chronological. */
export function currentAverage(ordered: readonly Solve[], n: number): Stat {
  return ordered.length < n ? null : averageOf(ordered.slice(-n));
}
/** Ao`n` ending at every solve (null before the n-th). Input is chronological. */
export function rollingAverages(ordered: readonly Solve[], n: number): Stat[] {
  return ordered.map((_, i) =>
    i + 1 < n ? null : averageOf(ordered.slice(i + 1 - n, i + 1)),
  );
}
/** Smaller is better; DNF is worse than any time; null means unavailable. */
export function bestStat(stats: readonly Stat[]): Stat {
  let out: Stat = null;
  for (const s of stats) {
    if (s === null) continue;
    if (out === null || out === "DNF" || (s !== "DNF" && s < out)) out = s;
  }
  return out;
}
export type Summary = Readonly<{
  count: number;
  dnf: number;
  plusTwo: number;
  best: Stat;
  worst: Stat;
  mean: Stat;
  ao5: Stat;
  bestAo5: Stat;
  ao12: Stat;
  bestAo12: Stat;
  sessionAverage: Stat;
}>;
export function summarize(solves: readonly Solve[]): Summary {
  const ordered = chronological(solves);
  return Object.freeze({
    count: ordered.length,
    dnf: ordered.filter((s) => s.penalty === "DNF").length,
    plusTwo: ordered.filter((s) => s.penalty === "+2").length,
    best: best(ordered),
    worst: worst(ordered),
    mean: successMean(ordered),
    ao5: currentAverage(ordered, 5),
    bestAo5: bestStat(rollingAverages(ordered, 5)),
    ao12: currentAverage(ordered, 12),
    bestAo12: bestStat(rollingAverages(ordered, 12)),
    sessionAverage: averageOf(ordered),
  });
}
/** Practice session = local calendar day, as `YYYY-MM-DD`. */
export function sessionKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
/** Session keys newest first with their solve counts. */
export function sessions(
  solves: readonly Solve[],
): readonly Readonly<{ key: string; count: number }>[] {
  const counts = new Map<string, number>();
  for (const s of chronological(solves).reverse()) {
    const key = sessionKey(s.timestamp);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts].map(([key, count]) => Object.freeze({ key, count }));
}
