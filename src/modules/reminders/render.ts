import type { MessageCreateOptions, MessageMentionOptions } from "discord.js";
import { ButtonStyle, ComponentType } from "discord.js";
import { lateBy } from "./rules.ts";
import type { ButtonRow, DueMessage, ListMessage, Reminder } from "./types.ts";

const SNOOZES = [
  { minutes: 10, label: "+10 min" },
  { minutes: 60, label: "+1 h" },
];
const ROW_SIZE = 5;
/** Discord's message limit, with room for the line prefixes in listMessage. */
const LIST_TEXT_BUDGET = 1900;
const LIST_LINE_OVERHEAD = 60;
const MIN_LIST_TEXT = 20;

const stamp = (ms: number, style: "t" | "F" | "R"): string =>
  `<t:${Math.floor(ms / 1000)}:${style}>`;

const mention = (r: Reminder): string =>
  r.target.kind === "user" ? `<@${r.target.id}>` : `<@&${r.target.id}>`;

const forOther = (r: Reminder): boolean => r.target.kind === "role" || r.target.id !== r.authorId;

/** "3h", "1d 2h", "45m". */
export function span(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  const parts = [
    [Math.floor(minutes / 1440), "d"],
    [Math.floor(minutes / 60) % 24, "h"],
    [minutes % 60, "m"],
  ] as const;

  return parts
    .filter(([n]) => n > 0)
    .map(([n, unit]) => `${n}${unit}`)
    .join(" ");
}

function rows(buttons: ButtonRow["components"]): ButtonRow[] {
  const out: ButtonRow[] = [];

  for (let i = 0; i < buttons.length; i += ROW_SIZE) {
    out.push({ type: ComponentType.ActionRow, components: buttons.slice(i, i + ROW_SIZE) });
  }

  return out;
}

const button = (customId: string, label: string): ButtonRow["components"][number] => ({
  type: ComponentType.Button,
  custom_id: customId,
  label,
  style: ButtonStyle.Secondary,
});

export function confirmation(r: Reminder): string {
  const who = forOther(r) ? ` for ${mention(r)}` : "";

  return `⏰ ${stamp(r.dueAt, "R")} (${stamp(r.dueAt, "F")})${who}: ${r.text}`;
}

const clip = (text: string, max: number): string =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

function listLine(r: Reminder, n: number, max: number): string {
  const who = forOther(r) ? ` for ${mention(r)}` : "";

  return `**#${n}** ${stamp(r.dueAt, "R")}${who}: ${clip(r.text, max)}`;
}

export function listMessage(rs: Reminder[]): ListMessage {
  if (rs.length === 0) return { content: "You have no reminders.", components: [] };

  const max = Math.max(
    MIN_LIST_TEXT,
    Math.floor(LIST_TEXT_BUDGET / rs.length) - LIST_LINE_OVERHEAD,
  );

  return {
    content: rs.map((r, i) => listLine(r, i + 1, max)).join("\n"),
    components: rows(rs.map((r, i) => button(`reminders:cancel:${r.id}`, `Cancel #${i + 1}`))),
  };
}

/** The ping: only the target may be mentioned, whatever the text says. */
export function dueMessage(r: Reminder, now: number): DueMessage {
  const late = lateBy(r.dueAt, now);
  const notes = [
    ...(r.authorId === r.target.id ? [] : [` (set by <@${r.authorId}>)`]),
    ...(late === null ? [] : [` (late by ${span(late)})`]),
  ];
  const allowedMentions: MessageMentionOptions =
    r.target.kind === "user" ? { users: [r.target.id] } : { roles: [r.target.id] };
  const buttons = [
    ...SNOOZES.map((s) => button(`reminders:snooze:${r.id}:${s.minutes}`, s.label)),
    button(`reminders:done:${r.id}`, "Done"),
  ];

  return {
    content: `⏰ ${mention(r)}: ${r.text}${notes.join("")}`,
    components: rows(buttons),
    allowedMentions,
  };
}

/** The reminder sent to its author when its channel is gone; nothing in it pings. */
export function lostMessage(r: Reminder, guildName: string): MessageCreateOptions {
  return {
    content: `⏰ ${r.text}
-# Set in <#${r.channelId}> on **${guildName}**, where I can't post any more.`,
    allowedMentions: { parse: [] },
  };
}

export const snoozedNote = (dueAt: number): string => `💤 snoozed until ${stamp(dueAt, "t")}`;
