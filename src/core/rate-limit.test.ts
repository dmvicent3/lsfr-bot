import { expect, test } from "bun:test";
import { rejectRenameRateLimit } from "./rate-limit.ts";

test("only channel edits fail fast on a rate limit", () => {
  expect(rejectRenameRateLimit({ method: "PATCH", route: "/channels/:id" })).toBe(true);
  expect(rejectRenameRateLimit({ method: "POST", route: "/channels/:id/messages" })).toBe(false);
  expect(rejectRenameRateLimit({ method: "PATCH", route: "/guilds/:id" })).toBe(false);
});
