import { describe, expect, it } from "vitest";
import { LESSONS, getPublishedLesson, getPublishedLessons } from "./catalog";
import { PUBLISHED_LESSON_LINKS } from "./publication";
import { lessonStep, stepHref } from "./navigation";
const lesson = LESSONS[0];
describe("published lesson navigation", () => {
  it("keeps the lightweight manifest synchronized with validated published lessons", () => {
    expect(
      getPublishedLessons().map((item) => ({
        id: item.id,
        slug: item.slug,
        puzzleId: item.puzzleId,
        title: item.title,
        href: `/learn/lessons/${item.slug}`,
      })),
    ).toEqual(PUBLISHED_LESSON_LINKS);
    expect(getPublishedLesson(lesson.slug)).toBe(lesson);
    expect(getPublishedLesson("missing")).toBeUndefined();
  });
  it("uses stable step IDs for direct links", () => {
    for (const [index, step] of lesson.steps.entries()) {
      expect(lessonStep(lesson, step.id)).toEqual({ index, invalid: false });
      expect(stepHref(lesson, index)).toBe(
        `/learn/lessons/${lesson.slug}?step=${step.id}#lesson-step`,
      );
    }
  });
  it.each(["missing", "../bad", "constructor", "", "1", "turn-u&step=undo-u"])(
    "falls back safely for %s",
    (raw) =>
      expect(lessonStep(lesson, raw)).toEqual({ index: 0, invalid: true }),
  );
  it("treats absent step as the first step without an error notice", () =>
    expect(lessonStep(lesson, null)).toEqual({ index: 0, invalid: false }));
  it.each([-1, 3, NaN, 1.5])("rejects an invalid index %s", (index) =>
    expect(() => stepHref(lesson, index)).toThrow(),
  );
});
