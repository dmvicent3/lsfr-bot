import { describe, expect, test } from "bun:test";
import { renderGame } from "../../../src/modules/four/render/board.ts";
import { renderLeaderboard, renderStats } from "../../../src/modules/four/render/boards.ts";
import type { Board, GameView, Outcome } from "../../../src/modules/four/types.ts";
import { board } from "./fixtures.ts";

const view = (b: Board, extra: Partial<GameView> = {}): GameView => ({
  game: {
    guildId: "g",
    playerId: "u",
    channelId: "c",
    messageId: "m",
    board: b,
    first: "player",
    difficulty: "normal",
    startedAt: 0,
    updatedAt: 0,
  },
  outcome: { kind: "playing" },
  thinking: false,
  last: null,
  ...extra,
});

const text = (v: GameView): string => renderGame(v).embeds[0]?.description ?? "";

const buttons = (v: GameView) => renderGame(v).components.flatMap((r) => r.components);

const status = (extra: Partial<GameView>) =>
  text(view(board([]), extra))
    .split("\n")
    .at(-1);

describe("board message", () => {
  test("title, players, the grid and column numbers", () => {
    const msg = renderGame(view(board(["...R..."])));
    expect(msg.embeds[0]?.title).toBe("Four in a row — normal");
    const lines = text(view(board(["...R..."]))).split("\n");
    expect(lines[0]).toBe("<@u> 🔴 vs jevos 🟡");
    expect(lines[7]).toBe("⚪⚪⚪🔴⚪⚪⚪");
    expect(lines[8]).toBe("1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣");
    expect(lines.at(-1)).toBe("Your move.");
  });

  test("a winning line is drawn in squares", () => {
    const won: Outcome = { kind: "win", winner: "player", line: [35, 36, 37, 38] };
    const lines = text(view(board(["RRRRYYY"]), { outcome: won })).split("\n");
    expect(lines[7]).toBe("🟥🟥🟥🟥🟡🟡🟡");
    expect(lines.at(-1)).toBe("You win in 4 moves!");
  });

  test("jevos's last move, picked or guessed", () => {
    expect(text(view(board([]), { last: { col: 2, share: 0.4 } }))).toContain(
      "jevos played column 3",
    );
    expect(text(view(board([]), { last: { col: 2, share: null } }))).toContain(
      "jevos guessed column 3",
    );
  });

  test("status for each ending and while thinking", () => {
    expect(status({ thinking: true })).toBe("jevos is thinking…");
    expect(status({ outcome: { kind: "win", winner: "jevos", line: [] } })).toBe("jevos wins.");
    expect(status({ outcome: { kind: "draw" } })).toBe("Draw — the board is full.");
    expect(status({ outcome: { kind: "resigned" } })).toBe("You resigned.");
    expect(status({ outcome: { kind: "abandoned" } })).toBe("Abandoned.");
  });

  test("seven column buttons and Resign; full columns, thinking and the end disable them", () => {
    const full = board(["R......", "Y......", "R......", "Y......", "R......", "Y......"]);
    const bs = buttons(view(full));
    expect(bs.map((b) => b.custom_id)).toEqual([
      "four:drop:1",
      "four:drop:2",
      "four:drop:3",
      "four:drop:4",
      "four:drop:5",
      "four:drop:6",
      "four:drop:7",
      "four:resign",
    ]);
    expect(bs.map((b) => b.disabled)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(buttons(view(full, { thinking: true })).every((b) => b.disabled)).toBe(true);
    expect(buttons(view(full, { outcome: { kind: "draw" } })).every((b) => b.disabled)).toBe(true);
    expect(renderGame(view(full, { outcome: { kind: "abandoned" } })).components).toEqual([]);
  });
});

describe("boards", () => {
  test("stats per difficulty, with and without a best win", () => {
    const none = { wins: 0, losses: 0, draws: 0, best: null };
    const out = renderStats("u", {
      easy: none,
      normal: { wins: 1, losses: 2, draws: 0, best: 7 },
      hard: none,
    });
    expect(out).toContain("## 🔴 Four in a row — stats for <@u>");
    expect(out).toContain("Normal: **1** W · **2** L · **0** D · best win: 7 moves");
    expect(out).toContain("Easy: **0** W · **0** L · **0** D · best win: —");
  });

  test("leaderboard rows and the empty board", () => {
    const range = { from: "", to: "", label: "this week" };
    const page = renderLeaderboard({
      range,
      list: [{ userId: "a", points: 9, wins: 3 }],
      page: 1,
      viewerId: "a",
    });
    expect(page.content).toContain("## 🔴 Four in a row — this week");
    expect(page.content).toContain("**1.** <@a> — 9 pts (3 wins)");
    expect(renderLeaderboard({ range, list: [], page: 1, viewerId: "a" }).content).toContain(
      "No wins yet. Start with `/four play`.",
    );
  });
});
