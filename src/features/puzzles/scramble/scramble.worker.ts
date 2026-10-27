import { randomScrambleForEvent } from "cubing/scramble";
import { setSearchDebug } from "cubing/search";
import {
  isScramblePuzzle,
  SCRAMBLE_EVENTS,
  type ScrambleResponse,
} from "./protocol";
import { validateScramble } from "./validate";
setSearchDebug({ logPerf: false, scramblePrefetchLevel: "none" });
self.onmessage = async (event: MessageEvent<unknown>) => {
  const data = event.data as { type?: unknown; id?: unknown; puzzle?: unknown };
  if (
    !data ||
    data.type !== "scramble" ||
    !Number.isSafeInteger(data.id) ||
    !isScramblePuzzle(data.puzzle)
  )
    return;
  const id = data.id as number;
  let response: ScrambleResponse;
  try {
    const alg = await randomScrambleForEvent(SCRAMBLE_EVENTS[data.puzzle]);
    response = {
      type: "scramble",
      id,
      ok: true,
      scramble: validateScramble(data.puzzle, alg.toString()),
    };
  } catch {
    response = { type: "scramble", id, ok: false };
  }
  self.postMessage(response);
};
