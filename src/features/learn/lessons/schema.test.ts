import { describe, expect, it } from "vitest";
import { applyAlgorithm } from "../../cube/core/moves";
import { serializeCubeState } from "../../cube/core/serialization";
import { MAX_QUEUE_MOVES } from "../../cube/viewer/move-queue";
import { PUZZLES } from "../../encyclopedia/catalog";
import { getLesson, getPublishedLessons, LESSONS } from "./catalog";
import { SAMPLE_LESSON_SOURCE } from "./sample";
import {
  LESSON_LIMITS,
  LessonValidationError,
  parseLesson,
  parseLessonCatalog,
  type LessonIssueCode,
} from "./schema";
const sample = () => structuredClone(SAMPLE_LESSON_SOURCE);
function rejected(input: unknown, code: LessonIssueCode, path?: string) {
  try {
    parseLesson(input);
    throw Error("Expected rejection");
  } catch (error) {
    expect(error).toBeInstanceOf(LessonValidationError);
    const issue = (error as LessonValidationError).issue;
    expect(issue.code).toBe(code);
    if (path) expect(issue.path).toBe(path);
    expect(Object.isFrozen(issue)).toBe(true);
  }
}
describe("lesson schema and verified sample", () => {
  it("compiles the sample, with explicit before/after fixtures and an observation step", () => {
    const lesson = parseLesson(sample());
    expect(lesson.steps.map((step) => step.moves.length)).toEqual([0, 1, 1]);
    for (const step of lesson.steps)
      expect(serializeCubeState(applyAlgorithm(step.before, step.moves))).toBe(
        serializeCubeState(step.after),
      );
    expect(serializeCubeState(lesson.initialState)).toBe(
      serializeCubeState(lesson.finalState),
    );
    expect(LESSON_LIMITS.movesPerStep).toBe(MAX_QUEUE_MOVES);
  });
  it("freezes all compiled arrays, moves and state snapshots without freezing authoring input", () => {
    const source = sample();
    const lesson = parseLesson(source);
    expect(Object.isFrozen(lesson)).toBe(true);
    expect(Object.isFrozen(lesson.steps[1].moves[0])).toBe(true);
    expect(Object.isFrozen(lesson.steps[0].before.faces.U)).toBe(true);
    expect(Object.isFrozen(lesson.steps[0].instructions)).toBe(true);
    source.steps[0].instructions[0] = "changed";
    source.objectives[0].description = "changed";
    expect(lesson.steps[0].instructions[0]).not.toBe("changed");
    expect(lesson.objectives[0].description).not.toBe("changed");
  });
  it("normalizes prime aliases and whitespace but does not rewrite fixture states", () => {
    const source = sample();
    source.steps[2].algorithm = "  U′\n";
    const lesson = parseLesson(source);
    expect(lesson.steps[2].algorithm).toBe("U'");
    expect(serializeCubeState(lesson.steps[1].after)).toBe(
      source.steps[1].after,
    );
  });
  it("allows a lesson ending at a legitimate unsolved intermediate state", () => {
    const source = sample();
    source.steps = source.steps.slice(0, 2);
    source.finalState = source.steps[1].after;
    source.objectives = source.objectives.slice(0, 1);
    expect(parseLesson(source).steps).toHaveLength(2);
  });
  it("does not publish a route or advertise step lessons just because schema exists", () => {
    expect(LESSONS).toHaveLength(1);
    expect(getLesson("lam-quen-u-va-u-prime")).toBe(LESSONS[0]);
    expect(getLesson("missing")).toBeUndefined();
    expect(getPublishedLessons()).toEqual([]);
    expect(
      PUZZLES.every(
        (p) =>
          p.capabilities.lessons.status === "unavailable" &&
          !p.relatedLessons.length,
      ),
    ).toBe(true);
  });
  it.each([
    ["schemaVersion", 2, "INVALID_SCHEMA"],
    ["contentVersion", 0, "INVALID_SCHEMA"],
    ["contentVersion", 1.5, "INVALID_SCHEMA"],
    ["id", "../escape", "INVALID_ID"],
    ["slug", "UPPER", "INVALID_ID"],
    ["puzzleId", "2x2", "UNSUPPORTED_PUZZLE"],
    ["status", "ready", "INVALID_SCHEMA"],
    ["orientation", "arbitrary", "INVALID_SCHEMA"],
    ["title", "  ", "INVALID_SCHEMA"],
    ["summary", "x".repeat(2001), "INVALID_SCHEMA"],
    ["steps", [], "INVALID_SCHEMA"],
    ["objectives", [], "INVALID_SCHEMA"],
    ["initialState", "invalid", "INVALID_STATE"],
  ] as const)("rejects invalid top-level %s (%#)", (key, value, code) => {
    const source = { ...sample(), [key]: value };
    rejected(source, code);
  });
  it("rejects unknown fields and malformed inputs with actionable paths", () => {
    rejected({ ...sample(), extra: true }, "INVALID_SCHEMA", "lesson.extra");
    rejected(null, "INVALID_SCHEMA", "lesson");
    rejected([], "INVALID_SCHEMA", "lesson");
    const source = sample();
    (source.steps[0] as unknown as Record<string, unknown>).alg = "U";
    rejected(source, "INVALID_SCHEMA", "lesson.steps[0].alg");
  });
  it("rejects impossible physical states before applying moves", () => {
    const source = sample(),
      letters = source.initialState.split("");
    [letters[7], letters[19]] = [letters[19], letters[7]];
    source.initialState = letters.join("");
    rejected(source, "INFEASIBLE_STATE", "lesson.initialState");
  });
  it("rejects a valid but discontinuous starting state", () => {
    const source = sample();
    source.steps[1].before = source.steps[1].after;
    rejected(source, "DISCONTINUOUS_STEPS", "lesson.steps[1].before");
  });
  it("rejects an incorrect expected after-state instead of computing one to pass", () => {
    const source = sample();
    source.steps[1].after = source.initialState;
    rejected(source, "TRANSITION_MISMATCH", "lesson.steps[1].after");
  });
  it("requires the final fixture to match the last transition", () => {
    const source = sample();
    source.finalState = source.steps[1].after;
    rejected(source, "FINAL_STATE_MISMATCH", "lesson.finalState");
  });
  it.each(["R bad U", "Rw", "x", "(R U)2", "U3"])(
    "rejects the full invalid algorithm %s",
    (algorithm) => {
      const source = sample();
      source.steps[1].algorithm = algorithm;
      rejected(source, "INVALID_ALGORITHM", "lesson.steps[1].algorithm");
    },
  );
  it("distinguishes observe from moves without fake moves", () => {
    const source = sample();
    source.steps[0].algorithm = "U";
    rejected(source, "INVALID_ALGORITHM");
    const other = sample();
    other.steps[1].algorithm = " ";
    rejected(other, "INVALID_ALGORITHM");
  });
  it("enforces step and algorithm bounds", () => {
    const source = sample();
    source.steps[1].algorithm = Array(257).fill("U").join(" ");
    rejected(source, "INVALID_ALGORITHM");
    rejected(
      { ...sample(), steps: Array(33).fill(sample().steps[0]) },
      "INVALID_SCHEMA",
    );
  });
  it("accepts exactly the queue bound but rejects a lesson exceeding its total move budget", () => {
    const source = sample();
    const step = {
      ...source.steps[1],
      id: "repeat-u",
      algorithm: Array(256).fill("U").join(" "),
      before: source.initialState,
      after: source.initialState,
      objectiveIds: source.objectives.map((goal) => goal.id),
    };
    source.steps = [step];
    expect(parseLesson(source).steps[0].moves).toHaveLength(256);
    source.steps = Array.from({ length: 9 }, (_, index) => ({
      ...step,
      id: `repeat-${index}`,
    }));
    rejected(source, "INVALID_ALGORITHM", "lesson.steps");
  });
  it("requires unique and covered objective references", () => {
    const source = sample();
    source.steps[1].objectiveIds = ["missing"];
    rejected(source, "UNKNOWN_OBJECTIVE");
    const duplicate = sample();
    duplicate.objectives[1].id = duplicate.objectives[0].id;
    rejected(duplicate, "DUPLICATE_ID");
    const unused = sample();
    unused.objectives.push({ id: "unused", description: "not covered" });
    rejected(unused, "UNUSED_OBJECTIVE");
    const repeated = sample();
    repeated.steps[1].id = repeated.steps[0].id;
    rejected(repeated, "DUPLICATE_ID");
  });
});
describe("lesson catalog prerequisite integrity", () => {
  it("accepts acyclic prerequisites and looks them up by stable ID", () => {
    const first = sample(),
      second = {
        ...sample(),
        id: "second",
        slug: "second",
        prerequisiteIds: [first.id],
      };
    const catalog = parseLessonCatalog([first, second]);
    expect(catalog).toHaveLength(2);
    expect(Object.isFrozen(catalog)).toBe(true);
  });
  it.each([
    "duplicate-id",
    "duplicate-slug",
    "missing",
    "self",
    "cycle",
    "published-needs-draft",
  ])("rejects %s", (kind) => {
    const first = sample(),
      second = {
        ...sample(),
        id: "second",
        slug: "second",
        prerequisiteIds: [] as string[],
      };
    if (kind === "duplicate-id") second.id = first.id;
    if (kind === "duplicate-slug") second.slug = first.slug;
    if (kind === "missing") second.prerequisiteIds = ["missing"];
    if (kind === "self") second.prerequisiteIds = [second.id];
    if (kind === "cycle") {
      first.prerequisiteIds = [second.id];
      second.prerequisiteIds = [first.id];
    }
    if (kind === "published-needs-draft") {
      second.status = "published";
      second.prerequisiteIds = [first.id];
    }
    expect(() => parseLessonCatalog([first, second])).toThrow(
      LessonValidationError,
    );
  });
});
