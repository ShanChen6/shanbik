# 9.4 — Solution → player

A verified solver result can be explicitly loaded using **Nạp lời giải vào player**. Loading replaces the viewer and its previous queue/sequence with the exact manual-input snapshot captured by the solver. It starts paused at cursor 0; it does not autoplay. The input draft is retained.

The transfer validates physical feasibility, serialization identity, full move syntax, the 256-move limit and the solved endpoint again before changing any player state. Already-solved input has no artificial move or load action. Invalid results leave the current animation and queue untouched.

`loadSequence(moves, initial?)` atomically installs a frozen copy of an external baseline and sequence. Existing algorithm/scramble callers keep their current committed baseline. Old animation completion IDs cannot affect a replacement sequence. Forward and backward steps use the existing player; **Về đầu chuỗi** restores the captured input, while **Đặt lại khối** restores solved and clears playback.

The practice page owns the solver and player. Player state, active animation or playback changes invalidate a pending or displayed solver result; loading consumes that result. Camera movement does not invalidate it. Editing the manual input invalidates the solver result; an already loaded player sequence remains an independent snapshot until replaced or reset. Renderer unavailability disables loading, while color input and solving remain available.

A solution is a sequence of solving moves, not a CFOP lesson. No teaching stages are inferred from it.

## Verification

721 unit tests pass, including atomic replacement, stale animation IDs, every forward/backward prefix, solved endpoint, reset, reduced motion, rejection without mutation and controller result consumption. Format, lint, typecheck and production build pass.

Production Chromium 141 with the real cubing.js Worker: input a U-turn state, solve, explicitly load the one-move solution, step forward/backward, play, return to step 0, and reset. The result disappears after loading; the player remains usable. At 360px there is no horizontal overflow, and no page errors were observed. The player screenshot was visually checked. This is a functional check on desktop software WebGL, not a physical mobile or cross-browser performance test.
