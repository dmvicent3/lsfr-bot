import type { Database } from "bun:sqlite";
import type { SeriesKey } from "./types.ts";
import { FollowedStore } from "./store/followed.ts";
import { PingStore } from "./store/pings.ts";
import { PredictionStore } from "./store/predictions.ts";
import { ReminderStore } from "./store/reminders.ts";
import { ResultStore } from "./store/results.ts";
import { RulingStore } from "./store/rulings.ts";
import { SessionStore } from "./store/sessions.ts";
import { ThreadStore } from "./store/threads.ts";
import { WeatherStore } from "./store/weather.ts";

/** The motorsport tables, one store each, plus what spans several of them. */
export class MotorsportRepo {
  readonly followed: FollowedStore;
  readonly sessions: SessionStore;
  readonly reminders: ReminderStore;
  readonly pings: PingStore;
  readonly weather: WeatherStore;
  readonly results: ResultStore;
  readonly predictions: PredictionStore;
  readonly threads: ThreadStore;
  readonly rulings: RulingStore;

  constructor(private readonly db: Database) {
    this.followed = new FollowedStore(db);
    this.sessions = new SessionStore(db);
    this.reminders = new ReminderStore(db);
    this.pings = new PingStore(db);
    this.weather = new WeatherStore(db);
    this.results = new ResultStore(db);
    this.predictions = new PredictionStore(db);
    this.threads = new ThreadStore(db);
    this.rulings = new RulingStore(db);
  }

  deleteSeries(s: SeriesKey): void {
    this.db.transaction(() => {
      this.db.run("DELETE FROM motorsport_followed WHERE series = ?", [s]);
      this.db.run("DELETE FROM motorsport_one_off WHERE series = ?", [s]);
      // Keep the sent markers (a re-follow must not re-ping); the messages went with the channel.
      this.db.run("UPDATE motorsport_sent_pings SET message_id = NULL WHERE series = ?", [s]);
    })();
  }
}
