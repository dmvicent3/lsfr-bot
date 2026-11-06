import type { ChipMenu, LockPhase, PickerView } from "./types.ts";
import {
  type APIActionRowComponent,
  type APIComponentInMessageActionRow,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import type { SchedulePayload } from "../channels/types.ts";
import { isComplete, nameIn } from "./predictions.ts";
import { timestamp } from "../format.ts";
import { chipSelect } from "./chip-select.ts";

type Row = APIActionRowComponent<APIComponentInMessageActionRow>;

const MAX_SELECT_OPTIONS = 25;
const MAX_SWITCHES = 5;
const POSITIONS = ["P1", "P2", "P3"] as const;

const LOCKS: Record<LockPhase["phase"], string> = {
  session: "locks",
  weekend: "weekend locks",
  lateswap: "🔁 Late Swap · locks",
};

const UNTIL: Record<LockPhase["phase"], string> = {
  session: "before the start",
  weekend: "before the weekend locks",
  lateswap: "before the race starts",
};

/**
 * The private podium picker: one select per position, the viewer's picks preselected, a
 * button for each other open session this weekend and, in F1, the chip select until the lock.
 */
export function renderPredictPicker(view: PickerView): SchedulePayload {
  const { info, eventName, session, lock, chips } = view;
  const head = `🔮 **${info.name} ${eventName} ${session.title}** podium · ${LOCKS[lock.phase]} ${timestamp(lock.at, "R")}`;
  const chipRows = chips?.options ? [chipSelect(view, chips.options)] : [];

  return {
    content: [head, pickStatus(view), ...chipStatus(chips)].join("\n"),
    components: [...positionSelects(view), ...sessionSwitches(view), ...chipRows],
  };
}

function pickStatus({ picks, grid, lock }: PickerView): string {
  if (!isComplete(picks)) return "Pick all three to enter.";

  const names = picks.map((id) => nameIn(grid, id)).join(" · ");

  return `✅ Entered: ${names}. Change any time ${UNTIL[lock.phase]}.`;
}

function chipStatus(chips: ChipMenu | null): string[] {
  if (!chips) return [];

  if (chips.options) return chips.label ? [`Chip: ${chips.label}, until the weekend locks.`] : [];

  return [chips.label ? `Chip: ${chips.label} (locked in).` : "No chip this weekend."];
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
