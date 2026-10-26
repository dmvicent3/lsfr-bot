import { describe, expect, test } from "bun:test";
import { freshRepo } from "./fixtures.ts";

describe("UnnumberedStore", () => {
  test("ids, add and prune of older rows only", () => {
    const repo = freshRepo();
    repo.unnumbered.add("c1", 100);
    repo.unnumbered.add("c2", 300);
    repo.unnumbered.add("c2", 400);
    expect(repo.unnumbered.ids()).toEqual(new Set(["c1", "c2"]));
    expect(repo.unnumbered.prune(200)).toBe(1);
    expect(repo.unnumbered.ids()).toEqual(new Set(["c2"]));
  });
});
