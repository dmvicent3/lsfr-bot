import {
  type APIActionRowComponent,
  type APIStringSelectComponent,
  ComponentType,
} from "discord.js";

export type TopicState =
  | { state: "open" }
  | { state: "chosen"; topic: string }
  | { state: "timeout" };

const PLACEHOLDER: Record<TopicState["state"], (s: TopicState) => string> = {
  open: () => "Choose the next topic",
  chosen: (s) => `Next topic: ${s.state === "chosen" ? s.topic : ""}`,
  timeout: () => "No pick — random topic",
};

/** The sole survivor's topic menu; disabled once chosen or timed out. */
export function topicSelect(
  sessionId: number,
  topics: string[],
  s: TopicState,
): APIActionRowComponent<APIStringSelectComponent>[] {
  const select: APIStringSelectComponent = {
    type: ComponentType.StringSelect,
    custom_id: `trivia:topic:${sessionId}`,
    placeholder: PLACEHOLDER[s.state](s),
    options: topics.map((t) => ({ label: t.slice(0, 100), value: t.slice(0, 100) })),
    disabled: s.state !== "open",
  };

  return [{ type: ComponentType.ActionRow, components: [select] }];
}
