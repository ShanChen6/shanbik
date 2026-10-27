import { cubingEngine } from "./cubing-engine";
import { createSolverRuntime } from "./runtime";
const handle = createSolverRuntime(cubingEngine);
self.onmessage = async (event: MessageEvent<unknown>) => {
  const response = await handle(event.data);
  if (response) self.postMessage(response);
};
