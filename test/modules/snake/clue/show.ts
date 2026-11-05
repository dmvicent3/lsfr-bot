import type { Tile } from "../../../../src/modules/snake/types.ts";

const letter = (t: Tile): string => {
  if (t.colour === "green") return t.letter.toUpperCase();

  return t.colour === "yellow" ? `${t.letter}?` : t.letter;
};

/**
 * Tiles as text: green upper case, yellow `x?`, dark lower case; `=` joins a bar, `(` and `)` are
 * the start and end caps. `(E=X c u s E)` is EXCUSE against EXAMPLE.
 */
export const show = (tiles: Tile[]): string =>
  tiles
    .map((t, k) => {
      const body = `${t.capStart ? "(" : ""}${letter(t)}${t.capEnd ? ")" : ""}`;

      return k === tiles.length - 1 ? body : `${body}${t.joinNext ? "=" : " "}`;
    })
    .join("");
