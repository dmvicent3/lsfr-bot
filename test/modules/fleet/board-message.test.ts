import { expect, test } from "bun:test";
import { ComponentType, MessageFlags } from "discord.js";
import { boardMessage } from "../../../src/modules/fleet/board-message.ts";
import { EMBED_COLOR, renderGame } from "../../../src/modules/fleet/render/board.ts";
import type { GameView } from "../../../src/modules/fleet/render/types.ts";
import { flatComponents, viewText } from "../crossword/view-text.ts";
import { playing } from "./fixtures.ts";

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

const v: GameView = { game: playing(), outcome: { kind: "playing" }, aiming: false };

test("the board is one fleet.png replacing any previous picture, without the svg", () => {
  const m = boardMessage(v);
  expect(m.files.map((f) => f.name)).toEqual(["fleet.png"]);
  expect([...(m.files[0]?.attachment.subarray(0, 8) ?? [])]).toEqual(SIGNATURE);
  expect(m.attachments).toEqual([]);
  expect("svg" in m).toBe(false);
  expect(m.components).toEqual(renderGame(v).components);
});

test("Components V2, clearing an old embed board's content and embeds, pinging no one", () => {
  const m = boardMessage(v);
  expect(m.flags).toBe(MessageFlags.IsComponentsV2);
  expect(m.content).toBeNull();
  expect(m.embeds).toEqual([]);
  expect(m.allowedMentions).toEqual({ parse: [] });
});

test("a container with the title, the text and the picture, then the controls", () => {
  const [box, ...rows] = boardMessage(v).components;
  expect(box).toEqual({
    type: ComponentType.Container,
    accent_color: EMBED_COLOR,
    components: [
      { type: ComponentType.TextDisplay, content: "### 🚢 Hidden fleet" },
      expect.objectContaining({ type: ComponentType.TextDisplay }),
      {
        type: ComponentType.MediaGallery,
        items: [{ media: { url: "attachment://fleet.png" } }],
      },
    ],
  });
  expect(rows.map((r) => r.type)).toEqual(Array(5).fill(ComponentType.ActionRow));
  expect(viewText(boardMessage(v))).toContain("<@u> vs jevos · normal");
});

test("every board fits Discord's 40 components", () => {
  const placing = playing({ phase: "placing", player: { ships: [], shots: [] } });
  const counts = [{ ...v, game: placing }, v, { ...v, outcome: { kind: "resigned" } } as const].map(
    (b) => flatComponents(boardMessage(b).components).length,
  );
  expect(counts).toEqual([36, 31, 4]);

  for (const n of counts) expect(n).toBeLessThanOrEqual(40);
});
