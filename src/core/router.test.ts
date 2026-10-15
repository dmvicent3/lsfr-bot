import { describe, expect, test } from "bun:test";
import type { BotModule, ComponentHandler, SlashCommand } from "./module.ts";
import { buildRouter } from "./router.ts";

const noop = async (): Promise<void> => {};

function command(name: string): SlashCommand {
  return { data: { name, description: name }, execute: noop };
}

function component(id: string): ComponentHandler {
  return { id, handle: noop };
}

describe("buildRouter", () => {
  test("routes a component by module:action and returns the rest as args", () => {
    const remind = component("motorsport:remind");
    const router = buildRouter([{ name: "motorsport", components: [remind] }]);
    expect(router.component("motorsport:remind:f1:chinese-grand-prix")).toEqual({
      handler: remind,
      args: ["f1", "chinese-grand-prix"],
    });
  });

  test("returns undefined for an unknown component", () => {
    const router = buildRouter([{ name: "m", components: [component("m:a")] }]);
    expect(router.component("m:b:x")).toBeUndefined();
  });

  test("looks up commands by name", () => {
    const help = command("help");
    const router = buildRouter([{ name: "help", commands: [help] }]);
    expect(router.command("help")).toBe(help);
    expect(router.commands).toEqual([help]);
  });

  test("rejects duplicate command names", () => {
    const modules: BotModule[] = [
      { name: "a", commands: [command("x")] },
      { name: "b", commands: [command("x")] },
    ];
    expect(() => buildRouter(modules)).toThrow(/x/);
  });
});
