import { SYNC_KINDS, type SyncKind } from "./kinds";
import { mergeThreeWay, type Conflict, type Side } from "./merge";
export interface RemoteAdapter {
  /** Every live (non-tombstone) record of the signed-in user. */
  fetch(kind: SyncKind): Promise<Side>;
  /** Upsert values; `undefined` marks an existing record deleted. */
  push(
    kind: SyncKind,
    changes: ReadonlyMap<string, string | undefined>,
  ): Promise<void>;
}
export interface LocalAdapter {
  read(kind: SyncKind): Promise<Side>;
  apply(
    kind: SyncKind,
    changes: ReadonlyMap<string, string | undefined>,
  ): Promise<void>;
}
export type Bases = Readonly<Record<SyncKind, ReadonlyMap<string, string>>>;
export interface BaseStore {
  read(userId: string): Bases | null;
  write(userId: string, bases: Bases): void;
}
export type Choice = Readonly<{
  pick: "local" | "remote";
  /** The values the user saw; a choice is void if either side moved on. */
  local: string | undefined;
  remote: string | undefined;
}>;
export const choiceKey = (kind: SyncKind, key: string) => `${kind}:${key}`;
export type KindConflict = Conflict & Readonly<{ kind: SyncKind }>;
export type SyncReport = Readonly<{
  pulled: number;
  pushed: number;
  conflicts: readonly KindConflict[];
}>;
export class SyncError extends Error {
  constructor(
    readonly stage: "fetch" | "read" | "push" | "apply" | "consent",
    readonly kind: SyncKind | null,
    cause?: unknown,
  ) {
    super(`Sync failed at ${stage}${kind ? ` (${kind})` : ""}`, { cause });
  }
}
const emptyBases = (): Bases =>
  Object.fromEntries(SYNC_KINDS.map((k) => [k, new Map()])) as unknown as Bases;
/**
 * One sync pass. The first sync for a user on this device requires consent.
 * Per kind: fetch → read → merge → push → apply → save base. A failure stops
 * the pass; bases already saved stay valid, the failed kind keeps its old
 * base, and running again is safe because every write is an idempotent
 * upsert/tombstone by key. Conflicts are reported, never applied, unless
 * the user passed a choice for that key.
 */
export async function syncOnce({
  userId,
  remote,
  local,
  baseStore,
  consent,
  choices = new Map(),
}: {
  userId: string;
  remote: RemoteAdapter;
  local: LocalAdapter;
  baseStore: BaseStore;
  consent: boolean;
  /** choiceKey(kind, key) → choice made on a previous report's conflict. */
  choices?: ReadonlyMap<string, Choice>;
}): Promise<SyncReport> {
  const stored = baseStore.read(userId);
  if (!stored && !consent) throw new SyncError("consent", null);
  const bases: Record<SyncKind, ReadonlyMap<string, string>> = {
    ...(stored ?? emptyBases()),
  };
  let pulled = 0,
    pushed = 0;
  const conflicts: KindConflict[] = [];
  for (const kind of SYNC_KINDS) {
    let r: Side, l: Side;
    try {
      r = await remote.fetch(kind);
    } catch (e) {
      throw new SyncError("fetch", kind, e);
    }
    try {
      l = await local.read(kind);
    } catch (e) {
      throw new SyncError("read", kind, e);
    }
    const plan = mergeThreeWay(bases[kind], l, r);
    const toRemote = new Map(plan.toRemote),
      toLocal = new Map(plan.toLocal),
      nextBase = new Map(plan.nextBase);
    for (const c of plan.conflicts) {
      const choice = choices.get(choiceKey(kind, c.key));
      // A choice only applies if both sides are still what the user saw.
      if (!choice || choice.local !== c.local || choice.remote !== c.remote) {
        conflicts.push({ ...c, kind });
        continue;
      }
      const value = choice.pick === "local" ? c.local : c.remote;
      if (choice.pick === "local") toRemote.set(c.key, value);
      else toLocal.set(c.key, value);
      if (value === undefined) nextBase.delete(c.key);
      else nextBase.set(c.key, value);
    }
    // Tombstones only make sense for records the account still has.
    for (const [key, value] of toRemote)
      if (value === undefined && !r.has(key)) toRemote.delete(key);
    try {
      if (toRemote.size) await remote.push(kind, toRemote);
    } catch (e) {
      throw new SyncError("push", kind, e);
    }
    try {
      if (toLocal.size) await local.apply(kind, toLocal);
    } catch (e) {
      throw new SyncError("apply", kind, e);
    }
    pushed += toRemote.size;
    pulled += toLocal.size;
    bases[kind] = nextBase;
    baseStore.write(userId, bases);
  }
  return { pulled, pushed, conflicts };
}
/** localStorage base store: small canonical values per user. */
export function createBaseStore(
  storage: Pick<Storage, "getItem" | "setItem">,
): BaseStore {
  const key = (userId: string) => `shanbik:sync-base:v1:${userId}`;
  return {
    read(userId) {
      try {
        const raw = storage.getItem(key(userId));
        if (!raw) return null;
        const v = JSON.parse(raw);
        if (v?.version !== 1) return null;
        return Object.fromEntries(
          SYNC_KINDS.map((k) => [
            k,
            new Map(
              Object.entries(
                (v.bases?.[k] ?? {}) as Record<string, string>,
              ).filter(([, x]) => typeof x === "string"),
            ),
          ]),
        ) as unknown as Bases;
      } catch {
        return null;
      }
    },
    write(userId, bases) {
      storage.setItem(
        key(userId),
        JSON.stringify({
          version: 1,
          bases: Object.fromEntries(
            SYNC_KINDS.map((k) => [k, Object.fromEntries(bases[k])]),
          ),
        }),
      );
    },
  };
}
