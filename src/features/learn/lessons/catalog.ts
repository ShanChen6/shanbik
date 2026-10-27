import { parseLessonCatalog } from "./schema";
import { SAMPLE_LESSON_SOURCE } from "./sample";
/** Validated authoring data; public routes must select published lessons only. */
export const LESSONS = parseLessonCatalog([SAMPLE_LESSON_SOURCE]);
export const getLesson = (slug: string) =>
  LESSONS.find((lesson) => lesson.slug === slug);
export const getPublishedLessons = () =>
  LESSONS.filter((lesson) => lesson.status === "published");

export const getPublishedLesson = (slug: string) =>
  getPublishedLessons().find((lesson) => lesson.slug === slug);
