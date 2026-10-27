import { applyAlgorithm } from "../../cube/core/moves";
import {
  parseAlgorithm,
  serializeAlgorithm,
  type CubeAlgorithm,
} from "../../cube/core/notation";
import {
  deserializeCubeState,
  serializeCubeState,
} from "../../cube/core/serialization";
import { validateCubeFeasibility } from "../../cube/core/feasibility";
import type { CubeState } from "../../cube/core/types";

export const LESSON_LIMITS = Object.freeze({
  steps: 32,
  movesPerStep: 256,
  movesPerLesson: 2048,
  objectives: 16,
  text: 2000,
});
export type LessonIssueCode =
  | "INVALID_SCHEMA"
  | "INVALID_ID"
  | "UNSUPPORTED_PUZZLE"
  | "INVALID_STATE"
  | "INFEASIBLE_STATE"
  | "INVALID_ALGORITHM"
  | "TRANSITION_MISMATCH"
  | "DISCONTINUOUS_STEPS"
  | "UNKNOWN_OBJECTIVE"
  | "UNUSED_OBJECTIVE"
  | "FINAL_STATE_MISMATCH"
  | "INVALID_PREREQUISITE"
  | "DUPLICATE_ID"
  | "DUPLICATE_SLUG"
  | "CYCLIC_PREREQUISITE";
