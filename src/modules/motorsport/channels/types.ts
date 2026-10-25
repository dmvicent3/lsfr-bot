import type { SeriesInfo, Session } from "../types.ts";
import type { Forecast } from "../weather/types.ts";
import type {
  APIActionRowComponent,
  APIComponentInMessageActionRow,
  NewsChannel,
  TextChannel,
} from "discord.js";

/** The series channel; admins may turn it into an announcement channel, which still works. */
export type SeriesChannel = TextChannel | NewsChannel;

/** Forecasts keyed by `eventId/sessionId`. */
export type WeatherMap = ReadonlyMap<string, Forecast>;

/** Complete predictions per session id of the shown event. */
export type PredictionCounts = ReadonlyMap<string, number>;

export interface SchedulePayload {
  content: string;
  components: APIActionRowComponent<APIComponentInMessageActionRow>[];
}

export interface PingInput {
  info: SeriesInfo;
  session: Session;
  roleId: string;
  roleHasMembers: boolean;
  roleMemberIds: ReadonlySet<string>;
  oneOffUserIds: string[];
}

export interface PingPayload {
  content: string;
  allowedMentions: { roles: string[]; users: string[] };
}
