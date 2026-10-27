import type { Lesson } from "./schema";
export function lessonStep(lesson: Lesson, raw: string | null) {
  const index =
    raw === null ? 0 : lesson.steps.findIndex((step) => step.id === raw);
  return Object.freeze({
    index: Math.max(0, index),
    invalid: raw !== null && index < 0,
  });
}
export function stepHref(lesson: Lesson, index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= lesson.steps.length)
    throw Error("Invalid lesson step");
  return `/learn/lessons/${lesson.slug}?${new URLSearchParams({ step: lesson.steps[index].id })}#lesson-step`;
}
