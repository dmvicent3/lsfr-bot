import { expect, test } from "bun:test";
import { boardMessage } from "../../../src/modules/fleet/board-message.ts";
import { renderGame } from "../../../src/modules/fleet/render/board.ts";
import { playing } from "./fixtures.ts";

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

test("the board is one fleet.png replacing any previous picture, without the svg", () => {
  const v = { game: playing(), outcome: { kind: "playing" }, aiming: false } as const;
  const m = boardMessage(v);
  expect(m.files.map((f) => f.name)).toEqual(["fleet.png"]);
  expect([...(m.files[0]?.attachment.subarray(0, 8) ?? [])]).toEqual(SIGNATURE);
  expect(m.attachments).toEqual([]);
  expect("svg" in m).toBe(false);
  expect(m.embeds).toEqual(renderGame(v).embeds);
  expect(m.components).toEqual(renderGame(v).components);
});
