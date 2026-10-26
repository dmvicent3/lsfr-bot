import type { PickerView } from "./types.ts";
import {
  type APIActionRowComponent,
  type APIComponentInMessageActionRow,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import type { SchedulePayload } from "../channels/types.ts";
import { isComplete, nameIn } from "./predictions.ts";
import { timestamp } from "../format.ts";

type Row = APIActionRowComponent<APIComponentInMessageActionRow>;

const MAX_SELECT_OPTIONS = 25;
const MAX_SWITCHES = 5;
const POSITIONS = ["P1", "P2", "P3"] as const;

/**
 * The private podium picker: one select per position, the viewer's picks preselected, and
 * a button for each other open session this weekend.
 */
export function renderPredictPicker(view: PickerView): SchedulePayload {
  const { info, eventName, session } = view;

  return {
    content: `🔮 **${info.name} ${eventName} ${session.title}** podium · locks ${timestamp(session.start, "R")}\n${pickStatus(view)}`,
    components: [...positionSelects(view), ...sessionSwitches(view)],
  };
}

function pickStatus({ picks, grid }: PickerView): string {
  if (!isComplete(picks)) return "Pick all three to enter.";

  const names = picks.map((id) => nameIn(grid, id)).join(" · ");

  return `✅ Entered: ${names}. Change any time before the start.`;
}

function positionSelects({ info, session, grid, picks }: PickerView): Row[] {
  const drivers = grid.slice(0, MAX_SELECT_OPTIONS);

  return POSITIONS.map((label, index) => ({
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.StringSelect,
        custom_id: `motorsport:predict:${info.key}:${session.eventId}:${session.sessionId}:${index}`,
        placeholder: label,
        options: drivers.map((d) => ({
          label: d.name,
          value: d.id,
          default: picks[index] === d.id,
        })),
      },
    ],
  }));
}

function sessionSwitches({ info, others }: PickerView): Row[] {
  if (others.length === 0) return [];

  const buttons = others.slice(0, MAX_SWITCHES).map((s) => ({
    type: ComponentType.Button as const,
    custom_id: `motorsport:predictmenu:${info.key}:${s.eventId}:${s.sessionId}`,
    label: `Predict the ${s.title}`,
    style: ButtonStyle.Secondary as const,
  }));

  return [{ type: ComponentType.ActionRow, components: buttons }];
}
