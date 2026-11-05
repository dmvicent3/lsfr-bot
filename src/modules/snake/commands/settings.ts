import { zoneSettingsHandler } from "../../../core/zone-command.ts";
import { saveSnakeTimeZone } from "../settings.ts";
import type { CommandCtx } from "./types.ts";

export const settings = zoneSettingsHandler<CommandCtx>("snake", saveSnakeTimeZone);
