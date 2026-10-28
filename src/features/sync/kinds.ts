import { REMINDERS, type Reminder } from "../competitions/bookmarks";
import { validateSolve, type Solve } from "../timer/solve";
/** What a device and the account exchange, as canonical strings per key. */
export const SYNC_KINDS = ["solves", "favorites", "bookmarks"] as const;
export type SyncKind = (typeof SYNC_KINDS)[number];
export const KIND_LABELS: Record<SyncKind, string> = {
  solves: "Lượt giải",
  favorites: "Công thức yêu thích",
  bookmarks: "Giải đã lưu",
};
/** Remote tables and their key column (see supabase/migrations). */
export const TABLES = {
  solves: { table: "solves", key: "id" },
  favorites: { table: "algorithm_favorites", key: "formula_id" },
  bookmarks: { table: "competition_bookmarks", key: "competition_id" },
} as const satisfies Record<SyncKind, { table: string; key: string }>;
/** Same key rules as the SQL check constraints; other keys stay device-only. */
const KEY_PATTERNS: Record<SyncKind, RegExp> = {
  solves: /^[a-zA-Z0-9-]{1,100}$/,
  favorites: /^(?=.{1,80}$)[a-z0-9]+(?:-[a-z0-9]+)*$/,
  bookmarks: /^(?=.{1,80}$)[a-z0-9]+(?:-[a-z0-9]+)*$/,
};
export const isSyncableKey = (kind: SyncKind, key: string) =>
  KEY_PATTERNS[kind].test(key);
// Solves: only fields that matter for equality, in a fixed order.
export const encodeSolve = (s: Solve) =>
  JSON.stringify([s.puzzle, s.durationMs, s.scramble, s.timestamp, s.penalty]);
export function decodeSolve(id: string, value: string): Solve {
  const [puzzle, durationMs, scramble, timestamp, penalty] = JSON.parse(value);
  return validateSolve({
    id,
    puzzle,
    durationMs,
    scramble,
    timestamp,
    penalty,
  });
}
export type Bookmark = Readonly<{ remind: Reminder; savedAt: number }>;
export const encodeBookmark = (b: Bookmark) =>
  JSON.stringify([b.remind, b.savedAt]);
export function decodeBookmark(value: string): Bookmark {
  const [remind, savedAt] = JSON.parse(value);
  if (!Object.hasOwn(REMINDERS, remind) || !Number.isSafeInteger(savedAt))
    throw Error("Invalid bookmark");
  return { remind, savedAt };
}
export const FAVORITE = "1";
type Row = Record<string, unknown>;
/** Remote row → canonical value, or null for tombstones/invalid rows. */
export function rowToValue(kind: SyncKind, row: Row): string | null {
  if (row.deleted) return null;
  try {
    if (kind === "solves")
      return encodeSolve(
        validateSolve({
          id: row.id,
          puzzle: row.puzzle,
          durationMs: row.duration_ms,
          scramble: row.scramble,
          timestamp: Date.parse(String(row.solved_at)),
          penalty: row.penalty,
        }),
      );
    if (kind === "bookmarks")
      return encodeBookmark(
        decodeBookmark(
          JSON.stringify([row.remind, Date.parse(String(row.saved_at))]),
        ),
      );
    return FAVORITE;
  } catch {
    return null;
  }
}
/** Canonical value → remote row for upsert. */
export function valueToRow(
  kind: SyncKind,
  key: string,
  value: string,
  userId: string,
): Row {
  if (kind === "solves") {
    const s = decodeSolve(key, value);
    return {
      user_id: userId,
      id: key,
      puzzle: s.puzzle,
      duration_ms: s.durationMs,
      scramble: s.scramble,
      solved_at: new Date(s.timestamp).toISOString(),
      penalty: s.penalty,
      deleted: false,
    };
  }
  if (kind === "bookmarks") {
    const b = decodeBookmark(value);
    return {
      user_id: userId,
      competition_id: key,
      remind: b.remind,
      saved_at: new Date(b.savedAt).toISOString(),
      deleted: false,
    };
  }
  return { user_id: userId, formula_id: key, deleted: false };
}
