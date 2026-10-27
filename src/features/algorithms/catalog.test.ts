import { describe, expect, it } from "vitest";
import { FORMULAS, filterFormulas, validateCatalog, GROUPS } from "./catalog";
import {
  applyAlgorithm,
  createSolvedCubeState,
  invertAlgorithm,
  isCubeSolved,
  parseAlgorithm,
  serializeAlgorithm,
} from "../cube/core";
import { createMoveQueuePlayer } from "../cube/viewer/move-queue";
const sample = { ...FORMULAS[0] };
describe("algorithm catalog", () => {
  it("covers the five taxonomy groups, unique IDs and immutable normalized notation", () => {
    expect(new Set(FORMULAS.flatMap((f) => f.groups))).toEqual(
      new Set(Object.keys(GROUPS)),
    );
    expect(new Set(FORMULAS.map((f) => f.id)).size).toBe(FORMULAS.length);
    for (const f of FORMULAS) {
      expect(f.notation).toBe(serializeAlgorithm(parseAlgorithm(f.notation)));
      expect(Object.isFrozen(f.moves)).toBe(true);
      expect(Object.isFrozen(f.groups)).toBe(true);
      expect(Object.isFrozen(f)).toBe(true);
    }
    expect(
      validateCatalog([{ ...sample, notation: " R   U R′ U’ " }])[0].notation,
    ).toBe("R U R' U'");
  });
  it.each([
    null,
    [],
    [null],
    [sample, sample],
    [{ ...sample, id: "Invalid id" }],
    [{ ...sample, puzzle: "4x4" }],
    [{ ...sample, groups: ["f2l"] }],
    [{ ...sample, groups: ["cfop", "unknown"] }],
    [{ ...sample, groups: ["cfop", "cfop"] }],
    [{ ...sample, difficulty: "expert" }],
    [{ ...sample, name: " " }],
    [{ ...sample, aliases: [3] }],
    [{ ...sample, notes: "" }],
    [{ ...sample, notation: "r U R'" }],
    [{ ...sample, notation: " " }],
    [{ ...sample, notation: Array(257).fill("U").join(" ") }],
  ] as unknown[])("rejects invalid author data %#", (raw) => {
    expect(() => validateCatalog(raw)).toThrow();
  });
  it("searches accents, aliases, groups and notation with Unicode prime/spacing", () => {
    expect(
      filterFormulas(FORMULAS, "ca", "oll", "").map((f) => f.id),
    ).toContain("oll-sune");
    expect(
      filterFormulas(FORMULAS, "hoan vi chu T", "", "").map((f) => f.id),
    ).toEqual(["pll-t"]);
    expect(
      filterFormulas(FORMULAS, "R  U R′ U’", "beginner", "").map((f) => f.id),
    ).toContain("right-trigger");
    expect(filterFormulas(FORMULAS, "fish", "", "").map((f) => f.id)).toEqual([
      "oll-sune",
    ]);
    expect(filterFormulas(FORMULAS, "F2L", "", "").map((f) => f.id)).toEqual([
      "f2l-right-insert",
    ]);
  });
  it("combines group, difficulty, favorites, and empty states", () => {
    expect(
      filterFormulas(FORMULAS, "", "cfop", "advanced", ["pll-t"]),
    ).toHaveLength(1);
    expect(filterFormulas(FORMULAS, "", "beginner", "advanced")).toHaveLength(
      0,
    );
    expect(filterFormulas(FORMULAS, "", "", "", [])).toHaveLength(0);
    expect(filterFormulas(FORMULAS, "unknown-name", "", "")).toHaveLength(0);
  });
  it("last-layer samples preserve F2L, T has uniform U and Sune has oriented edges", () => {
    const solved = createSolvedCubeState();
    for (const id of ["oll-cross", "oll-sune", "pll-t"]) {
      const f = FORMULAS.find((f) => f.id === id)!;
      const before = applyAlgorithm(solved, invertAlgorithm(f.moves));
      expect(before.faces.D).toEqual(solved.faces.D);
      for (const face of ["R", "F", "L", "B"] as const)
        expect(before.faces[face].slice(3)).toEqual(
          solved.faces[face].slice(3),
        );
      if (id === "pll-t") expect(before.faces.U).toEqual(solved.faces.U);
      if (id === "oll-sune")
        for (const i of [1, 3, 5, 7])
          expect(before.faces.U[i]).toBe(solved.faces.U[i]);
    }
  });
  it.each([false, true])(
    "illustration starts at inverse case, solves and resets; reduced=%s",
    (reduced) => {
      for (const f of FORMULAS) {
        const before = applyAlgorithm(
          createSolvedCubeState(),
          invertAlgorithm(f.moves),
        );
        expect(isCubeSolved(before)).toBe(false);
        const p = createMoveQueuePlayer(before);
        p.loadSequence(f.moves, before);
        p.setReducedMotion(reduced);
        expect(p.getSnapshot().active).toBeNull();
        expect(p.getSnapshot().playback?.playing).toBe(false);
        p.play();
        while (p.getSnapshot().active) p.complete(p.getSnapshot().active!.id);
        expect(isCubeSolved(p.getSnapshot().state)).toBe(true);
        p.resetPlayback();
        expect(p.getSnapshot().state).toEqual(before);
      }
    },
  );
});
