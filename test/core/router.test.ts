import { describe, expect, test } from "bun:test";
import type {
  BotModule,
  ComponentHandler,
  ModalHandler,
  SlashCommand,
} from "../../src/core/types.ts";
import { buildRouter } from "../../src/core/router.ts";

const noop = async (): Promise<void> => {};

function command(name: string): SlashCommand {
  return { data: { name, description: name }, execute: noop };
}

function component(id: string): ComponentHandler {
  return { id, handle: noop };
}

function modal(id: string): ModalHandler {
  return { id, handle: noop };
}

describe("buildRouter", () => {
  test("routes a modal by module:action and returns the rest as args", () => {
    const guess = modal("x:y");
    const router = buildRouter([{ name: "x", modals: [guess] }]);
    expect(router.modal("x:y:a:b")).toEqual({ handler: guess, args: ["a", "b"] });
    expect(router.modal("x:z")).toBeUndefined();
  });

  test("rejects duplicate modal ids", () => {
    const modules: BotModule[] = [
      { name: "a", modals: [modal("x:y")] },
      { name: "b", modals: [modal("x:y")] },
    ];
    expect(() => buildRouter(modules)).toThrow(/x:y/);
  });

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
