import type { Router } from "./types.ts";
import type { BotModule, ComponentHandler, SlashCommand } from "./types.ts";

export function buildRouter(modules: BotModule[]): Router {
  const commands = new Map<string, SlashCommand>();
  const components = new Map<string, ComponentHandler>();

  for (const module of modules) {
    for (const command of module.commands ?? []) {
      if (commands.has(command.data.name)) {
        throw new Error(`Duplicate command "${command.data.name}" in module ${module.name}`);
      }

      commands.set(command.data.name, command);
    }

    for (const handler of module.components ?? []) {
      if (components.has(handler.id)) {
        throw new Error(`Duplicate component "${handler.id}" in module ${module.name}`);
      }

      components.set(handler.id, handler);
    }
  }

  return {
    command: (name) => commands.get(name),
    component(customId) {
      const [module, action, ...args] = customId.split(":");
      const handler = components.get(`${module}:${action}`);

      return handler ? { handler, args } : undefined;
    },
    commands: [...commands.values()],
  };
}
