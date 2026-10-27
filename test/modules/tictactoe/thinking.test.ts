import { describe, expect, test } from "bun:test";
import { startThinking, stopThinking } from "../../../src/modules/tictactoe/thinking.ts";

describe("thinking", () => {
  test("one move per server at a time", () => {
    expect(startThinking("g")).toBe(true);
    expect(startThinking("g")).toBe(false);
    expect(startThinking("other")).toBe(true);
    stopThinking("g");
    stopThinking("other");
    expect(startThinking("g")).toBe(true);
    stopThinking("g");
  });
});