export type LessonIssue = Readonly<{
  path: string;
  code: LessonIssueCode;
  message: string;
}>;
export class LessonValidationError extends Error {
  readonly issue: LessonIssue;
  constructor(path: string, code: LessonIssueCode, message: string) {
    super(`${path}: ${message}`);
    this.name = "LessonValidationError";
    this.issue = Object.freeze({ path, code, message });
  }
}
export type LessonObjective = Readonly<{ id: string; description: string }>;
export type LessonStep = Readonly<{
  id: string;
  title: string;
  kind: "observe" | "moves";
  instructions: readonly string[];
  objectiveIds: readonly string[];
  algorithm: string;
  moves: CubeAlgorithm;
  before: CubeState;
  after: CubeState;
}>;
export type Lesson = Readonly<{
  schemaVersion: 1;
  contentVersion: number;
  id: string;
  slug: string;
  puzzleId: "3x3";
  status: "draft" | "published";
  title: string;
  summary: string;
  orientation: "white-up-green-front";
  prerequisiteIds: readonly string[];
  objectives: readonly LessonObjective[];
  initialState: CubeState;
  finalState: CubeState;
  steps: readonly LessonStep[];
}>;
/** Authoring DTO: facelet strings are explicit fixtures, not computed getters. */
export type LessonStepSource = {
  id: string;
  title: string;
  kind: "observe" | "moves";
  instructions: string[];
  objectiveIds: string[];
  algorithm: string;
  before: string;
  after: string;
};
export type LessonSource = {
  schemaVersion: 1;
  contentVersion: number;
  id: string;
  slug: string;
  puzzleId: "3x3";
  status: "draft" | "published";
  title: string;
  summary: string;
  orientation: "white-up-green-front";
  prerequisiteIds: string[];
  objectives: { id: string; description: string }[];
  initialState: string;
  finalState: string;
  steps: LessonStepSource[];
};
function fail(path: string, code: LessonIssueCode, message: string): never {
  throw new LessonValidationError(path, code, message);
}
function object(
  input: unknown,
  path: string,
  keys: readonly string[],
): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input))
    fail(path, "INVALID_SCHEMA", "Cần một object.");
  for (const key of Object.keys(input))
    if (!keys.includes(key))
      fail(`${path}.${key}`, "INVALID_SCHEMA", "Trường không thuộc schema.");
  return input as Record<string, unknown>;
}
function text(
  input: unknown,
  path: string,
  max: number = LESSON_LIMITS.text,
): string {
  if (typeof input !== "string" || !input.trim() || input.length > max)
    fail(
      path,
      "INVALID_SCHEMA",
      `Cần văn bản không rỗng, tối đa ${max} ký tự.`,
    );
  return input.trim();
}
function id(input: unknown, path: string): string {
  const value = text(input, path, 80);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))
    fail(path, "INVALID_ID", "ID/slug cần chữ thường, số và dấu gạch nối.");
  return value;
}
function array(
  input: unknown,
  path: string,
  min: number,
  max: number,
): unknown[] {
  if (!Array.isArray(input) || input.length < min || input.length > max)
    fail(path, "INVALID_SCHEMA", `Cần mảng từ ${min} đến ${max} mục.`);
  return input;
}
function ids(input: unknown, path: string, max: number): readonly string[] {
  const values = array(input, path, 0, max).map((item, index) =>
    id(item, `${path}[${index}]`),
  );
  if (new Set(values).size !== values.length)
    fail(path, "DUPLICATE_ID", "ID không được lặp.");
  return Object.freeze(values);
}
function state(input: unknown, path: string): CubeState {
  let value: CubeState;
  try {
    value = deserializeCubeState(input);
  } catch {
    fail(
      path,
      "INVALID_STATE",
      "Cần serialization URFDLB hợp lệ với 54 ô và tâm cố định.",
    );
  }
  const report = validateCubeFeasibility(value);
  if (!report.valid)
    fail(path, "INFEASIBLE_STATE", "Trạng thái không khả thi với khối 3×3.");
  return report.state;
}
/** Compile only author-provided state fixtures; never manufacture expected after-state from the algorithm. */
export function parseLesson(input: unknown, path = "lesson"): Lesson {
  const source = object(input, path, [
    "schemaVersion",
    "contentVersion",
    "id",
    "slug",
    "puzzleId",
    "status",
    "title",
    "summary",
    "orientation",
    "prerequisiteIds",
    "objectives",
    "initialState",
    "finalState",
    "steps",
  ]);
  if (source.schemaVersion !== 1)
    fail(
      `${path}.schemaVersion`,
      "INVALID_SCHEMA",
      "Chỉ hỗ trợ schema version 1.",
    );
  if (
    !Number.isSafeInteger(source.contentVersion) ||
    Number(source.contentVersion) < 1
  )
    fail(
      `${path}.contentVersion`,
      "INVALID_SCHEMA",
      "Cần contentVersion nguyên dương.",
    );
  if (source.puzzleId !== "3x3")
    fail(
      `${path}.puzzleId`,
      "UNSUPPORTED_PUZZLE",
      "Chưa có lesson adapter cho puzzle này.",
    );
  if (source.status !== "draft" && source.status !== "published")
    fail(
      `${path}.status`,
      "INVALID_SCHEMA",
      "Cần trạng thái draft hoặc published.",
    );
  if (source.orientation !== "white-up-green-front")
    fail(
      `${path}.orientation`,
      "INVALID_SCHEMA",
      "Giữ tâm trắng U ở trên, xanh lá F phía trước.",
    );
  const lessonId = id(source.id, `${path}.id`),
    slug = id(source.slug, `${path}.slug`);
  const prerequisiteIds = ids(
    source.prerequisiteIds,
    `${path}.prerequisiteIds`,
    32,
  );
  if (prerequisiteIds.includes(lessonId))
    fail(
      `${path}.prerequisiteIds`,
      "INVALID_PREREQUISITE",
      "Bài học không phụ thuộc chính nó.",
    );
  const objectives = Object.freeze(
    array(
      source.objectives,
      `${path}.objectives`,
      1,
      LESSON_LIMITS.objectives,
    ).map((input, index) => {
      const at = `${path}.objectives[${index}]`,
        value = object(input, at, ["id", "description"]);
      return Object.freeze({
        id: id(value.id, `${at}.id`),
        description: text(value.description, `${at}.description`),
      });
    }),
  );
  const objectiveIds = new Set(objectives.map((value) => value.id));
  if (objectiveIds.size !== objectives.length)
    fail(`${path}.objectives`, "DUPLICATE_ID", "ID mục tiêu không được lặp.");
  const initialState = state(source.initialState, `${path}.initialState`),
    finalState = state(source.finalState, `${path}.finalState`);
  let previous = serializeCubeState(initialState),
    totalMoves = 0;
  const covered = new Set<string>(),
    stepIds = new Set<string>();
  const steps = Object.freeze(
    array(source.steps, `${path}.steps`, 1, LESSON_LIMITS.steps).map(
      (input, index) => {
        const at = `${path}.steps[${index}]`,
          value = object(input, at, [
            "id",
            "title",
            "kind",
            "instructions",
            "objectiveIds",
            "algorithm",
            "before",
            "after",
          ]);
        const stepId = id(value.id, `${at}.id`);
        if (stepIds.has(stepId))
          fail(`${at}.id`, "DUPLICATE_ID", "ID bước không được lặp.");
        stepIds.add(stepId);
        if (value.kind !== "observe" && value.kind !== "moves")
          fail(`${at}.kind`, "INVALID_SCHEMA", "Cần bước observe hoặc moves.");
        const goals = ids(
          value.objectiveIds,
          `${at}.objectiveIds`,
          LESSON_LIMITS.objectives,
        );
        if (!goals.length)
          fail(
            `${at}.objectiveIds`,
            "UNKNOWN_OBJECTIVE",
            "Bước cần gắn với ít nhất một mục tiêu.",
          );
        for (const goal of goals) {
          if (!objectiveIds.has(goal))
            fail(
              `${at}.objectiveIds`,
              "UNKNOWN_OBJECTIVE",
              "Mục tiêu chưa khai báo trong bài.",
            );
          covered.add(goal);
        }
        const instructions = Object.freeze(
          array(value.instructions, `${at}.instructions`, 1, 16).map(
            (item, i) => text(item, `${at}.instructions[${i}]`),
          ),
        );
        if (
          typeof value.algorithm !== "string" ||
          value.algorithm.length > 2048
        )
          fail(
            `${at}.algorithm`,
            "INVALID_ALGORITHM",
            "Cần chuỗi thuật toán tối đa 2048 ký tự.",
          );
        let moves: CubeAlgorithm;
        try {
          moves = parseAlgorithm(value.algorithm);
        } catch {
          fail(
            `${at}.algorithm`,
            "INVALID_ALGORITHM",
            "Thuật toán phải hợp lệ toàn bộ theo grammar URFDLB hiện có.",
          );
        }
        if (
          moves.length > LESSON_LIMITS.movesPerStep ||
          (value.kind === "moves" && !moves.length) ||
          (value.kind === "observe" && moves.length)
        )
          fail(
            `${at}.algorithm`,
            "INVALID_ALGORITHM",
            "Bước moves cần 1–256 nước; observe phải có chuỗi rỗng.",
          );
        totalMoves += moves.length;
        if (totalMoves > LESSON_LIMITS.movesPerLesson)
          fail(
            `${path}.steps`,
            "INVALID_ALGORITHM",
            "Tổng số nước của bài vượt giới hạn.",
          );
        const before = state(value.before, `${at}.before`),
          after = state(value.after, `${at}.after`);
        if (serializeCubeState(before) !== previous)
          fail(
            `${at}.before`,
            "DISCONTINUOUS_STEPS",
            "Trạng thái trước phải khớp đầu bài hoặc kết quả bước trước.",
          );
        const expected = serializeCubeState(after);
        if (serializeCubeState(applyAlgorithm(before, moves)) !== expected)
          fail(
            `${at}.after`,
            "TRANSITION_MISMATCH",
            "Thuật toán không đưa khối từ before đến after đã khai báo.",
          );
        previous = expected;
        return Object.freeze({
          id: stepId,
          title: text(value.title, `${at}.title`),
          kind: value.kind,
          instructions,
          objectiveIds: goals,
          algorithm: serializeAlgorithm(moves),
          moves,
          before,
          after,
        });
      },
    ),
  );
  if (previous !== serializeCubeState(finalState))
    fail(
      `${path}.finalState`,
      "FINAL_STATE_MISMATCH",
      "Trạng thái kết bài không khớp bước cuối.",
    );
  if (covered.size !== objectiveIds.size)
    fail(
      `${path}.objectives`,
      "UNUSED_OBJECTIVE",
      "Mọi mục tiêu phải được ít nhất một bước đề cập.",
    );
  return Object.freeze({
    schemaVersion: 1,
    contentVersion: source.contentVersion as number,
    id: lessonId,
    slug,
    puzzleId: "3x3",
    status: source.status,
    title: text(source.title, `${path}.title`),
    summary: text(source.summary, `${path}.summary`),
    orientation: "white-up-green-front",
    prerequisiteIds,
    objectives,
    initialState,
    finalState,
    steps,
  });
}
export function parseLessonCatalog(input: unknown): readonly Lesson[] {
  const lessons = array(input, "lessons", 1, 100).map((value, index) =>
    parseLesson(value, `lessons[${index}]`),
  );
  const byId = new Map<string, Lesson>(),
    slugs = new Set<string>();
  for (const lesson of lessons) {
    if (byId.has(lesson.id))
      fail(`lessons.${lesson.id}`, "DUPLICATE_ID", "ID bài học bị lặp.");
    if (slugs.has(lesson.slug))
      fail(`lessons.${lesson.slug}`, "DUPLICATE_SLUG", "Slug bài học bị lặp.");
    byId.set(lesson.id, lesson);
    slugs.add(lesson.slug);
  }
  const visiting = new Set<string>(),
    visited = new Set<string>();
  const visit = (lesson: Lesson) => {
    if (visiting.has(lesson.id))
      fail(
        `lessons.${lesson.id}.prerequisiteIds`,
        "CYCLIC_PREREQUISITE",
        "Phụ thuộc bài học tạo vòng lặp.",
      );
    if (visited.has(lesson.id)) return;
    visiting.add(lesson.id);
    for (const id of lesson.prerequisiteIds) {
      const required = byId.get(id);
      if (!required)
        fail(
          `lessons.${lesson.id}.prerequisiteIds`,
          "INVALID_PREREQUISITE",
          "Bài học tiên quyết không tồn tại.",
        );
      if (lesson.status === "published" && required.status !== "published")
        fail(
          `lessons.${lesson.id}.prerequisiteIds`,
          "INVALID_PREREQUISITE",
          "Bài đã xuất bản không được phụ thuộc bài nháp.",
        );
      visit(required);
    }
    visiting.delete(lesson.id);
    visited.add(lesson.id);
  };
  for (const lesson of lessons) visit(lesson);
  return Object.freeze(lessons);
}
