/**
 * Three-way merge for keyed records. Values are canonical strings (stable
 * serialization of what matters for equality); `undefined` means absent or
 * deleted. Nothing is overwritten silently: when both sides changed a key
 * differently from the last synced base, it becomes a conflict.
 */
export type Side = ReadonlyMap<string, string>;
export type Conflict = Readonly<{
  key: string;
  base: string | undefined;
  local: string | undefined;
  remote: string | undefined;
}>;
export type MergePlan = Readonly<{
  /** Apply on this device: value to write, or undefined to delete. */
  toLocal: ReadonlyMap<string, string | undefined>;
  /** Send to the account: value to upsert, or undefined for a tombstone. */
  toRemote: ReadonlyMap<string, string | undefined>;
  conflicts: readonly Conflict[];
  /** Base after both sides are applied (conflicted keys keep their old base). */
  nextBase: ReadonlyMap<string, string>;
}>;
export function mergeThreeWay(
  base: Side,
  local: Side,
  remote: Side,
): MergePlan {
  const keys = new Set([...base.keys(), ...local.keys(), ...remote.keys()]);
  const toLocal = new Map<string, string | undefined>(),
    toRemote = new Map<string, string | undefined>(),
    conflicts: Conflict[] = [],
    nextBase = new Map<string, string>();
  for (const key of [...keys].sort()) {
    const b = base.get(key),
      l = local.get(key),
      r = remote.get(key);
    let agreed: string | undefined;
    if (l === r) agreed = l;
    else if (l === b) {
      toLocal.set(key, r);
      agreed = r;
    } else if (r === b) {
      toRemote.set(key, l);
      agreed = l;
    } else {
      conflicts.push({ key, base: b, local: l, remote: r });
      if (b !== undefined) nextBase.set(key, b);
      continue;
    }
    if (agreed !== undefined) nextBase.set(key, agreed);
  }
  return { toLocal, toRemote, conflicts, nextBase };
}
