import { describe, expect, test } from "bun:test";
import { checklist } from "../../../src/modules/dailies/checklist.ts";
import type { DailyEntry } from "../../../src/modules/dailies/types.ts";

/** 2026-11-03 15:48 UTC: 8h 12m to midnight in Lisbon (WET, UTC+0). */
const NOW = Date.UTC(2026, 10, 3, 15, 48);

const entry = (over: Partial<DailyEntry> = {}): DailyEntry => ({
  label: "Word #7",
  command: "word play",
  tz: "Europe/Lisbon",
  state: "todo",
  result: null,
  ...over,
});

const ids = new Map([["word", "123"]]);

describe("checklist", () => {
  test("title counts what is done, footer gives the shared reset", () => {
    const e = checklist("Dan", [entry({ state: "done", result: "130 pts" }), entry()], ids, NOW);
    expect(e.title).toBe("Dan's dailies · 1/2 done");
    expect(e.footer?.text).toBe("Next reset in 8h 12m");
  });

  test("done shows the result, started and todo link the command", () => {
    const e = checklist(
      "Dan",
      [
        entry({ state: "done", result: "130 pts" }),
        entry({ label: "Sudoku hard #1", command: "sudoku daily", state: "started" }),
        entry(),
      ],
      ids,
      NOW,
    );
    expect(e.description).toBe(
      [
        "✅ **Word #7** · 130 pts",
        "▶️ **Sudoku hard #1** · started · `/sudoku daily`",
        "⬜ **Word #7** · </word play:123>",
      ].join("\n"),
    );
  });

  test("all done is celebrated", () => {
    const e = checklist("Dan", [entry({ state: "done", result: "1 pts" })], ids, NOW);
    expect(e.title).toBe("Dan's dailies · 1/1 done 🎉");
  });

  test("mixed time zones put the reset on each open line and drop the footer", () => {
    const e = checklist(
      "Dan",
      [entry(), entry({ tz: "Asia/Tokyo", state: "done", result: "5 pts" })],
      ids,
      NOW,
    );
    const lines = e.description?.split("\n") ?? [];
    expect(e.footer).toBeUndefined();
    expect(lines[0]).toBe("⬜ **Word #7** · </word play:123> · resets in 8h 12m");
    expect(lines[1]).toBe("✅ **Word #7** · 5 pts");
  });
});
