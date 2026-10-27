export const MEGAMINX_ROWS = 7;
export const MEGAMINX_ROW_LENGTH = 11;
/**
 * WCA 12d scramble notation: R++/R--/D++/D-- turn everything except one face
 * by two fifths, U/U' turn the top face. A scramble has seven rows of ten
 * alternating R/D moves (starting with R) followed by U or U'.
 */
export function parseMegaminxScramble(text: string): string[][] {
  if (typeof text !== "string" || text.length > 1024)
    throw Error("Invalid Megaminx scramble");
  const tokens = text.trim().split(/\s+/);
  if (tokens.length !== MEGAMINX_ROWS * MEGAMINX_ROW_LENGTH)
    throw Error("Invalid Megaminx scramble");
  const rows: string[][] = [];
  for (let r = 0; r < MEGAMINX_ROWS; r++) {
    const row = tokens.slice(
      r * MEGAMINX_ROW_LENGTH,
      (r + 1) * MEGAMINX_ROW_LENGTH,
    );
    row.forEach((token, i) => {
      const ok =
        i === MEGAMINX_ROW_LENGTH - 1
          ? token === "U" || token === "U'"
          : token === `${i % 2 ? "D" : "R"}++` ||
            token === `${i % 2 ? "D" : "R"}--`;
      if (!ok) throw Error("Invalid Megaminx scramble");
    });
    rows.push(row);
  }
  return rows;
}
