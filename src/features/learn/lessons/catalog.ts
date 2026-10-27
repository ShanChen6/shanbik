import { parseLessonCatalog } from "./schema";
import { SAMPLE_LESSON_SOURCE } from "./sample";
/** Draft data only in 12.1; no lesson route or product capability is published yet. */
export const LESSONS = parseLessonCatalog([SAMPLE_LESSON_SOURCE]);
export const getLesson = (slug: string) =>
  LESSONS.find((lesson) => lesson.slug === slug);
export const getPublishedLessons = () =>
  LESSONS.filter((lesson) => lesson.status === "published");
