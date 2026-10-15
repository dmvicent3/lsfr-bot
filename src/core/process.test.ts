import { expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import { guardProcess } from "./process.ts";

function fakeProcess() {
  const emitter = new EventEmitter();
  const exits: number[] = [];
  return Object.assign(emitter, { exits, exit: (code: number) => void exits.push(code) });
}

test("an unhandled rejection is logged, not fatal", () => {
  const proc = fakeProcess();
  guardProcess(proc);
  proc.emit("unhandledRejection", new Error("stray"));
  expect(proc.exits).toEqual([]);
});

test("an uncaught exception exits so Docker restarts the bot", () => {
  const proc = fakeProcess();
  guardProcess(proc);
  proc.emit("uncaughtException", new Error("boom"));
  expect(proc.exits).toEqual([1]);
});
