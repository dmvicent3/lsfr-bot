import { startBot } from "./core/client.ts";
import { loadConfig } from "./core/config.ts";
import { openDatabase, runMigrations } from "./core/db.ts";
import { createJev } from "./core/jev/queue.ts";
import type { BotModule } from "./core/types.ts";
import { guardProcess } from "./core/process.ts";
import { coreMigrations } from "./core/settings.ts";
import { chatModule } from "./modules/chat/index.ts";
import { helpModule } from "./modules/help/index.ts";
import { mangaModule } from "./modules/manga/index.ts";
import { minesweeperModule } from "./modules/minesweeper/index.ts";
import { motorsportModule } from "./modules/motorsport/index.ts";
import { remindersModule } from "./modules/reminders/index.ts";
import { rssModule } from "./modules/rss/index.ts";
import { fourModule } from "./modules/four/index.ts";
import { fleetModule } from "./modules/fleet/index.ts";
import { tictactoeModule } from "./modules/tictactoe/index.ts";
import { triviaModule } from "./modules/trivia/index.ts";
import { cardsModule } from "./modules/cards/index.ts";
import { shedModule } from "./modules/shed/index.ts";
import { sudokuModule } from "./modules/sudoku/index.ts";
import { duelModule } from "./modules/duel/index.ts";
import { llmAsk } from "./modules/crossword/ask.ts";
import { crosswordModule } from "./modules/crossword/index.ts";
import { dailiesModule } from "./modules/dailies/index.ts";
import { feedbackModule } from "./modules/feedback/index.ts";
import { feedbackTopics } from "./modules/feedback/topics.ts";
import { gridModule } from "./modules/grid/index.ts";
import { groupsModule } from "./modules/groups/index.ts";
import { snakeModule } from "./modules/snake/index.ts";
import { wordModule } from "./modules/word/index.ts";

guardProcess();
const config = loadConfig(process.env);
/**
 * One queue for every jev caller, so the Pi is never asked twice at once. Its back-off is shared
 * too: a jev failure in rss or chat (its "needs the web?" check) pauses the jevos games, and the
 * other way round; accepted, since jev failing for one caller means the Pi is struggling for all.
 */
const jev = config.jevUrl ? createJev({ url: config.jevUrl }) : null;
const features: BotModule[] = [
  motorsportModule,
  remindersModule,
  wordModule(),
  sudokuModule(),
  duelModule(),
  gridModule(),
  crosswordModule(llmAsk(config.llmUrl)),
  groupsModule(),
  snakeModule(),
  dailiesModule,
  minesweeperModule(),
  triviaModule(),
  cardsModule(),
  shedModule(),
  mangaModule(),
  ...(config.llmUrl
    ? [chatModule({ llmUrl: config.llmUrl, searchUrl: config.searchUrl, jev })]
    : []),
  ...(jev
    ? [rssModule(jev, config.embedUrl), tictactoeModule(jev), fourModule(jev), fleetModule(jev)]
    : []),
];
const modules = [...features, feedbackModule(feedbackTopics(features))];
const db = openDatabase(config.databasePath);
runMigrations(db, [...coreMigrations, ...modules.flatMap((m) => m.migrations ?? [])]);
await startBot([...modules, helpModule(modules)], config, db);
