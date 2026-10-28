import type { SupabaseClient } from "@supabase/supabase-js";
import { FAVORITES_KEY } from "../algorithms/favorites";
import {
  BOOKMARKS_KEY,
  MAX_BOOKMARKS,
  parseBookmarks,
} from "../competitions/bookmarks";
import { HISTORY_LIMIT, type SolveRepository } from "../timer/database";
import type { LocalAdapter, RemoteAdapter } from "./engine";
import {
  FAVORITE,
  TABLES,
  decodeBookmark,
  decodeSolve,
  encodeBookmark,
  encodeSolve,
  isSyncableKey,
  rowToValue,
  valueToRow,
  type SyncKind,
} from "./kinds";
type StoragePort = Pick<Storage, "getItem" | "setItem">;
const MAX_FAVORITES = 500;
/**
 * Favorites are read raw (unknown IDs kept): filtering them out here would
 * look like a local deletion and remove them from the account.
 */
function readFavoriteIds(storage: StoragePort): string[] {
  const raw = storage.getItem(FAVORITES_KEY);
  if (raw === null) return [];
  const v = JSON.parse(raw);
  if (
    v?.version !== 1 ||
    !Array.isArray(v.ids) ||
    v.ids.length > MAX_FAVORITES ||
    !v.ids.every((id: unknown) => typeof id === "string" && id.length <= 80)
  )
    throw Error("Invalid favorites");
  return [...new Set<string>(v.ids)];
}
export function createLocalAdapter({
  openSolves,
  storage,
  notify,
}: {
  /** Opens the timer history repository; closed after each call. */
  openSolves: () => Promise<SolveRepository>;
  storage: StoragePort;
  /** Tell open timer/history pages to reload (BroadcastChannel). */
  notify?: () => void;
}): LocalAdapter {
  return {
    async read(kind) {
      if (kind === "solves") {
        const repo = await openSolves();
        try {
          const { solves } = await repo.list();
          return new Map(
            solves
              .filter((s) => isSyncableKey(kind, s.id))
              .map((s) => [s.id, encodeSolve(s)]),
          );
        } finally {
          repo.close();
        }
      }
      if (kind === "favorites")
        return new Map(
          readFavoriteIds(storage)
            .filter((id) => isSyncableKey(kind, id))
            .map((id) => [id, FAVORITE]),
        );
      // Invalid stored bookmarks throw: never treat unreadable data as "deleted".
      return new Map(
        parseBookmarks(storage.getItem(BOOKMARKS_KEY)).map((b) => [
          b.id,
          encodeBookmark({ remind: b.remind, savedAt: b.savedAt }),
        ]),
      );
    },
    async apply(kind, changes) {
      if (kind === "solves") {
        const repo = await openSolves();
        try {
          const { solves } = await repo.list();
          const have = new Set(solves.map((s) => s.id)),
            upserts = [...changes]
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => decodeSolve(k, v!)),
            deletes = [...changes]
              .filter(([, v]) => v === undefined)
              .map(([k]) => k);
          const added = upserts.filter((s) => !have.has(s.id)).length;
          if (have.size - deletes.length + added > HISTORY_LIMIT)
            throw Error("Local history limit reached");
          await repo.applySync(upserts, deletes);
        } finally {
          repo.close();
        }
        notify?.();
        return;
      }
      if (kind === "favorites") {
        const ids = new Set(readFavoriteIds(storage));
        for (const [k, v] of changes) {
          if (v === undefined) ids.delete(k);
          else ids.add(k);
        }
        if (ids.size > MAX_FAVORITES) throw Error("Favorites limit reached");
        storage.setItem(
          FAVORITES_KEY,
          JSON.stringify({ version: 1, ids: [...ids] }),
        );
        return;
      }
      const items = new Map(
        parseBookmarks(storage.getItem(BOOKMARKS_KEY)).map((b) => [b.id, b]),
      );
      for (const [k, v] of changes) {
        if (v === undefined) items.delete(k);
        else items.set(k, { id: k, ...decodeBookmark(v) });
      }
      if (items.size > MAX_BOOKMARKS) throw Error("Bookmarks limit reached");
      storage.setItem(
        BOOKMARKS_KEY,
        JSON.stringify({ version: 1, items: [...items.values()] }),
      );
    },
  };
}
const PAGE = 1000,
  CHUNK = 200;
/** Supabase REST via supabase-js; RLS limits every query to the signed-in user. */
export function createSupabaseRemote(
  client: SupabaseClient,
  userId: string,
): RemoteAdapter {
  return {
    async fetch(kind: SyncKind) {
      const { table, key } = TABLES[kind],
        out = new Map<string, string>();
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await client
          .from(table)
          .select("*")
          .order(key)
          .range(from, from + PAGE - 1);
        if (error) throw error;
        for (const row of data ?? []) {
          const id = String(row[key]),
            value = rowToValue(kind, row);
          if (value !== null && isSyncableKey(kind, id)) out.set(id, value);
        }
        if (!data || data.length < PAGE) return out;
      }
    },
    async push(kind, changes) {
      const { table, key } = TABLES[kind];
      const rows = [...changes]
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => valueToRow(kind, k, v!, userId)),
        gone = [...changes].filter(([, v]) => v === undefined).map(([k]) => k);
      for (let i = 0; i < rows.length; i += CHUNK) {
        const { error } = await client
          .from(table)
          .upsert(rows.slice(i, i + CHUNK), { onConflict: `user_id,${key}` });
        if (error) throw error;
      }
      for (let i = 0; i < gone.length; i += CHUNK) {
        const { error } = await client
          .from(table)
          .update({ deleted: true })
          .in(key, gone.slice(i, i + CHUNK));
        if (error) throw error;
      }
    },
  };
}
