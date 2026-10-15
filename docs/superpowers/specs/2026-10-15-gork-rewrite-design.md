# Gork rewrite — design

Date: 2026-10-15
Status: draft, awaiting review

## Goal

Rebuild Gork (`lsfr-bot`), a private Discord bot for one server, on a stack suited to agent-driven development with strict lint, format, type and test gates. Replace the hand-maintained F1-only reminders with a motorsport module that follows multiple series, keeps per-series countdown channels, and pings at a server-wide lead time. Keep the LLM @mention replies. Structure the code so new features (e.g. an AI-filtered RSS subscriber) are added as self-contained modules.

## Decisions

| Topic | Decision |
|---|---|
| Runtime | Bun 1.4.3 (latest at time of writing) |
| Language | TypeScript, type-checked with TypeScript 7 (`tsc --noEmit`) |
| Lint / format | oxlint (type-aware via `oxlint-tsgolint`) and oxfmt |
| Tests | `bun test` |
| Storage | `bun:sqlite`, one file on a mounted volume |
| Scheduling | `Bun.cron` in-process |
| Discord | discord.js 14.27 (only runtime dependency) |
| LLM | Gemini REST API via `fetch`, model from `GEMINI_MODEL` |
| Permissions | every command usable by anyone in the server |
| Hosting | existing VPS, Docker (`oven/bun:1.4.3`), GitHub Actions deploy |

Dependencies: runtime `discord.js`; dev `typescript@7`, `oxlint`, `oxlint-tsgolint`, `oxfmt`, `@types/bun`. Nothing else; JSON from sources is validated with small hand-written validators.

## Quality gates

`bun run check` runs, in order: `oxfmt --check`, `oxlint --type-aware`, `tsc --noEmit`, `bun test`. It must pass before work counts as done, and CI runs it before deploying.

- `tsconfig`: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`.
- oxlint: `correctness` and `suspicious` categories as errors; plugins `typescript`, `unicorn`, `import`, `promise`.

## Architecture: core + modules

```
src/
  index.ts              const modules = [motorsport, chat, help]; wires them into core
  core/
    module.ts           BotModule interface
    client.ts           discord.js client; routes commands, components and events to modules
    db.ts               bun:sqlite connection + migration runner (modules supply migrations)
    scheduler.ts        Bun.cron wrapper; modules register named jobs
    llm.ts              Gemini over fetch; shared by chat and future modules
    settings.ts         typed access to the core `settings` table
    config.ts           validated environment variables
  modules/
    motorsport/
      index.ts          exports the BotModule
      series.ts         series list and metadata (key, display name, source, emoji)
      sources/tunous.ts       F1, WEC, WRC → Session[]
      sources/sportstimes.ts  F2, F3, FE, IndyCar, MotoGP → Session[]
      rules.ts          pingable-session rules per series
      time.ts           countdown text, LIVE window, default durations (pure)
      decisions.ts      shouldRename / sessionsToPing / eventToPin (pure, clock passed in)
      repo.ts           motorsport_* tables
      channels.ts       create/delete channel and role, rename (Discord adapter)
      pinned.ts         render schedule message + button + dropdown
      reminders.ts      send pings, cleanup deletes (Discord adapter)
      commands/         one file per subcommand
    chat/index.ts       @mention handler using core/llm
    help/index.ts       /help built from every module's command definitions
```

Module contract:

```ts
interface BotModule {
  name: string;
  commands?: SlashCommand[];        // definition + handler
  components?: ComponentHandler[];  // routed by custom-id prefix "<module>:"
  events?: EventHandler[];          // e.g. messageCreate
  jobs?: Job[];                     // { name, cron, run }
  migrations?: Migration[];         // tables prefixed with the module name
}
```

Adding a module means adding a folder under `modules/` and one entry in the list in `index.ts`. There is no dynamic loading, hot reload or DI framework.

Rule: `sources/`, `rules.ts`, `time.ts` and `decisions.ts` do not import discord.js. All Discord calls live in the adapter files.

## Motorsport module

### Series and sources

| Series | Source |
|---|---|
| F1, WEC, WRC | `https://raw.githubusercontent.com/Tunous/MotorsportCalendar/main/data/{formula1,wec,wrc}/{year}.json` |
| F2, F3, FE, IndyCar, MotoGP | `https://raw.githubusercontent.com/sportstimes/f1/main/_db/{f2,f3,fe,indycar,motogp}/{year}.json` |

