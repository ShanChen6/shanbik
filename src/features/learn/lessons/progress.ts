import type { Lesson } from "./schema";
export type ProgressStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;
export type ProgressSnapshot = Readonly<{
  loaded: boolean;
  stepId: string;
  status: "loading" | "empty" | "saved" | "unavailable" | "cleared";
  invalid: boolean;
}>;
export const progressKey = (lesson: Pick<Lesson, "id" | "contentVersion">) =>
  `shanbik:lesson-progress:${lesson.id}:v${lesson.contentVersion}`;
export function readProgress(
  raw: string | null,
  lesson: Lesson,
): string | null {
  if (raw === null) return null;
  if (raw.length > 1024) throw Error("Invalid lesson progress");
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Invalid lesson progress");
  const record = value as Record<string, unknown>;
  if (
    record.schemaVersion !== 1 ||
    record.lessonId !== lesson.id ||
    record.contentVersion !== lesson.contentVersion ||
    typeof record.stepId !== "string" ||
    !lesson.steps.some((step) => step.id === record.stepId)
  )
    throw Error("Invalid lesson progress");
  return record.stepId;
}
/** No browser access until open; tracks reading position, never completion or animation state. */
export function createLessonProgress(
  lesson: Lesson,
  getStorage: () => ProgressStorage,
) {
  const first = lesson.steps[0].id,
    key = progressKey(lesson),
    known = new Set(lesson.steps.map((step) => step.id));
  let snapshot: ProgressSnapshot = Object.freeze({
    loaded: false,
    stepId: first,
    status: "loading",
    invalid: false,
  });
  const server = snapshot,
    listeners = new Set<() => void>();
  let active = false,
    storage: ProgressStorage | null = null;
  const publish = (value: ProgressSnapshot) => {
    snapshot = Object.freeze(value);
    listeners.forEach((notify) => notify());
  };
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => server,
    subscribe(notify: () => void) {
      listeners.add(notify);
      return () => {
        listeners.delete(notify);
      };
    },
    open() {
      active = true;
      if (snapshot.loaded) return;
      let raw: string | null;
      try {
        storage = getStorage();
        raw = storage.getItem(key);
      } catch {
        storage = null;
        publish({
          loaded: true,
          stepId: first,
          status: "unavailable",
          invalid: false,
        });
        return;
      }
      try {
        const saved = readProgress(raw, lesson);
        publish({
          loaded: true,
          stepId: saved ?? first,
          status: saved ? "saved" : "empty",
          invalid: false,
        });
      } catch {
        publish({
          loaded: true,
          stepId: first,
          status: "empty",
          invalid: true,
        });
      }
    },
    select(stepId: string) {
      if (
        !active ||
        !snapshot.loaded ||
        !known.has(stepId) ||
        snapshot.stepId === stepId
      )
        return false;
      const record = JSON.stringify({
        schemaVersion: 1,
        lessonId: lesson.id,
        contentVersion: lesson.contentVersion,
        stepId,
      });
      let status: ProgressSnapshot["status"] = "saved";
      try {
        if (!storage) throw Error("Storage unavailable");
        storage.setItem(key, record);
      } catch {
        status = "unavailable";
      }
      publish({ loaded: true, stepId, status, invalid: false });
      return true;
    },
    clear() {
      if (!active || !snapshot.loaded) return false;
      let status: ProgressSnapshot["status"] = "cleared";
      try {
        if (!storage) throw Error("Storage unavailable");
        storage.removeItem(key);
      } catch {
        status = "unavailable";
      }
      publish({ loaded: true, stepId: first, status, invalid: false });
      return true;
    },
    close() {
      active = false;
    },
  };
}
