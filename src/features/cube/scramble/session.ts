import type { CubeAlgorithm } from "../core/notation";
import { generatePracticeScramble, type PracticeScramble } from "./generate";

type ScrambleSnapshot = Readonly<{
  id: number;
  scramble: PracticeScramble;
  applied: boolean;
}> | null;

/** Presentation state only; the queue remains the sole owner of puzzle state. */
export function createScrambleSession(generate = generatePracticeScramble) {
  let snapshot: ScrambleSnapshot = null;
  let serial = 0;
  let applying = false;
  const listeners = new Set<() => void>();
  const publish = (next: ScrambleSnapshot) => {
    snapshot = next;
    listeners.forEach((notify) => notify());
  };
  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: (): ScrambleSnapshot => null,
    subscribe(notify: () => void) {
      listeners.add(notify);
      return () => {
        listeners.delete(notify);
      };
    },
    generate() {
      const scramble = generate(); // Failure preserves the previous displayed scramble.
      publish(Object.freeze({ id: ++serial, scramble, applied: false }));
    },
    apply(enqueue: (moves: CubeAlgorithm) => boolean) {
      if (!snapshot || snapshot.applied || applying) return false;
      const current = snapshot;
      applying = true;
      try {
        if (!enqueue(current.scramble.moves)) return false;
        // A queue listener may have generated a different scramble during enqueue.
        if (snapshot === current)
          publish(Object.freeze({ ...current, applied: true }));
        return true;
      } finally {
        applying = false;
      }
    },
  };
}
