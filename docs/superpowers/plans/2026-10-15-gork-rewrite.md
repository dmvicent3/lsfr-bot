# Gork Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Python bot with a Bun + TypeScript bot made of a small core and three modules: motorsport, chat and help.

**Architecture:** `src/core` holds the client, router, db, scheduler, settings, llm and config. Each feature lives in `src/modules/<name>` and exports one `BotModule`. Motorsport logic is pure (sources, rules, time, decisions, rendering) and is called from thin Discord adapters (channels, jobs, commands).

**Tech Stack:** Bun 1.4.3, TypeScript 7 (`tsc --noEmit`), oxlint + oxlint-tsgolint, oxfmt, `bun:test`, `bun:sqlite`, `Bun.cron`, discord.js 14.27.

**Spec:** `docs/superpowers/specs/2026-10-15-gork-rewrite-design.md`

## Global Constraints

- Runtime dependency: `discord.js` only. Dev dependencies: `typescript@7`, `oxlint`, `oxlint-tsgolint`, `oxfmt`, `@types/bun`. Don't add any other package.
- `bun run check` = `oxfmt --check . && oxlint --type-aware && tsc --noEmit && bun test`. It must pass at the end of every task.
- tsconfig: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `module: "Preserve"`, `moduleResolution: "bundler"`, `types: ["bun"]`, `noEmit`.
- oxlint: categories `correctness` and `suspicious` = error; plugins `typescript`, `unicorn`, `import`, `promise`.
- Pure files (`sources/*`, `rules.ts`, `time.ts`, `decisions.ts`, `render.ts`, `lead.ts`) must not import `discord.js` at runtime. Type-only imports are allowed in `render.ts`.
- Tests live next to the code as `*.test.ts`.
- Times are Unix milliseconds in SQLite and `Date` in TypeScript. All times are UTC.
- Module tables are prefixed with the module name. Component custom IDs use `<module>:<action>[:<arg>...]`.
- Series keys: `f1 wec wrc indycar motogp fe f2 f3`.
- Commit messages: conventional prefix, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- After each task, move its card on `C:\Users\Utilizador\Documents\Obsidian Vault\Gork\Gork Kanban.md`.

## Review Focus

1. **A session moved after its ping was sent:** the bot must not ping it again. The sent-ping key is `eventId/sessionId` and is kept forever (Task 6, `sessionsToPing` test "already-sent key is skipped even if start moved").
2. **A source 404s for next year, or returns malformed JSON:** next year's 404 means no events, and malformed JSON keeps the old cache (Task 9 tests).
3. **A tick that runs longer than a minute (slow Discord API):** jobs must not overlap (Task 2, `nonOverlapping` test).
4. **A follow or rename racing the rename limit:** never rename twice within 5 minutes (Task 6, `shouldRename` tests).
5. **An event with no pingable sessions, or an off-season:** the pinned message must still render, with no empty select menu (Task 7 tests).

---

### Task 1: Scaffold the Bun project and remove Python

**Files:**
- Delete: `app.py`, `utils.py`, `deps.txt`, `public/f1sessions.json`
- Create: `package.json`, `tsconfig.json`, `.oxlintrc.json`, `.oxfmtrc.json`, `.env.example`, `src/smoke.test.ts`, `AGENTS.md`
- Modify: `.gitignore` (add `node_modules/`, `data/`, `.env`)

**Interfaces:**
- Produces: the `bun run check` script and the `fmt` / `lint` / `typecheck` / `test` scripts.

- [ ] **Step 1:** `git rm app.py utils.py deps.txt public/f1sessions.json`
- [ ] **Step 2:** Run `bun init -y`, keep only `package.json`, `tsconfig.json` and `.gitignore` changes, and set `"type": "module"` and `"private": true`. Then run `bun add discord.js@14.27.0` and `bun add -d typescript@7 oxlint oxlint-tsgolint oxfmt @types/bun`.
- [ ] **Step 3:** Write the tsconfig and oxlint settings from Global Constraints. In `.oxfmtrc.json`, ignore `docs/` and `**/fixtures/**`.
- [ ] **Step 4:** Add the scripts `fmt` = `oxfmt .`, `lint` = `oxlint --type-aware`, `typecheck` = `tsc --noEmit`, `test` = `bun test`, `check` = the Global Constraints chain, and `start` = `bun src/index.ts`.
- [ ] **Step 5:** Write `src/smoke.test.ts` with `test("bun test runs", () => expect(1 + 1).toBe(2))`.
- [ ] **Step 6:** Write `.env.example` listing `DISCORD_TOKEN=`, `DISCORD_GUILD_ID=`, `GEMINI_API_KEY=`, `GEMINI_MODEL=gemini-3.5-flash` and `DATABASE_PATH=./data/gork.db`.
- [ ] **Step 7:** Load the `writing-for-agents` skill, then write `AGENTS.md`. It should cover:
  - what Gork is;
  - `bun run check` must pass before anything counts as done;
  - the `BotModule` contract and the rule for adding a module (a folder plus one line in `src/index.ts`);
  - the pure/adapter split;
  - table and custom-ID prefixes;
  - pointers to the spec and plan;
  - the vault kanban board path.
- [ ] **Step 8:** Run `bun run check` and expect it to pass, with 1 test.
- [ ] **Step 9:** Commit with `chore: scaffold bun project, remove python bot`.

### Task 2: Core: config, logging, db, settings, scheduler

