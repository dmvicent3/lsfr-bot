import type { Router } from "./types.ts";
import type { BotModule, ComponentHandler, ModalHandler, SlashCommand } from "./types.ts";

function register<T extends { id: string }>(
  map: Map<string, T>,
  handlers: T[] | undefined,
  kind: string,
  moduleName: string,
): void {
  for (const handler of handlers ?? []) {
    if (map.has(handler.id)) {
      throw new Error(`Duplicate ${kind} "${handler.id}" in module ${moduleName}`);
    }

    map.set(handler.id, handler);
  }
}

/** Splits "<module>:<action>:<args...>" and finds the handler for "<module>:<action>". */
function lookup<T>(
  map: Map<string, T>,
  customId: string,
): { handler: T; args: string[] } | undefined {
  const [module, action, ...args] = customId.split(":");
  const handler = map.get(`${module}:${action}`);

  return handler ? { handler, args } : undefined;
}

export function buildRouter(modules: BotModule[]): Router {
  const commands = new Map<string, SlashCommand>();
  const components = new Map<string, ComponentHandler>();
  const modals = new Map<string, ModalHandler>();

  for (const module of modules) {
    for (const command of module.commands ?? []) {
      if (commands.has(command.data.name)) {
        throw new Error(`Duplicate command "${command.data.name}" in module ${module.name}`);
      }

      commands.set(command.data.name, command);
    }

    register(components, module.components, "component", module.name);
    register(modals, module.modals, "modal", module.name);
  }

  return {
    command: (name) => commands.get(name),
    component: (customId) => lookup(components, customId),
    modal: (customId) => lookup(modals, customId),
    commands: [...commands.values()],
  };
}
