import { expect, test } from "bun:test";
import { emptyBoard } from "../../../src/modules/four/board.ts";
import { columnFacts } from "../../../src/modules/four/facts.ts";
import { forcedColumns } from "../../../src/modules/four/forced.ts";
import { board } from "./fixtures.ts";

const fact = (rows: string[], col: number, start: string): string | undefined =>
  columnFacts(board(rows), "Y", col)
    .split("\n")
    .find((l) => l.startsWith(start));

test("the first line names the column, how far from the centre, and the row", () => {
  expect(columnFacts(emptyBoard(), "Y", 0).split("\n")[0]).toBe(
    "Column 1 (3 from the centre), lands on row 1 of 6 from the bottom",
  );
  expect(columnFacts(board(["...R..."]), "Y", 3).split("\n")[0]).toBe(
    "Column 4 (centre), lands on row 2 of 6 from the bottom",
  );
});

test("each fact on a position made for it", () => {
  expect(fact(["YYY.RR."], 3, "- Dropping here gives Yellow four")).toEndWith(": yes");
  expect(fact(["RRR.YY."], 3, "- Dropping here gives Yellow four")).toEndWith(": no");
  expect(fact(["RRR.YY."], 3, "- Dropping here stops Red's")).toEndWith(": yes");
  expect(fact(["YY..R.R"], 2, "- Dropping here makes three")).toEndWith(": yes");
  expect(fact(["YY..R.R"], 6, "- Dropping here makes three")).toEndWith(": no");
  expect(fact(["..YY.RR"], 1, "- Dropping here gives Yellow two ways")).toEndWith(": yes");
  expect(fact(["YY..R.R"], 2, "- Dropping here gives Yellow two ways")).toEndWith(": no");
  expect(fact(["RRR....", "YRY.YR."], 3, "- After it, Red can win")).toEndWith(": yes");
  expect(fact(["RRR....", "YRY.YR."], 6, "- After it, Red can win")).toEndWith(": no");
});

test("a win beats a block, a block beats nothing", () => {
  expect(forcedColumns(board(["......Y", "......Y", "RRR...Y"]), "Y")).toEqual([6]);
  expect(forcedColumns(board(["RRR...."]), "Y")).toEqual([3]);
  expect(forcedColumns(emptyBoard(), "Y")).toEqual([]);
});