**Files:**
- Create: `src/core/config.ts`, `src/core/log.ts`, `src/core/db.ts`, `src/core/settings.ts`, `src/core/scheduler.ts`, `src/core/module.ts`
- Test: `src/core/config.test.ts`, `src/core/db.test.ts`, `src/core/settings.test.ts`, `src/core/scheduler.test.ts`

**Interfaces:**
- Produces:
  - `config.ts`: `interface Config { discordToken: string; guildId: string; geminiApiKey: string; geminiModel: string; databasePath: string }`, `loadConfig(env: Record<string, string | undefined>): Config`, which throws `ConfigError` naming every missing variable. `databasePath` defaults to `./data/gork.db`.
  - `log.ts`: `log.info(scope: string, msg: string)` and `log.error(scope: string, msg: string, err?: unknown)`, written to stdout/stderr as `[ISO time] [scope] msg`.
  - `db.ts`: `interface Migration { id: string; sql: string }`, `openDatabase(path: string): Database`, which creates the parent directory, sets `PRAGMA journal_mode = WAL` and creates the `migrations` table, and `runMigrations(db: Database, migrations: Migration[]): void`, which applies each unapplied ID in order inside a transaction.
  - `settings.ts`: `coreMigrations: Migration[]` (the `settings` table), `getSetting(db, key): string | null` and `setSetting(db, key, value: string): void`.
  - `scheduler.ts`: `safely(scope: string, fn: () => Promise<void>): Promise<void>` (catches and logs), `nonOverlapping(fn: () => Promise<void>): () => Promise<void>` (skips a call while the previous one is running), and `startJobs(entries: { module: string; job: Job }[], ctx: Ctx): void`, which uses `Bun.cron(job.cron, ...)` wrapped in `nonOverlapping` + `safely` and calls `run` once right away when `runOnStart` is set.
  - `module.ts`: the types below.

```ts
import type { AutocompleteInteraction, ChatInputCommandInteraction, Client, ClientEvents,
  MessageComponentInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";
import type { Database } from "bun:sqlite";
export interface Ctx { client: Client; db: Database; config: Config }
export interface SlashCommand {
  data: RESTPostAPIChatInputApplicationCommandsJSONBody;
  execute(i: ChatInputCommandInteraction, ctx: Ctx): Promise<void>;
  autocomplete?(i: AutocompleteInteraction, ctx: Ctx): Promise<void>;
}
export interface ComponentHandler { id: string; /* "<module>:<action>" */ handle(i: MessageComponentInteraction, args: string[], ctx: Ctx): Promise<void> }
export interface EventHandler { event: keyof ClientEvents; handle(ctx: Ctx, ...args: unknown[]): Promise<void> }
export interface Job { name: string; cron: string; runOnStart?: boolean; run(ctx: Ctx): Promise<void> }
export interface BotModule { name: string; commands?: SlashCommand[]; components?: ComponentHandler[]; events?: EventHandler[]; jobs?: Job[]; migrations?: Migration[] }
```

- [ ] **Step 1: Write the failing tests**
  - `config.test.ts`: `loadConfig({})` throws, and the message contains `DISCORD_TOKEN`, `DISCORD_GUILD_ID`, `GEMINI_API_KEY` and `GEMINI_MODEL`. A full env without `DATABASE_PATH` gives `databasePath === "./data/gork.db"`.
  - `db.test.ts`: on `new Database(":memory:")`, running `runMigrations` twice with `[{ id: "t-001", sql: "CREATE TABLE t (x)" }]` doesn't throw, `migrations` has 1 row, and a failing migration leaves no row and no table.
  - `settings.test.ts`: `getSetting(db, "a")` is `null`. After `setSetting(db, "a", "1")` and then `setSetting(db, "a", "2")`, it returns `"2"`.
  - `scheduler.test.ts`:
    - `safely` resolves when fn throws.
    - `nonOverlapping`: call the wrapped fn twice without awaiting, where fn awaits a promise you resolve by hand. The inner fn runs once. After it resolves, a third call runs it again.
- [ ] **Step 2:** Run `bun test src/core` and expect it to fail (modules not found).
- [ ] **Step 3:** Implement the files using the interfaces above.
- [ ] **Step 4:** Run `bun run check` and expect it to pass.
- [ ] **Step 5:** Commit with `feat(core): config, db, settings, scheduler, module types`.

### Task 3: Core: router, client, LLM

**Files:**
- Create: `src/core/router.ts`, `src/core/client.ts`, `src/core/llm.ts`
- Test: `src/core/router.test.ts`, `src/core/llm.test.ts`

**Interfaces:**
- Consumes: Task 2 types.
- Produces:
  - `router.ts`: `buildRouter(modules: BotModule[]): Router`, where `Router = { command(name: string): SlashCommand | undefined; component(customId: string): { handler: ComponentHandler; args: string[] } | undefined; commands: SlashCommand[] }`. `component` splits on `:`, looks up `parts[0] + ":" + parts[1]` and returns `parts.slice(2)` as args. It throws on a duplicate command name or component ID.
  - `client.ts`: `startBot(modules: BotModule[], config: Config, db: Database): Promise<Client>`. It:
    - creates a `Client` with intents Guilds, GuildMessages, MessageContent and GuildMembers;
    - on `ClientReady`, registers `router.commands.map(c => c.data)` with `rest.put(Routes.applicationGuildCommands(appId, guildId))` and calls `startJobs`;
    - routes `interactionCreate` (chat input, autocomplete, message component) through `safely`, and on a handler error replies ephemerally with `"Something went wrong: <error message>"` (using `followUp` if already replied or deferred);
    - binds each module's `events`;
    - logs in.
  - `llm.ts`: `generate(prompt: string, opts: { apiKey: string; model: string; fetchFn?: typeof fetch }): Promise<string>`. It POSTs to `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` with header `x-goog-api-key` and body `{ contents: [{ role: "user", parts: [{ text: prompt }] }] }`, and returns all `candidates[0].content.parts[].text` joined. It throws `LlmError` with the status and body text if the response isn't OK or has no text.

