import type { PingInput, PingPayload } from "./types.ts";
import { type APIStringSelectComponent, ComponentType } from "discord.js";
import type { SchedulePayload } from "../channels/types.ts";
import { timestamp } from "../format.ts";
import type { EventSchedule, SeriesInfo, Session } from "../types.ts";

const MAX_SELECT_OPTIONS = 25;

/**
 * The private picker opened by "Remind me…": a multi-select of the event's upcoming pinged
 * sessions with the viewer's current reminders ticked. Submitting sets exactly that selection.
 */
export function renderReminderPicker(
  info: SeriesInfo,
  event: EventSchedule,
  selected: ReadonlySet<string>,
  now: number,
): SchedulePayload {
  const upcoming = event.sessions
    .filter((s) => s.pingable && s.start.getTime() > now)
    .slice(0, MAX_SELECT_OPTIONS);

  if (upcoming.length === 0) {
    return { content: "No upcoming sessions to remind about.", components: [] };
  }

  return {
    content: `Pick the ${info.name} ${event.eventName} sessions to ping you about (this weekend only):`,
    components: [
      {
        type: ComponentType.ActionRow,
        components: [reminderSelect(info, event, upcoming, selected)],
      },
    ],
  };
}

function reminderSelect(
  info: SeriesInfo,
  event: EventSchedule,
  upcoming: Session[],
  selected: ReadonlySet<string>,
): APIStringSelectComponent {
  return {
    type: ComponentType.StringSelect,
    custom_id: `motorsport:reminders:${info.key}:${event.eventId}`,
    placeholder: "No reminders",
    min_values: 0,
    max_values: upcoming.length,
    options: upcoming.map((s) => ({
      label: s.title,
      value: s.sessionId,
      description: s.start.toUTCString().slice(0, 22) + " UTC",
      default: selected.has(s.sessionId),
    })),
  };
}

export function renderPing(p: PingInput): PingPayload | null {
  const users = p.oneOffUserIds.filter((id) => !p.roleMemberIds.has(id));
  const roles = p.roleHasMembers ? [p.roleId] : [];

  if (roles.length === 0 && users.length === 0) return null;

  const mentions = [...roles.map((id) => `<@&${id}>`), ...users.map((id) => `<@${id}>`)];
  const { eventName, title, start } = p.session;

  return {
    content: `${mentions.join(" ")} 🏁 ${eventName} ${title} starts ${timestamp(start, "R")}`,
    allowedMentions: { roles, users },
  };
}
