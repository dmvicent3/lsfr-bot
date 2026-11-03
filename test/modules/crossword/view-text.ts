import { ComponentType } from "discord.js";

type Node = { type?: unknown; content?: unknown; components?: unknown; custom_id?: unknown };

const isNode = (c: unknown): c is Node => typeof c === "object" && c !== null;

const children = (c: Node): unknown[] => (Array.isArray(c.components) ? c.components : []);

/** Every component, depth first, as Discord counts them toward its 40. */
export function flatComponents(components: unknown[] = []): Node[] {
  return components.filter(isNode).flatMap((c) => [c, ...flatComponents(children(c))]);
}

/** The text of a Components V2 message: its text displays, one per line. */
export const viewText = (m?: { components?: unknown[] }): string =>
  flatComponents(m?.components)
    .flatMap((c) =>
      c.type === ComponentType.TextDisplay && typeof c.content === "string" ? [c.content] : [],
    )
    .join("\n");
