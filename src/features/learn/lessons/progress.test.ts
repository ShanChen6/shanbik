import { describe, expect, it } from "vitest";
import { LESSONS } from "./catalog";
import {
  createLessonProgress,
  progressKey,
  readProgress,
  type ProgressStorage,
} from "./progress";
import { createMoveQueuePlayer } from "../../cube/viewer/move-queue";
import { serializeCubeState } from "../../cube/core/serialization";
const lesson = LESSONS[0],
  first = lesson.steps[0].id,
  next = lesson.steps[1].id;
const record = (stepId = next) =>
  JSON.stringify({
    schemaVersion: 1,
    lessonId: lesson.id,
    contentVersion: lesson.contentVersion,
    stepId,
  });
function storage() {
  const values = new Map<string, string>();
  let writes = 0;
  return {
    values,
    get writes() {
      return writes;
    },
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      writes++;
      values.set(key, value);
    },
    removeItem: (key: string) => {
      values.delete(key);
    },
  };
}
describe("local lesson reading position", () => {
  it("is SSR safe and never writes before storage is read", () => {
    const disk = storage();
    let calls = 0;
    const progress = createLessonProgress(lesson, () => {
      calls++;
      return disk;
    });
    expect(calls).toBe(0);
    expect(progress.getSnapshot()).toBe(progress.getServerSnapshot());
    expect(progress.select(next)).toBe(false);
    expect(disk.writes).toBe(0);
    progress.open();
    expect(calls).toBe(1);
    expect(progress.getSnapshot()).toMatchObject({
      loaded: true,
      stepId: first,
      status: "empty",
    });
    expect(disk.writes).toBe(0);
  });
  it("restores a stable step ID before any save and keeps records small", () => {
    const disk = storage();
    disk.values.set(progressKey(lesson), record());
    const progress = createLessonProgress(lesson, () => disk);
    progress.open();
    expect(progress.getSnapshot()).toMatchObject({
      stepId: next,
      status: "saved",
    });
    expect(progress.select(next)).toBe(false);
    expect(disk.writes).toBe(0);
    progress.select(lesson.steps[2].id);
    const raw = disk.values.get(progressKey(lesson))!;
    expect(raw.length).toBeLessThan(1024);
    expect(JSON.parse(raw)).toEqual({
      schemaVersion: 1,
      lessonId: lesson.id,
      contentVersion: lesson.contentVersion,
      stepId: lesson.steps[2].id,
    });
  });
  it.each([
    "broken",
    "null",
    "[]",
    "{}",
    JSON.stringify({ schemaVersion: 2 }),
    record("missing"),
    "x".repeat(1025),
  ])(
    "ignores malformed data %# without overwriting it on initialization",
    (raw) => {
      const disk = storage();
      disk.values.set(progressKey(lesson), raw);
      const progress = createLessonProgress(lesson, () => disk);
      progress.open();
      expect(progress.getSnapshot()).toMatchObject({
        stepId: first,
        status: "empty",
        invalid: true,
      });
      expect(disk.writes).toBe(0);
    },
  );
  it("isolates lesson IDs and content versions", () => {
    const disk = storage();
    disk.values.set(progressKey(lesson), record());
    const revised = { ...lesson, contentVersion: lesson.contentVersion + 1 };
    const progress = createLessonProgress(revised, () => disk);
    progress.open();
    expect(progress.getSnapshot().stepId).toBe(first);
    expect(disk.values.get(progressKey(lesson))).toBe(record());
    expect(() => readProgress(record(), revised)).toThrow();
    expect(() => readProgress(record(), { ...lesson, id: "other" })).toThrow();
  });
  it.each(["factory", "read", "write", "remove"])(
    "handles %s failure without breaking reading",
    (kind) => {
      const fail = () => {
        throw Error("Blocked");
      };
      const disk = storage();
      const adapter: ProgressStorage = {
        getItem: kind === "read" ? fail : disk.getItem,
        setItem: kind === "write" ? fail : disk.setItem,
        removeItem: kind === "remove" ? fail : disk.removeItem,
      };
      const progress = createLessonProgress(
        lesson,
        kind === "factory" ? fail : () => adapter,
      );
      progress.open();
      progress.select(next);
      if (kind === "remove") progress.clear();
      expect(progress.getSnapshot().status).toBe("unavailable");
      expect(progress.getSnapshot().loaded).toBe(true);
      expect(progress.getSnapshot().stepId).toBe(
        kind === "remove" ? first : next,
      );
    },
  );
  it("clears only this lesson/version and does not recreate a cleared first-step record", () => {
    const disk = storage();
    disk.values.set("shanbik-theme", "dark");
    disk.values.set("other-progress", "keep");
    const progress = createLessonProgress(lesson, () => disk);
    progress.open();
    progress.select(next);
    progress.clear();
    expect(progress.getSnapshot()).toMatchObject({
      stepId: first,
      status: "cleared",
    });
    expect(progress.select(first)).toBe(false);
    expect(disk.values.has(progressKey(lesson))).toBe(false);
    expect(disk.values.get("shanbik-theme")).toBe("dark");
    expect(disk.values.get("other-progress")).toBe("keep");
  });
  it("supports StrictMode cleanup/reopen and rejects updates after release or for unknown steps", () => {
    const disk = storage();
    const progress = createLessonProgress(lesson, () => disk);
    progress.open();
    progress.select(next);
    progress.close();
    expect(progress.select(first)).toBe(false);
    expect(progress.clear()).toBe(false);
    progress.open();
    expect(progress.getSnapshot().stepId).toBe(next);
    expect(progress.select("unknown")).toBe(false);
    progress.select(first);
    expect(readProgress(disk.values.get(progressKey(lesson))!, lesson)).toBe(
      first,
    );
  });
});
describe("lesson viewer step boundaries", () => {
  it.each([false, true])(
    "starts/replays at before and reaches the verified after with reduced motion=%s",
    (reduced) => {
      const step = lesson.steps[1],
        player = createMoveQueuePlayer(step.before);
      player.loadSequence(step.moves, step.before);
      player.setReducedMotion(reduced);
      expect(serializeCubeState(player.getSnapshot().state)).toBe(
        serializeCubeState(step.before),
      );
      expect(player.getSnapshot().active).toBeNull();
      player.play();
      while (player.getSnapshot().active)
        player.complete(player.getSnapshot().active!.id);
      expect(serializeCubeState(player.getSnapshot().state)).toBe(
        serializeCubeState(step.after),
      );
      player.resetPlayback();
      expect(serializeCubeState(player.getSnapshot().state)).toBe(
        serializeCubeState(step.before),
      );
    },
  );
  it("cancels an old viewer and leaves the next step unaffected by late completion", () => {
    const a = createMoveQueuePlayer(lesson.steps[1].before);
    a.loadSequence(lesson.steps[1].moves);
    a.play();
    const late = a.getSnapshot().active!.id;
    a.cancel();
    const b = createMoveQueuePlayer(lesson.steps[2].before);
    b.loadSequence(lesson.steps[2].moves);
    const before = b.getSnapshot();
    expect(a.complete(late)).toBe(false);
    expect(b.getSnapshot()).toBe(before);
  });
  it("keeps observation at zero moves without fake animation", () => {
    const step = lesson.steps[0],
      player = createMoveQueuePlayer(step.before);
    player.loadSequence(step.moves);
    expect(player.play()).toBe(false);
    expect(player.getSnapshot().active).toBeNull();
    expect(player.getSnapshot().playback?.cursor).toBe(0);
  });
});
