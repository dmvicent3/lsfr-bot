import { expect, test } from "bun:test";
import { userName } from "../../../../src/modules/feedback/script/poll-state.ts";

test("user names: display name, username, fallback", () => {
  expect(userName({ global_name: "Alice", username: "alice" }, "1")).toBe("Alice");
  expect(userName({ global_name: null, username: "alice" }, "1")).toBe("alice");
  expect(userName(null, "1")).toBe("1");
});
