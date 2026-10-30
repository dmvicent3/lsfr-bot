import type { Database } from "bun:sqlite";
import { AskedStore } from "./asked.ts";
import { ButtonPickStore } from "./button-picks.ts";
import { RecordStore } from "./records.ts";
import { ReportStore } from "./reports.ts";
import { ScoreStore } from "./scores.ts";
import { SessionStore } from "./sessions.ts";
import { TopicPickStore } from "./topic-picks.ts";

/** The trivia tables, one store each. */
export class TriviaRepo {
  readonly sessions: SessionStore;
  readonly asked: AskedStore;
  readonly scores: ScoreStore;
  readonly records: RecordStore;
  readonly reports: ReportStore;
  readonly topicPicks: TopicPickStore;
  readonly buttonPicks: ButtonPickStore;

  constructor(db: Database) {
    this.sessions = new SessionStore(db);
    this.asked = new AskedStore(db);
    this.scores = new ScoreStore(db);
    this.records = new RecordStore(db);
    this.reports = new ReportStore(db);
    this.topicPicks = new TopicPickStore(db);
    this.buttonPicks = new ButtonPickStore(db);
  }
}
