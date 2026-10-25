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