Both are fetched for the current year and the next year (if the file exists), so the calendar rolls over without intervention. Tunous gives start and end per session in UTC. Sportstimes gives start only. Tunous has no license file; acceptable for a private bot reading public JSON.

Normalised type:

```ts
interface Session {
  series: SeriesKey;
  eventId: string;
  eventName: string;
  sessionId: string;
  title: string;
  start: Date;
  end: Date;        // from source, or start + default duration
  pingable: boolean;
}
```

Default durations when the source has no end: race / feature / gp → 2h; everything else → 1h.

### Ping rules

| Series | Pings for | No ping for |
|---|---|---|
| F1 | qualifying, sprint qualifying, sprint, race | practice |
| WEC | qualifying, hyperpole, race (source `isSignificant`) | practice |
| WRC | the first special stage of each rally day (the first `SS*` stage per UTC date) | shakedown, service, start/finish, all other stages |
| F2, F3 | qualifying, sprint, feature | practice |
| FE | qualifying, race | practice1-3 |
| IndyCar | qualifying, race | practice*, FinalPractice, warmup |
| MotoGP | qualifying1 (shown as "Qualifying"), sprint, race | fp1, fp2, practice, qualifying2, warmup |

### Commands

All are under `/motorsport` except `/help`. Series option is a fixed choice list.

| Command | Behaviour |
|---|---|
| `/motorsport follow <series>` | Creates role `@<Series>` and channel `#<series>` in a "Motorsport" category (created if missing); posts and pins the schedule message. Errors if already followed. |
| `/motorsport unfollow <series>` | Confirmation button, then deletes channel and role and the series' rows. |
| `/motorsport pings <series>` | Toggles the series role for the caller. |
| `/motorsport remind <series> <session>` | Toggles a one-off reminder for the caller. `session` autocompletes from pingable sessions of the series' next event. |
| `/motorsport reminder-time [time]` | No argument: shows the lead time. With argument (`30m`, `1h`, `90m`, range 5m–24h): sets it. Default 1h. |
| `/help` | Lists all commands from all modules. |

Command replies are ephemeral. Commands are registered to the one guild (`DISCORD_GUILD_ID`) so updates apply instantly.

### Series channel

- `@everyone` can view, cannot send messages, add reactions or create threads; the bot can.
- One pinned message: the next event's full schedule (all sessions, practice included) with Discord timestamps (`<t:unix:F>` and `<t:unix:R>`) so each viewer sees local time. Below it:
  - a "🔔 Season pings" button that toggles the series role;
  - a "Remind me about…" select menu of the event's pingable sessions that toggles one-off reminders.
- Both interactions reply ephemerally with the new state ("Season pings on", "Reminder set for Qualifying").
- When the event's last session ends, the same message is edited to the next event. If the season has no further events, it says so.

### Channel name countdown

Format `<series>・<session>-<countdown>`, lowercase, e.g.:

- more than 48h: `f1・qualifying-3d`
- 1–48h: `f1・qualifying-14h`
- under 1h: rounded up to 10 minutes, `f1・qualifying-40m`
- during the session (start ≤ now < end): `f1・🔴-qualifying-live`
- no further sessions: `f1・off-season`

The countdown targets the next session of any kind, practice included. Renames happen only when the computed name differs from the stored one and the last rename was at least 5 minutes ago (Discord allows about 2 renames per 10 minutes per channel).

### Reminders

- The lead time is a single server-wide value (core `settings` table, key `motorsport.leadMinutes`, default 60).
- For each pingable session: when `start − lead ≤ now < start` and no `motorsport_sent_pings` row exists for it, the bot posts in the series channel and records the row.
- Message: `@<Series> 🏁 <Event> <Session> starts <t:start:R>`, followed by @mentions of users with a one-off reminder for that session who don't have the role. If nobody has the role and there are one-off reminders, only those users are mentioned. If there is neither, nothing is sent.
- `allowedMentions` is restricted to the series role and the listed users.
- Ping messages are deleted at `start + 3h`.
- If the bot was down and comes back before the session starts, it still pings; after start, it skips.
- One-off reminder rows are removed after their ping is sent.

## Jobs and data flow

1. **refresh** (on startup, then `0 */6 * * *`): fetch all sources, validate, map to `Session[]`, and replace each series' rows in `motorsport_sessions` in one transaction. If a fetch or validation fails, log it and keep the previous rows. If the pinned event's sessions changed, re-render the pinned message.
2. **tick** (`* * * * *`), per followed series: countdown rename, send due pings, roll the pinned message over when its event has ended.
3. **cleanup** (`* * * * *`): delete ping messages whose `delete_at` has passed. If the message is already gone, drop the row and don't treat it as an error.

