import { describe, expect, it, vi } from "vitest";
import { applyAlgorithm, applyMove } from "../core/moves";
import { parseAlgorithm } from "../core/notation";
import { createMoveQueuePlayer } from "../viewer/move-queue";
import { rememberAlgorithm, submitAlgorithm } from "./session";

describe("algorithm input with the real player", () => {
  it.each(["R invalid U", "", " \n ", Array(257).fill("R").join(" ")])(
    "rejects %s without invoking the player",
    (text) => {
      const player = createMoveQueuePlayer();
      player.enqueue(parseAlgorithm("F B"));
      const before = player.getSnapshot();
      const play = vi.fn(() => true);
      expect(submitAlgorithm(text, play).accepted).toBe(false);
      expect(play).not.toHaveBeenCalled();
      expect(player.getSnapshot()).toBe(before);
    },
  );
  it("reports exact offsets and exposes no partial playback", () => {
    const result = submitAlgorithm("R\nBAD U", () => {
      throw Error("must not play");
    });
    expect(result.accepted).toBe(false);
    expect(result.issues[0]).toMatchObject({ start: 2, end: 5 });
  });
  it("replaces active and pending FIFO at the committed state; stale completion is inert", () => {
    const player = createMoveQueuePlayer();
    player.enqueue(parseAlgorithm("R U F"));
    player.complete(player.getSnapshot().active!.id);
    const committed = player.getSnapshot().state;
    const oldId = player.getSnapshot().active!.id;
    const result = submitAlgorithm(
      "L’\n D2",
      (moves) => player.loadSequence(moves) && player.play(),
    );
    expect(result).toMatchObject({ accepted: true, notation: "L' D2" });
    expect(player.getSnapshot().pending).toHaveLength(0);
    expect(player.getSnapshot().playback!.initial).toBe(committed);
    const before = player.getSnapshot();
    player.complete(oldId);
    expect(player.getSnapshot()).toBe(before);
    while (player.getSnapshot().active)
      player.complete(player.getSnapshot().active!.id);
    expect(player.getSnapshot().state).toEqual(
      applyAlgorithm(committed, parseAlgorithm("L' D2")),
    );
  });
  it("invalid input preserves active playback including cursor and baseline", () => {
    const player = createMoveQueuePlayer();
    player.loadSequence(parseAlgorithm("R U"));
    player.play();
    const before = player.getSnapshot();
    submitAlgorithm(
      "R ???",
      (moves) => player.loadSequence(moves) && player.play(),
    );
    expect(player.getSnapshot()).toBe(before);
  });
  it("replaces a backward transaction without applying its incomplete inverse", () => {
    const player = createMoveQueuePlayer();
    player.loadSequence(parseAlgorithm("R"));
    player.stepForward();
    player.complete(player.getSnapshot().active!.id);
    const committed = player.getSnapshot().state;
    player.stepBackward();
    const old = player.getSnapshot().active!.id;
    submitAlgorithm(
      "F",
      (moves) => player.loadSequence(moves) && player.play(),
    );
    player.complete(old);
    player.complete(player.getSnapshot().active!.id);
    expect(player.getSnapshot().state).toEqual(
      applyMove(committed, parseAlgorithm("F")[0]),
    );
  });
  it("accepts exactly 256 moves in reduced motion and restores the original baseline", () => {
    const player = createMoveQueuePlayer();
    player.setReducedMotion(true);
    const initial = player.getSnapshot().state;
    const text = Array(256).fill("R U'").join(" ");
    expect(submitAlgorithm(text, () => true).accepted).toBe(false);
    const valid = Array(256).fill("R").join("\n");
    expect(
      submitAlgorithm(
        valid,
        (moves) => player.loadSequence(moves) && player.play(),
      ).accepted,
    ).toBe(true);
    expect(player.getSnapshot().playback!.cursor).toBe(256);
    player.resetPlayback();
    expect(player.getSnapshot().state).toBe(initial);
  });
  it("returns a retryable failure when renderer callback refuses", () => {
    expect(submitAlgorithm("R", () => false).accepted).toBe(false);
  });
  it("keeps 20 immutable history entries newest first without modifying the old array", () => {
    const old = rememberAlgorithm([], "R", 1);
    let history = old;
    for (let id = 2; id <= 25; id++)
      history = rememberAlgorithm(history, "U", id);
    expect(history).toHaveLength(20);
    expect(history[0].id).toBe(25);
    expect(history[19].id).toBe(6);
    expect(old).toEqual([{ id: 1, notation: "R" }]);
    expect(Object.isFrozen(history)).toBe(true);
    expect(Object.isFrozen(history[0])).toBe(true);
  });
});