- [ ] **Step 1: Write the failing tests**
  - `router.test.ts`:
    - `component("motorsport:remind:f1:chinese-grand-prix")` returns the handler with ID `motorsport:remind` and args `["f1", "chinese-grand-prix"]`.
    - An unknown ID returns `undefined`.
    - Two modules both defining command `x` makes `buildRouter` throw.
  - `llm.test.ts`, with a fake `fetchFn`:
    - The request URL ends with `/models/m1:generateContent` and has header `x-goog-api-key: k`.
    - The response `{ candidates: [{ content: { parts: [{ text: "a" }, { text: "b" }] } }] }` gives `"ab"`.
    - A 404 rejects with `LlmError`, and `{ candidates: [] }` rejects with `LlmError`.
- [ ] **Step 2:** Run `bun test src/core` and expect the new tests to fail.
- [ ] **Step 3:** Implement `router.ts`, `llm.ts` and `client.ts`. `client.ts` is an adapter and has no unit test.
- [ ] **Step 4:** Run `bun run check` and expect it to pass.
- [ ] **Step 5:** Commit with `feat(core): router, discord client, gemini client`.

### Task 4: Motorsport: series, types, source parsers

**Files:**
- Create: `src/modules/motorsport/types.ts`, `series.ts`, `sources/titles.ts`, `sources/tunous.ts`, `sources/sportstimes.ts`, `sources/fetch.ts`
- Create fixtures (snapshot today's 2026 files):
  - `sources/fixtures/tunous-{formula1,wec,wrc}.json` from `https://raw.githubusercontent.com/Tunous/MotorsportCalendar/main/data/<path>/2026.json`
  - `sources/fixtures/st-{f2,f3,fe,indycar,motogp}.json` from `https://raw.githubusercontent.com/sportstimes/f1/main/_db/<s>/2026.json`
- Test: `sources/tunous.test.ts`, `sources/sportstimes.test.ts`, `sources/fetch.test.ts`

**Interfaces:**
- Produces:

```ts
// types.ts
export type SeriesKey = "f1" | "wec" | "wrc" | "indycar" | "motogp" | "fe" | "f2" | "f3";
export interface ParsedSession { series: SeriesKey; eventId: string; eventName: string; sessionId: string; title: string; start: Date; end: Date; significant: boolean }
export interface Session extends Omit<ParsedSession, "significant"> { pingable: boolean }
export interface EventSchedule { eventId: string; eventName: string; sessions: Session[] } // sessions sorted by start
export class SourceFormatError extends Error {}
// series.ts
export interface SeriesInfo { key: SeriesKey; name: string; source: "tunous" | "sportstimes"; path: string }
export const SERIES: readonly SeriesInfo[]; // order: f1, wec, wrc, indycar, motogp, fe, f2, f3
export function seriesInfo(key: SeriesKey): SeriesInfo;
export function isSeriesKey(s: string): s is SeriesKey;
```

  - Names and paths:

| key | name | source | path |
|---|---|---|---|
| f1 | F1 | tunous | formula1 |
| wec | WEC | tunous | wec |
| wrc | WRC | tunous | wrc |
| indycar | IndyCar | sportstimes | indycar |
| motogp | MotoGP | sportstimes | motogp |
| fe | Formula E | sportstimes | fe |
| f2 | F2 | sportstimes | f2 |
| f3 | F3 | sportstimes | f3 |

  - `parseTunous(series: SeriesKey, json: unknown): ParsedSession[]`
    - Expects an array of events `{ id, title, isCancelled, stages: [{ id, title, startDate, endDate, isSignificant }] }`.
    - Skips cancelled events, and throws `SourceFormatError` on a wrong shape or a bad date.
    - `significant` = `isSignificant`.
  - `parseSportstimes(series: SeriesKey, json: unknown): ParsedSession[]`
    - Expects `{ races: [{ name, slug, sessions: Record<string, string> }] }`.
    - `eventId` = `slug`, `eventName` = `name`, `sessionId` = the session key, `title` = `sessionTitle(key)`.
    - `end` = start + `defaultDurationMs(key)`, and `significant` = false.
  - `titles.ts`:
    - `sessionTitle(key: string): string`, using the map `fp1→Practice 1, fp2→Practice 2, practice→Practice, practice1..8→Practice N, FinalPractice→Final Practice, qualifying→Qualifying, qualifying1→Qualifying, qualifying2→Qualifying 2, sprint→Sprint, feature→Feature Race, race→Race, gp→Race, warmup→Warm Up`. Anything else is split on camelCase and digits and capitalised.
    - `defaultDurationMs(key: string): number` gives 2h for `race | feature | gp` and 1h otherwise.
  - `fetch.ts`: `fetchSeries(info: SeriesInfo, year: number, fetchFn?: typeof fetch): Promise<ParsedSession[]>`. It builds the URL from the table above, returns `[]` on a 404, throws on any other non-OK status, and parses with the matching parser.

- [ ] **Step 1: Write the failing tests** (`f` = parsed fixture, matching sessions by `eventId` and `sessionId`)
  - **Tunous F1:** `chinese-grand-prix` has session IDs `practice-1, sprint-qualification, sprint-race, qualifying, race`, `significant` is false only for `practice-1`, and no session belongs to a cancelled event. Count the cancelled events in the fixture (there are 2) and assert that none of their IDs appear.
  - **Tunous WEC:** `6-hours-of-imola/practice-1` has start `2026-04-17T08:15:00Z` and end `2026-04-17T09:45:00Z`, and eventName is `6 Hours of Imola`.
  - **Tunous WRC:** `wrc-rallye-monte-carlo-2026/ss1` has start `2026-01-22T15:05:00Z`.
  - **Tunous invalid input:** `parseTunous("f1", [{ id: 1 }])` and `parseTunous("f1", { a: 1 })` throw `SourceFormatError`.
  - **Sportstimes MotoGP:** event `Thailand`:
    - `qualifying1` has title `Qualifying` and start `2026-02-28T03:50:00Z`;
    - `qualifying2` has title `Qualifying 2`;
    - `race` ends 2h after its start (`2026-03-01T10:00:00Z`).
  - **Sportstimes FE:** `sao-paulo-eprix/qualifying` starts `2025-12-06T12:40:00Z` and ends 1h later.
  - **Sportstimes invalid input:** `parseSportstimes("f2", { races: [{ name: "x", slug: "x", sessions: { race: "nope" } }] })` throws `SourceFormatError`.
  - **fetch:**
    - A fake fetch returning 404 gives `[]`.
    - A 500 rejects.
    - A 200 with the F1 fixture body returns the parsed sessions, and the URL is `https://raw.githubusercontent.com/Tunous/MotorsportCalendar/main/data/formula1/2026.json`.
- [ ] **Step 2:** Run `bun test src/modules/motorsport/sources` and expect it to fail.
- [ ] **Step 3:** Implement the files using the interfaces above.
- [ ] **Step 4:** Run `bun run check` and expect it to pass.
- [ ] **Step 5:** Commit with `feat(motorsport): series list and schedule source parsers`.

### Task 5: Motorsport: ping rules and countdown time

**Files:**
- Create: `src/modules/motorsport/rules.ts`, `src/modules/motorsport/time.ts`
- Test: `rules.test.ts`, `time.test.ts`

**Interfaces:**
- Consumes: `ParsedSession`, `Session`, `SeriesKey` (Task 4).
- Produces:
  - `applyRules(sessions: ParsedSession[]): Session[]`, which sets `pingable` per series:
    - f1: `sessionId ∈ {sprint-qualification, sprint-race, qualifying, race}`
    - wec: `significant`
    - wrc: per event, group the stages whose `sessionId` matches `/^s?ss\d+$/` by the UTC date of `start`; only the earliest stage on each date is pingable
    - f2, f3: `{qualifying, sprint, feature}`
    - fe: `{qualifying, race}`
    - indycar: `{qualifying, race}`
    - motogp: `{qualifying1, sprint, race}`
  - `formatCountdown(ms: number): string`:
    - more than 48h: `${floor(ms / 1d)}d`
    - more than 1h up to 48h: `${floor(ms / 1h)}h`
    - 0 < ms ≤ 1h: `${ceil(ms / 10min) * 10}m`
  - `slugify(s: string): string`: lowercase, runs of non-`[a-z0-9]` become `-`, leading and trailing `-` trimmed.
  - `channelName(series: SeriesKey, sessions: Session[], now: Date): string`:
    - a live session (`start ≤ now < end`, earliest start wins) gives `${series}・🔴-${slugify(title)}-live`;
    - otherwise the next session with `start > now` gives `${series}・${slugify(title)}-${formatCountdown(start - now)}`;
    - otherwise `${series}・off-season`.

- [ ] **Step 1: Write the failing tests** (rules tests run `applyRules` over the parsed fixtures)
  - **Rules, F1** `chinese-grand-prix`: pingable = `sprint-qualification, sprint-race, qualifying, race`.
  - **Rules, WEC** Imola: practice 1–3 not pingable; `qualifying-lmgt3`, `hyperpole-hypercar` and `race` pingable.
  - **Rules, WRC** Monte Carlo:
    - `shakedown`, `start` and `ss2` not pingable;
    - `ss1` (Jan 22) and `ss4` (first stage on Jan 23) pingable;
    - exactly one pingable stage per UTC date that has stages.
  - **Rules, MotoGP** Thailand: pingable = `qualifying1, sprint, race`.
  - **Rules, FE** `sao-paulo-eprix`: pingable = `qualifying, race`.
  - **Rules, IndyCar:** no `practice*`, `warmup` or `FinalPractice` session is pingable in the whole fixture.
  - **Rules, F2:** every `feature` is pingable and every `practice` is not.
  - **formatCountdown:**

| input | expected |
|---|---|
| 72h | `3d` |
| 49h | `2d` |
| 48h | `48h` |
| 14h 59m | `14h` |
| 61m | `1h` |
| 60m | `60m` |
| 31m | `40m` |
| 1s | `10m` |

  - **channelName:**
    - one session `Qualifying` starting in 2d 1h gives `f1・qualifying-2d`;
    - now inside a session titled `Sprint Qualification` gives `f1・🔴-sprint-qualification-live`;
    - all sessions in the past gives `f1・off-season`;
    - overlapping live sessions pick the earliest start.
- [ ] **Step 2:** Run the tests and expect them to fail.
- [ ] **Step 3:** Implement both files.
- [ ] **Step 4:** Run `bun run check` and expect it to pass.
- [ ] **Step 5:** Commit with `feat(motorsport): ping rules and channel countdown`.

### Task 6: Motorsport: decisions and lead time

**Files:**
- Create: `src/modules/motorsport/decisions.ts`, `src/modules/motorsport/lead.ts`
- Test: `decisions.test.ts`, `lead.test.ts`

**Interfaces:**
- Consumes: `Session`, `EventSchedule`.
- Produces:
  - `decisions.ts`:
    - `RENAME_MIN_INTERVAL_MS = 300_000`
    - `shouldRename(current: string | null, desired: string, renamedAt: number | null, now: number): boolean`
    - `sessionKey(s: { eventId: string; sessionId: string }): string` → `${eventId}/${sessionId}`
    - `sessionsToPing(sessions: Session[], sent: ReadonlySet<string>, leadMs: number, now: number): Session[]` returns sessions that are pingable, have `start - leadMs ≤ now < start` and whose key isn't in `sent`.
    - `groupEvents(sessions: Session[]): EventSchedule[]` returns events ordered by first session start.
    - `currentEvent(sessions: Session[], now: number): EventSchedule | null` returns the first event whose last session `end > now`.
    - `PING_DELETE_AFTER_MS = 3 * 3_600_000`
  - `lead.ts`:
    - `LEAD_SETTING_KEY = "motorsport.leadMinutes"` and `DEFAULT_LEAD_MINUTES = 60`.
    - `parseLeadTime(input: string): number | null` returns minutes. It accepts `/^(\d+)h$/`, `/^(\d+)m$/` and `/^(\d+)h(\d+)m$/`, case-insensitive with spaces trimmed. It returns `null` outside 5–1440 or on other input.
    - `formatLead(minutes: number): string` gives `1h`, `30m` or `1h 30m`.
    - `getLeadMinutes(db: Database): number`, falling back to the default.

- [ ] **Step 1: Write the failing tests**
  - **shouldRename:**
    - false when desired equals current;
    - true when `renamedAt` is null;
    - false when the last rename was 299 999 ms ago;
    - true when it was 300 000 ms ago.
  - **sessionsToPing** with lead 60 min and a pingable session at T:
    - not returned at T−61m;
    - returned at T−60m and at T−1ms;
    - not returned at T;
    - a non-pingable session is never returned;
    - an already-sent key is skipped, even if start moved.
  - **groupEvents / currentEvent:**
    - two events A (ends T1) and B (starts after T1) give `[A, B]`;
    - at T1−1 it returns A and at T1 it returns B;
    - after the last end it returns null.
  - **parseLeadTime:**

| input | expected |
|---|---|
| `30m` | 30 |
| `1h` | 60 |
| `1h30m` | 90 |
| ` 90M ` | 90 |
| `4m` | null |
| `25h` | null |
| `abc` | null |

  - **formatLead:** 90 → `1h 30m`. **getLeadMinutes:** an empty db gives 60.
- [ ] **Step 2:** Run the tests and expect them to fail.
- [ ] **Step 3:** Implement both files.
- [ ] **Step 4:** Run `bun run check` and expect it to pass.
- [ ] **Step 5:** Commit with `feat(motorsport): rename/ping decisions and lead time parsing`.

### Task 7: Motorsport: rendering of the pinned message and pings

**Files:**
- Create: `src/modules/motorsport/render.ts`
- Test: `render.test.ts`

**Interfaces:**
- Consumes: `SeriesInfo`, `EventSchedule`, `Session`.
- Produces:
  - `renderSchedule(info: SeriesInfo, event: EventSchedule | null): MessagePayload`, with `MessagePayload = { content: string; components: APIActionRowComponent<APIMessageActionRowComponent>[] }` (types from `discord.js`, type-only import).
    - **Content:**
      - first line `## 🏁 ${info.name} — ${event.eventName}`;
      - then one line per session: `${pingable ? "🔔" : "▫️"} **${title}** — <t:${unix}:F> (<t:${unix}:R>)`;
      - the last line is `-# 🔔 = pinged`.
    - **Components:**
      - row 1 is a button with custom ID `motorsport:pings:${key}`, label `🔔 Season pings` and secondary style;
      - row 2 is a string select `motorsport:remind:${key}:${eventId}` with placeholder `Remind me about…` and one option per pingable session (value `sessionId`, label `title`, max 25), `minValues: 1`, `maxValues: 1`, included only if there's at least one pingable session.
    - **When `event` is null:** content `## 🏁 ${info.name}\nNo upcoming events this season.`, and only the button row.
  - `renderPing(p: { info: SeriesInfo; session: Session; roleId: string; roleHasMembers: boolean; roleMemberIds: ReadonlySet<string>; oneOffUserIds: string[] }): { content: string; allowedMentions: { roles: string[]; users: string[] } } | null`
    - Users = `oneOffUserIds` not in `roleMemberIds`.
    - The role is included only when `roleHasMembers`.
    - Returns null if there's neither a role nor any users.
    - Content: `${roleMention}${userMentions} 🏁 ${session.eventName} ${session.title} starts <t:${unix}:R>`, mentions separated by spaces.

- [ ] **Step 1: Write the failing tests**
  - **Schedule with an event:**
    - an event with practice (not pingable) and race (pingable) gives a content line starting with `▫️ **Practice 1**` and one starting with `🔔 **Race**`;
    - the select has exactly one option, value `race`;
    - the select custom ID is `motorsport:remind:f1:chinese-grand-prix`.
  - **Schedule with no pingable sessions:** components length is 1.
  - **Schedule with a null event:** content contains `No upcoming events this season.` and components length is 1.
  - **Ping:**
    - role with members plus a one-off user `u1` who also has the role gives content starting `<@&r1> 🏁` and no `<@u1>`;
    - role without members plus one-off `u2` gives content starting `<@u2> 🏁` and `allowedMentions.roles` is empty;
    - neither gives null.
- [ ] **Step 2:** Run the tests and expect them to fail.
- [ ] **Step 3:** Implement `render.ts`.
- [ ] **Step 4:** Run `bun run check` and expect it to pass.
- [ ] **Step 5:** Commit with `feat(motorsport): schedule and ping message rendering`.

### Task 8: Motorsport: repository and migrations

**Files:**
- Create: `src/modules/motorsport/repo.ts`
- Test: `repo.test.ts`

**Interfaces:**
- Consumes: `Migration`, `runMigrations` (Task 2), `Session`, `SeriesKey`.
- Produces:
  - `motorsportMigrations: Migration[]`, with ID `motorsport-001-init` creating the four tables from the spec's data model.
  - `interface Followed { series: SeriesKey; channelId: string; roleId: string; pinnedMessageId: string; pinnedEventId: string | null; channelName: string | null; renamedAt: number | null }`
  - `class MotorsportRepo { constructor(db: Database) }` with methods:
    - `listFollowed(): Followed[]`, `getFollowed(s): Followed | null`, `insertFollowed(f: Followed): void` and `updateFollowed(s, patch: Partial<Omit<Followed, "series">>): void`
    - `deleteSeries(s): void`, which removes the series' followed, one-off and sent-ping rows
    - `replaceSessions(s, sessions: Session[], fetchedAt: number): void` (one transaction) and `listSessions(s): Session[]` (sorted by start)
    - `toggleOneOff(userId: string, s, eventId: string, sessionId: string): boolean` (true means it's now set), `oneOffUsers(s, eventId, sessionId): string[]` and `clearOneOff(s, eventId, sessionId): void`
    - `sentKeys(s): Set<string>`, `insertSentPing(p: { series: SeriesKey; eventId: string; sessionId: string; channelId: string; messageId: string | null; deleteAt: number }): void` (`messageId: null` = handled, nothing sent), `duePingDeletes(now: number): { series: SeriesKey; eventId: string; sessionId: string; channelId: string; messageId: string }[]` (rows with `message_id` not null and `delete_at ≤ now`) and `markPingDeleted(s, eventId, sessionId): void` (sets `message_id` to null; the row stays for dedupe)

- [ ] **Step 1: Write the failing tests** (in-memory db after `runMigrations(db, [...coreMigrations, ...motorsportMigrations])`)
  - **Followed:**
    - an insert/get round trip keeps every field;
    - `updateFollowed({ channelName: "x", renamedAt: 5 })` keeps `roleId`.
  - **Sessions:**
    - `replaceSessions` with 2 sessions and then 1 leaves 1;
    - `Date` values and `pingable` survive the round trip.
  - **One-off reminders:**
    - `toggleOneOff` returns true, then false;
    - `oneOffUsers` reflects that;
    - `clearOneOff` empties it.
  - **Sent pings:**
    - after `insertSentPing`, `sentKeys` contains `e/s`;
    - `duePingDeletes(deleteAt - 1)` is empty and `duePingDeletes(deleteAt)` returns 1 row;
    - after `markPingDeleted`, `duePingDeletes` is empty but `sentKeys` still contains `e/s`.
  - **Deleting a series:** `deleteSeries("f1")` removes the f1 rows but not the wec rows.
- [ ] **Step 2:** Run the tests and expect them to fail.
- [ ] **Step 3:** Implement `repo.ts` with prepared statements. Convert snake_case columns to the camelCase fields.
- [ ] **Step 4:** Run `bun run check` and expect it to pass.
- [ ] **Step 5:** Commit with `feat(motorsport): sqlite repository`.

### Task 9: Motorsport: refresh

**Files:**
- Create: `src/modules/motorsport/refresh.ts`
- Test: `refresh.test.ts`

**Interfaces:**
- Consumes: `fetchSeries`, `applyRules`, `MotorsportRepo.replaceSessions`, `SERIES`.
- Produces: `refreshAll(repo: MotorsportRepo, now: Date, fetchFn?: typeof fetch): Promise<{ series: SeriesKey; ok: boolean; error?: string }[]>`.
  - For each series it fetches `now.getUTCFullYear()` and the following year, concatenates the results, runs `applyRules` and then `replaceSessions`.
  - Any thrown error (network, `SourceFormatError`) marks that series `ok: false`, leaves its rows untouched and doesn't stop the other series.

- [ ] **Step 1: Write the failing tests** (fake fetch routed by URL, serving the fixtures for 2026 and 404 for 2027)
  - After the call, `listSessions("f1")` is non-empty and every series is `ok: true`.
  - A second call where the wec URL returns `"not json"` leaves wec's previous session count unchanged and reports `wec ok: false`, and the f1 rows are still refreshed.
  - When the 2027 F1 URL returns a one-event array (`[{ id: "bahrain-2027", title: "Bahrain Grand Prix", isCancelled: false, stages: [{ id: "race", title: "Race", startDate: "2027-03-01T15:00:00Z", endDate: "2027-03-01T17:00:00Z", isSignificant: true }] }]`), `listSessions("f1")` includes `bahrain-2027/race` alongside the 2026 sessions.
- [ ] **Step 2:** Run the tests and expect them to fail.
- [ ] **Step 3:** Implement `refresh.ts`, logging each failure with `log.error("motorsport:refresh", ...)`.
- [ ] **Step 4:** Run `bun run check` and expect it to pass.
- [ ] **Step 5:** Commit with `feat(motorsport): schedule refresh with last-good fallback`.

### Task 10: Motorsport: Discord adapters, jobs, commands, module

**Files:**
- Create in `src/modules/motorsport/`:
  - `channels.ts`
  - `jobs.ts`
  - `commands.ts` (one `SlashCommand`, `/motorsport` with subcommands)
  - `components.ts`
  - `index.ts`

**Interfaces:**
- Consumes: everything from Tasks 2–9.
- Produces: `motorsportModule: BotModule`.
- **`channels.ts`:**
  - `ensureCategory(guild): Promise<CategoryChannel>`, named `Motorsport`.
  - `createSeriesChannel(guild, info): Promise<{ channelId: string; roleId: string }>`:
    - creates the role `info.name` with `mentionable: true`;
    - creates the text channel `info.key` under the category;
    - sets `@everyone` to allow ViewChannel and ReadMessageHistory, and deny SendMessages, AddReactions, CreatePublicThreads, CreatePrivateThreads and SendMessagesInThreads;
    - sets the bot member to allow ViewChannel, SendMessages, ManageMessages and ManageChannels.
  - `deleteSeriesChannel(guild, f: Followed): Promise<void>` ignores Unknown Channel (10003) and Unknown Role (10011).
- **`jobs.ts`:**
  - `refresh` runs with cron `0 */6 * * *` and `runOnStart: true`. It calls `refreshAll`, then edits each followed series' pinned message with `renderSchedule(info, currentEvent(...))` and updates `pinnedEventId`.
  - `tick` runs with cron `* * * * *`. For each followed series:
    - It fetches the channel and role. If either is gone (10003 or 10011), it runs `repo.deleteSeries` and logs.
    - **Rename:** if `shouldRename`, it calls `channel.setName(channelName(...))` and stores the name and time.
    - **Pings:** for each of `sessionsToPing(sessions, repo.sentKeys(s), lead * 60_000, now)`:
      - it calls `guild.members.fetch()` once per tick, and only if something is due;
      - it builds the message with `renderPing` and, when that isn't null, sends it with `allowedMentions` and calls `insertSentPing` with `deleteAt = start + PING_DELETE_AFTER_MS`;
      - when `renderPing` returns null, it still calls `insertSentPing` with `messageId: null`, so the session counts as handled;
      - in both cases it calls `clearOneOff`.
    - **Rollover:** if `currentEvent(...)?.eventId ?? null` differs from `pinnedEventId`, it edits the pinned message and stores the new ID.
  - `cleanup` runs with cron `* * * * *`. It calls `duePingDeletes(now)`, deletes each message (ignoring Unknown Message, 10008), then calls `markPingDeleted`.
- **`commands.ts`:** `/motorsport` with the subcommands from the spec's command table.
  - The series option is a required string with choices from `SERIES` (`name` / `key`).
  - `remind` takes a `session` string option with autocomplete, listing the pingable sessions of `currentEvent` (`name: title`, `value: sessionId`).
  - `reminder-time` takes an optional `time` string.
  - Every reply is ephemeral, with this copy:

| Command or case | Reply |
|---|---|
| follow (already followed) | `F1 is already followed in <#id>.` |
| follow | `Following F1 in <#id>.` (after creating, sending and pinning `renderSchedule`, and storing a `Followed` row) |
| unfollow | `Unfollow F1? This deletes <#id> and the @F1 role.`, with a danger button `motorsport:unfollow:f1` labelled `Unfollow` |
| pings | `Season pings for F1: on` or `off` (toggles the role) |
| remind | `Reminder set for Chinese Grand Prix Qualifying.` or `Reminder removed for …`; unknown session gives `That session isn't in the next F1 event.` |
| reminder-time (no argument) | `Reminders go out 1h before a session.` |
| reminder-time (valid) | `Reminder time set to 30m.` |
| reminder-time (invalid) | `Use a time like 30m, 1h or 1h30m (5m to 24h).` |
| any series command on an unfollowed series | `F1 isn't followed. Use /motorsport follow first.` |

- **`components.ts`:**
  - `motorsport:pings` (args `[series]`) does the same as `/motorsport pings`.
  - `motorsport:remind` (args `[series, eventId]`, value = sessionId) does the same as `remind`.
  - `motorsport:unfollow` (args `[series]`) runs `deleteSeriesChannel` and `deleteSeries`, then updates the confirmation message to `Unfollowed F1.` with no components.
- **`index.ts`:** `motorsportModule = { name: "motorsport", commands, components, jobs, migrations: motorsportMigrations }`.

- [ ] **Step 1:** Write the files. These are adapters, so there are no unit tests. Keep every decision in the pure functions from earlier tasks.
- [ ] **Step 2:** Run `bun run check` and expect it to pass.
- [ ] **Step 3:** Commit with `feat(motorsport): discord adapters, jobs and commands`.

### Task 11: Chat module, help module, entrypoint

**Files:**
- Create: `src/modules/chat/text.ts`, `src/modules/chat/index.ts`, `src/modules/help/index.ts`, `src/index.ts`
- Delete: `src/smoke.test.ts`
- Test: `src/modules/chat/text.test.ts`, `src/modules/help/index.test.ts`

**Interfaces:**
- Consumes: `generate` (Task 3), `BotModule`, `motorsportModule`, `startBot`, `loadConfig`, `openDatabase`, `runMigrations`, `coreMigrations`.
- Produces:
  - `text.ts`:
    - `stripMentions(content: string): string` removes `<@123>` and `<@!123>` and trims.
    - `buildPrompt(userText: string, referenced: string | null): string` gives `[Original message]: ${ref}\n[User reply]: ${text}` when there's a reference, otherwise the text.
    - `splitMessage(text: string, max = 2000): string[]` cuts at the last `\n` inside the limit when there is one, otherwise at `max`. No chunk is empty or longer than `max`.
  - `chatModule`:
    - Has one `messageCreate` event and ignores bots and messages that don't mention `client.user`.
    - Fetches the referenced message's content if there is one, calls `generate` and replies with each chunk.
    - On an error it replies `⚠️ Couldn't get an answer right now.` and logs.
  - `helpModule(modules: BotModule[]): BotModule` has command `/help`. It replies ephemerally with one line per command and subcommand, built from `data`: `/${name} ${sub.name} — ${sub.description}`, and `/${name} — ${description}` for commands without subcommands.
  - `src/index.ts`:
    - runs `loadConfig(process.env)` and `openDatabase`;
    - builds `const modules = [motorsportModule, chatModule]`;
    - runs `runMigrations(db, [...coreMigrations, ...modules.flatMap(m => m.migrations ?? [])])`;
    - calls `startBot([...modules, helpModule(modules)], config, db)`.

- [ ] **Step 1: Write the failing tests**
  - **stripMentions:** `"<@1> hi <@!2>"` gives `"hi"`.
  - **buildPrompt:** with a reference it gives the two-line form.
  - **splitMessage:**
    - `"a".repeat(4500)` gives chunks of 2000, 2000 and 500;
    - `"x".repeat(1990) + "\n" + "y".repeat(100)` gives 2 chunks, the first ending at the newline;
    - `""` gives `[]`.
  - **help:** a fake module with command `motorsport` and subcommands `follow` and `pings` gives output that contains `/motorsport follow —` and `/help —`.
- [ ] **Step 2:** Run the tests and expect them to fail.
- [ ] **Step 3:** Implement and delete the smoke test.
- [ ] **Step 4:** Run `bun run check` and expect it to pass.
- [ ] **Step 5:** Commit with `feat: chat and help modules, entrypoint`.

### Task 12: Deploy files and live verification

**Files:**
- Modify: `Dockerfile`, `docker-compose.yml`, `Makefile`, `.github/workflows/main.yml`

**Interfaces:**
- Consumes: the `check` and `start` scripts.

- [ ] **Step 1:** Write the deploy files.
  - **Dockerfile:**
    - `FROM oven/bun:1.4.3`
    - `WORKDIR /app`
    - copy `package.json` and `bun.lock`, then `RUN bun install --frozen-lockfile`
    - copy the rest, then `RUN bun run check`
    - `CMD ["bun", "run", "start"]`
  - **Compose:** a single `bot` service with `build: .`, `restart: always`, `env_file: .env` and `volumes: ["./data:/app/data"]`. No source bind mount.
  - **Makefile:** keep the existing targets.
  - **Workflow:** add a `check` job on `ubuntu-latest` (`oven-sh/setup-bun@v2` with `bun-version: 1.4.3`, `bun install --frozen-lockfile`, `bun run check`), and make `deploy` depend on it with `needs: check`.
- [ ] **Step 2:** Run `docker build .` and expect it to succeed, with `bun run check` passing inside the build.
- [ ] **Step 3:** Live check on a test server. This needs the user's bot token. Copy `.env.example` to `.env`, then run `bun run start` and check each item:
  1. `/help` lists all commands.
  2. `/motorsport follow f1` creates the `Motorsport` category, the `#f1・…` channel, the `@F1` role, and a pinned schedule with the button and select. The channel is read-only for a normal member.
  3. The 🔔 button toggles the role, and the select toggles a one-off reminder (check the ephemeral replies).
  4. `/motorsport reminder-time 5h` is accepted. Then insert a fake pingable session 4h59m from now with `sqlite3 data/gork.db`, and confirm the ping arrives within a minute and is deleted after `delete_at` (temporarily set it to now + 2m).
  5. The channel name updates on the next tick.
  6. Deleting `#f1` by hand removes the series on the next tick.
  7. `/motorsport unfollow f1` and its confirmation remove the channel and role.
  8. @mentioning the bot gets a Gemini reply.
- [ ] **Step 4:** Commit with `chore: bun docker image and CI check gate`.