## Data model

| Table | Columns |
|---|---|
| `settings` (core) | `key` PK, `value` |
| `motorsport_followed` | `series` PK, `channel_id`, `role_id`, `pinned_message_id`, `pinned_event_id`, `channel_name`, `renamed_at` |
| `motorsport_sessions` | `series`, `event_id`, `event_name`, `session_id`, `title`, `start`, `end`, `pingable`, `fetched_at`; PK (`series`, `event_id`, `session_id`) |
| `motorsport_one_off` | `user_id`, `series`, `event_id`, `session_id`; PK all four |
| `motorsport_sent_pings` | `series`, `event_id`, `session_id` (PK together), `channel_id`, `message_id`, `delete_at` |
| `migrations` (core) | `id` PK, `applied_at` |

Times are stored as Unix milliseconds.

## Chat module

On a message that @mentions the bot, not from a bot:

1. Strip the mentions and use the text as the prompt.
2. If the message is a reply, prefix the referenced message: `[Original message]: …\n[User reply]: …`.
3. Call `core/llm.generate(prompt)`, which posts to `generativelanguage.googleapis.com` with `GEMINI_MODEL`.
4. Reply, split into ≤2000-character chunks at line breaks.
5. On error, reply with a short error line and log the details.

The current model ID is chosen during planning, and the value goes in the environment rather than the code.

## Error handling

- Every job, command, component and event handler is wrapped. Errors are logged with module and handler name and never crash the process.
- Failed commands reply ephemerally with a short cause, e.g. "Couldn't create the channel: the bot is missing Manage Channels".
- If a followed series' channel or role was deleted manually, the next tick treats the series as unfollowed and removes its rows. It doesn't recreate them.
- `config.ts` fails fast at startup naming any missing or invalid environment variable.

Required bot permissions: Manage Channels, Manage Roles, Manage Messages, Pin Messages (separate from Manage Messages since Feb 2026), Send Messages, View Channel, Read Message History. Required intents: Guilds, GuildMessages, MessageContent, GuildMembers (to know who holds a series role; enable it in the Developer Portal).

## Configuration

| Variable | Purpose |
|---|---|
| `DISCORD_TOKEN` | bot token |
| `DISCORD_GUILD_ID` | the one server |
| `GEMINI_API_KEY` | LLM key |
| `GEMINI_MODEL` | LLM model ID |
| `DATABASE_PATH` | SQLite file path, default `./data/gork.db` |

`DISCORD_CHANNEL_ID`, `DISCORD_ROLE_ID` and `DISCORD_BOT_ID` are removed. The bot ID comes from the client at runtime.

## Testing

- **Sources:** parse saved fixtures (F1 sprint weekend, WEC, WRC rally, MotoGP, FE, IndyCar, F2) into the expected `Session[]`. Invalid JSON is rejected.
- **rules.ts:** expected pingable set for each series fixture.
- **time.ts:** countdown steps and boundaries (48h, 1h, rounding to 10m), LIVE window, default durations, off-season.
- **decisions.ts:** fake clock covering the rename throttle, ping window, restart catch-up, skip after start, and pinned rollover.
- **repo.ts and core/db.ts:** in-memory `bun:sqlite`, migrations apply once, and repository round-trips.
- **chat:** message splitting, and prompt building with and without a reply.
- Discord adapters are not unit-tested; they are verified manually on a test server.

## Migration and delivery

- Work on the `rewrite` branch of `lsfr-bot`. Remove `app.py`, `utils.py`, `deps.txt` and `public/f1sessions.json`; git history keeps them.
- Rewrite `Dockerfile` (`oven/bun:1.4.3`, `bun install --frozen-lockfile`, `bun run check` in the build), `docker-compose.yml` (mount `./data`, `env_file`), `Makefile` and `.github/workflows/main.yml` (run `bun run check` before the SSH deploy).
- Add `AGENTS.md` to the repo: commands, module contract, the pure/adapter split, and the rule that `bun run check` must pass.
- Track tasks on the vault board `Gork/Gork Kanban.md`.

## Out of scope

- An RSS or news module. The architecture leaves room for it, but it isn't built here.
- Per-user lead times.
- Multi-server support.
- Bot presence or status text.
