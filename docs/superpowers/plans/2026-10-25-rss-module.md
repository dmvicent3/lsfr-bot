# RSS Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An `rss` module in Gork that follows feeds per server, filters new articles through a local jev model by exclusion rules, and posts survivors as embeds; jev runs as a resource-limited sidecar on the Pi.

**Architecture:** Pure files (parse, dedupe, rules, decisions, render) carry the logic and tests; `cycle.ts` runs one check for one server with every effect injected; `jobs.ts`/`commands.ts` are thin Discord adapters. `core/jev.ts` is the only door to jev: one request in flight, 1 per second, exponential back-off.

**Tech Stack:** Bun 1.4.3, TypeScript 7, `bun:sqlite`, discord.js 14.27, `fast-xml-parser`, jev (`jevos-v5`) in Docker.

**Spec:** `docs/superpowers/specs/2026-10-25-rss-module-design.md`

## Global Constraints

- `bun run check` (oxfmt, oxlint type-aware, `tsc --noEmit`, `bun test`) passes at the end of every task; run `bun run fmt` before it.
- Pure files import no runtime `discord.js` (type imports allowed) and take the clock as a parameter.
- Tables prefixed `rss_`; migrations appended, never edited once applied.
- Block threshold: P(yes) >= 0.5. Pending/passed expiry: 24 h. Feed warning: 10th consecutive failure. Check cron: every 15 minutes.
- jev client: one request in flight, >= 1000 ms between requests, timeout 10 s, `state` cut to 1,500 chars, back-off 1, 2, 4, 8, 15 (cap) minutes, reset on success.
- Feeds: timeout 20 s, body cap 2 MB, first 50 items. Max 30 classifications per server per cycle.
- `/rss` commands: global, guild only, default member permission Manage Server, ephemeral replies.
- No live network in tests.

## Review Focus

1. A feed whose items have neither guid nor link: must be skipped, not stored under an empty key (one bogus row would swallow every later keyless item).
2. jev down for hours across many cycles: exactly one down notice per server, one back notice, and pending items expiring at 24 h rather than posting stale.
3. The same article in two feeds of one server, and in feeds of two servers: posted once per server, once in each server.
4. Following a feed with 50 current items: none posted, and the next cycle posts only items published after.
5. Bot removed from a server or channel deleted: posting clears the channel and the cycle stops for that server without throwing for the others.

---

### Task 0: Spike — jev on the Pi

Not code in this repo; answers whether the designed sidecar works. Pi: `ssh -i ~/.ssh/pi_opencode pi@192.168.1.224`.

- [ ] **Step 1:** On the Pi, in a scratch dir, clone `feder-cr/jev` at tag `jevos-v5`, build per its README (`pip install openvino`, `python scripts/build.py`) inside a throwaway `debian:bookworm` (or the Pi's OS) container, fetch `jevos-v5-openvino-int8.zip`.
  Expected: a `jev` binary that prints `ready in …` on `jev serve --threads 2 --ctx 2048`.
- [ ] **Step 2:** `curl` the README's billing example, then a ~1,500-char news article with 6 rules; record median latency of 10 calls each and peak RSS (`docker stats`).
  Expected: answers with `noul` per key; latency and memory written in the ledger.
- [ ] **Step 3:** If Step 1 fails: run `llama-server` with `jevos-v5-q4_k_m.gguf`, and record a ruling on the fallback (spec "Prerequisite") before Task 3; Task 3's client interface stays, its transport changes.
- [ ] **Step 4:** Save the working build steps as notes for Task 11 (ledger), and the `--state-cache` value that kept memory under 1.5 GB.

### Task 1: Core — global commands and `JEV_URL`

**Files:**
- Modify: `src/core/module.ts` (SlashCommand), `src/core/client.ts` (registerCommands), `src/core/config.ts`
- Create: `src/core/commands.ts`, `src/core/commands.test.ts`
- Test: `src/core/config.test.ts`

**Interfaces:**
- Produces: `SlashCommand.global?: true`; `splitCommands(commands: SlashCommand[]): { guild: SlashCommand[]; global: SlashCommand[] }` in `src/core/commands.ts`; `Config.jevUrl: string | null`.

- [ ] **Step 1: Failing tests**
  - `splitCommands` puts a command with `global: true` in `global`, others in `guild`, order kept.
  - `loadConfig({... , JEV_URL: " http://jev:8017 "}).jevUrl === "http://jev:8017"`; missing or blank → `null`.
- [ ] **Step 2:** `bun test src/core/commands.test.ts src/core/config.test.ts` → FAIL (`splitCommands` not exported; `jevUrl` undefined).
- [ ] **Step 3:** Implement. `registerCommands` puts `guild` to `Routes.applicationGuildCommands` (as now) and, when non-empty, `global` to `Routes.applicationCommands`, both inside the existing `retry`; both results fill `ctx.commandIds`.
- [ ] **Step 4:** `bun run check` → PASS.
- [ ] **Step 5:** Commit `feat(core): global slash commands and optional JEV_URL`.

### Task 2: `core/jev.ts` — transport

**Files:** Create `src/core/jev.ts`, `src/core/jev.test.ts`

**Interfaces:**
- Produces: `class JevError extends Error`; `interface JevQuestion { key: string; instructions: string }`; `postYesNo(url: string, state: string, questions: JevQuestion[], fetchFn: FetchFn): Promise<Map<string, number>>`.

- [ ] **Step 1: Failing tests** (fake `fetch`, style of `llm.test.ts`):
  - POSTs to `${url}/v1/systemone` with body `{model: "jev-latest", state, questions: {[key]: {type: "noul", instructions}}}`.
  - Returns `Map` key → `answers[key].noul`.
  - `JevError` on non-2xx, on a body that isn't the expected shape, on an answer missing a requested key, on a `noul` outside 0..1, and on a network rejection.
  - Passes an `AbortSignal` (timeout 10 s).
  - `state` longer than 1,500 chars is sent cut to 1,500.
- [ ] **Step 2:** `bun test src/core/jev.test.ts` → FAIL (module missing).
- [ ] **Step 3:** Implement with `isRecord` from `guards.ts`.
- [ ] **Step 4:** `bun run check` → PASS.
- [ ] **Step 5:** Commit `feat(core): jev yes/no client`.

### Task 3: `core/jev.ts` — queue, spacing, back-off

**Files:** Modify `src/core/jev.ts`, `src/core/jev.test.ts`

**Interfaces:**
- Consumes: `postYesNo`, `JevError`, `JevQuestion` (Task 2).
- Produces: `interface Jev { yesNo(state: string, questions: JevQuestion[]): Promise<Map<string, number>> }`; `createJev(opts: { url: string; fetchFn?: FetchFn; now?: () => number; sleep?: (ms: number) => Promise<void> }): Jev`.

- [ ] **Step 1: Failing tests** (injected `now`/`sleep` recording calls; fake fetch with controllable resolution):
  - Three concurrent `yesNo` calls reach `fetch` one at a time, in call order.
  - A call less than 1000 ms after the previous request's start sleeps the remainder.
  - After a failure, calls within 60 s throw `JevError` without calling `fetch`; the next failure after the pause extends it to 120 s, then 240 s, 480 s, 900 s, 900 s.
  - A success resets the pause to none.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement: a promise chain for the queue (like `keyedLock`'s tail), `lastStart`, `pausedUntil`, `failures`.
- [ ] **Step 4:** `bun run check` → PASS.
- [ ] **Step 5:** Commit `feat(core): jev queue, rate limit and back-off`.

### Task 4: `rss/parse.ts`

**Files:** Create `src/modules/rss/parse.ts`, `parse.test.ts`, `src/modules/rss/fixtures/{rss2.xml,atom.xml,cdata.xml,media.xml}`; `bun add fast-xml-parser` (exact version pinned).

**Interfaces:**
- Produces: `interface FeedItem { title: string; link: string | null; guid: string | null; description: string; publishedAt: number | null; image: string | null }`; `interface ParsedFeed { title: string; items: FeedItem[] }`; `class FeedError extends Error`; `parseFeed(xml: string): ParsedFeed` (throws `FeedError`); `MAX_ITEMS = 50`.

- [ ] **Step 1: Failing tests**
  - RSS 2.0: title, link, guid, `pubDate` → epoch ms, description.
  - Atom: `<link rel="alternate" href>`, `<id>` as guid, `updated`/`published`, `summary` or `content`.
  - CDATA and HTML in descriptions → plain text: tags stripped, entities decoded (`&amp;`, `&#8217;`), whitespace collapsed.
  - Image from `media:content`/`media:thumbnail` url, else `enclosure` with `image/*` type, else `null`.
  - 60 items → first 50.
  - Not XML, or XML with neither `rss/channel` nor `feed` → `FeedError`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement on `XMLParser` with `ignoreAttributes: false`, single items normalised to arrays.
- [ ] **Step 4:** `bun run check` → PASS.
- [ ] **Step 5:** Commit `feat(rss): RSS and Atom parser`.

### Task 5: `rss/dedupe.ts`, `rss/rules.ts`, `rss/render.ts`

**Files:** Create each with a `.test.ts`.

**Interfaces:**
- Consumes: `FeedItem` (Task 4), `JevQuestion` (Task 2).
- Produces:
  - `itemKey(item: Pick<FeedItem, "guid" | "link">): string | null`
  - `interface Rule { id: number; text: string }`; `question(text: string): string`; `buildQuestions(rules: Rule[]): JevQuestion[]` (key `r<id>`); `type Verdict = { kind: "pass" } | { kind: "block"; rule: Rule }`; `verdict(answers: Map<string, number>, rules: Rule[]): Verdict`; `articleState(item: FeedItem): string` (`title\n\ndescription`); `BLOCK_AT = 0.5`
  - `renderItem(item: FeedItem, feedName: string): APIEmbed` (type import)

- [ ] **Step 1: Failing tests**
  - `itemKey`: guid wins (trimmed); else link with fragment and `utm_*` removed, host lowercased; both missing/blank → `null`.
  - `question("sports") === "Is this article about sports?"`; `question("Is it an ad?")` unchanged; trimmed.
  - `verdict`: 0.5 blocks, 0.49 passes, first blocking rule reported, no rules → pass, missing key → throws `JevError`.
  - `renderItem`: title ≤ 256 chars (ellipsis), url = link, description ≤ 300 chars, footer = feed name, timestamp from `publishedAt` when present, image when present.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `bun run check` → PASS.
- [ ] **Step 5:** Commit `feat(rss): item keys, rules and embeds`.

### Task 6: `rss/repo.ts`

**Files:** Create `src/modules/rss/repo.ts`, `repo.test.ts`

**Interfaces:**
- Consumes: `FeedItem`, `Rule`.
- Produces: `rssMigrations: Migration[]` (`rss-001-init`, tables per spec "Data"); `type ItemState = "pending" | "passed" | "posted" | "blocked" | "expired"`; `interface Feed { id: number; guildId: string; url: string; name: string; failures: number; warned: boolean }`; `interface StoredItem extends FeedItem { id: number; feedId: number; state: ItemState; createdAt: number }`; `class RssRepo` with:
  `servers(): { guildId: string; channelId: string; jevDown: boolean }[]` (channel set only), `setChannel(guildId, channelId | null)`, `setJevDown(guildId, down: boolean)`, `jevDown(guildId): boolean`,
  `addFeed(guildId, url, name): Feed` (throws on duplicate url in guild), `removeFeed(guildId, id): boolean`, `feeds(guildId): Feed[]`, `recordFeedResult(id, failures, warned)`,
  `addRule(guildId, text): Rule`, `removeRule(guildId, id): boolean`, `rules(guildId): Rule[]`,
  `insertItem(guildId, feedId, key, item, state, now): boolean` (false when the key exists in that guild), `itemsIn(guildId, state, limit): StoredItem[]` (oldest first), `setState(id, state)`, `expire(guildId, before: number): number`.

- [ ] **Step 1: Failing tests** on `new Database(":memory:")` + `runMigrations`: each method's round trip; duplicate key in a guild returns false but the same key in another guild is inserted; `expire` touches only `pending`/`passed` older than the cut-off; `removeFeed`/`removeRule` scoped to the guild.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement like `MotorsportRepo`.
- [ ] **Step 4:** `bun run check` → PASS.
- [ ] **Step 5:** Commit `feat(rss): SQLite repository`.

### Task 7: `rss/fetch.ts` and `rss/decisions.ts`

**Files:** Create each with a `.test.ts`.

**Interfaces:**
- Produces:
  - `fetchFeed(url: string, fetchFn?: FetchFn): Promise<string>` (throws `FeedError` with a short reason); `MAX_FEED_BYTES = 2_000_000`
  - `expiryCutoff(now: number): number` (now − 24 h)
  - `type JevOutcome = "ok" | "failed" | "unused"`; `notice(wasDown: boolean, outcome: JevOutcome): "down" | "back" | null`
  - `feedResult(prev: { failures: number; warned: boolean }, ok: boolean): { failures: number; warned: boolean; warn: boolean }` (`warn` true only on reaching 10 with `warned` false)

- [ ] **Step 1: Failing tests**
  - `fetchFeed`: returns text on 200; `FeedError` on non-2xx, network error, a body over 2 MB (streamed: stops reading, does not buffer it all); sends a 20 s `AbortSignal` and a `user-agent`.
  - `notice`: (false, failed) → down; (true, failed) → null; (true, ok) → back; (false, ok) → null; `unused` → null either way.
  - `feedResult`: 9th failure no warn; 10th warns; 11th no warn; success resets both.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement; read the body via `res.body.getReader()` counting bytes.
- [ ] **Step 4:** `bun run check` → PASS.
- [ ] **Step 5:** Commit `feat(rss): feed fetching and check decisions`.

### Task 8: `rss/cycle.ts`

**Files:** Create `src/modules/rss/cycle.ts`, `cycle.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 2–7.
- Produces: `type PostResult = "ok" | "lost-channel" | "failed"`; `interface CycleDeps { repo: RssRepo; jev: Jev; fetchFeed: (url: string) => Promise<string>; post(channelId: string, embed: APIEmbed): Promise<PostResult>; say(channelId: string, text: string): Promise<void>; now(): number }`; `runCycle(server: { guildId: string; channelId: string }, deps: CycleDeps): Promise<void>`; `MAX_CLASSIFY = 30`; `followFeed(repo: RssRepo, guildId: string, url: string, name: string | null, fetchFeed, now: number): Promise<Feed>` (parse first, store all current items `posted`).

- [ ] **Step 1: Failing tests** (in-memory repo, fake jev/fetch/post/say, fixed clock), one per spec "Check cycle" step and Review Focus line:
  - New items stored `pending`; known keys and keyless items skipped; same article in two feeds stored once.
  - No rules → posted without calling jev.
  - Blocking rule → `blocked`, not posted; passing → posted, `posted`.
  - Jev throws → remaining items stay `pending`, one "⚠️ jev is down…" via `say`; second failing cycle says nothing; first ok cycle says "✅ jev is back." and posts the backlog.
  - Item older than 24 h while pending → `expired`, never posted.
  - 40 pending → 30 classified, 10 left `pending`.
  - Feed failing 10 cycles → one "Feed <name> keeps failing: <reason>"; other feeds still processed.
  - `post` returns `lost-channel` → channel cleared, cycle stops; `failed` → item stays `passed`.
  - `followFeed` on a 50-item fixture → 50 `posted` rows, nothing posted; invalid feed → throws `FeedError`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `bun run check` → PASS.
- [ ] **Step 5:** Commit `feat(rss): check cycle`.

### Task 9: Discord adapters and module

**Files:** Create `src/modules/rss/{commands.ts,jobs.ts,index.ts}`, `commands.test.ts`; modify `src/index.ts`.

**Interfaces:**
- Consumes: `runCycle`, `followFeed`, `RssRepo`, `createJev`, `splitCommands`/`global`, `Config.jevUrl`.
- Produces: `rssModule: BotModule` (title "📰 News", helpNote on exclusion rules), included in `modules` only when `config.jevUrl` is set (`src/index.ts` builds the list after `loadConfig`).

- [ ] **Step 1: Failing tests** for the pure parts only: the command JSON has `default_member_permissions` = Manage Server, `contexts` guild only, `global: true`, the seven subcommands with the spec's options and rule length 1–200; `autocompleteChoices(items, typed)` filters case-insensitively and caps at 25.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. `jobs.ts`: one `Job` `{ name: "check", cron: "*/15 * * * *" }` looping `repo.servers()` through `runCycle` inside `safely` per server; `post` maps `DiscordAPIError` Missing Access / Unknown Channel / Missing Permissions to `lost-channel`. `commands.ts` replies ephemerally; `follow` defers (fetch can take 20 s).
- [ ] **Step 4:** `bun run check` → PASS.
- [ ] **Step 5:** Commit `feat(rss): commands, job and module wiring`.

### Task 10: jev sidecar and limits

**Files:** Create `docker/jev/Dockerfile`; modify `docker-compose.yml`, `.env-example` (or create), `AGENTS.md` (module list line + `JEV_URL`; load writing-for-agents first).

- [ ] **Step 1:** `docker/jev/Dockerfile`: multi-stage, the build steps recorded in Task 0, tag `jevos-v5`, model zip verified against `SHA256SUMS.txt`, final stage only the binary, its libraries and `model/`; `CMD jev serve --host 0.0.0.0 --threads 2 --ctx 2048 --state-cache <Task 0 value>`.
- [ ] **Step 2:** Compose: service `jev` (build `docker/jev`, `restart: unless-stopped`, `cpus: 2`, `mem_limit: 2g`, healthcheck on `/health` every 30 s, no `ports`); `bot` gains `mem_limit: 512m` and `JEV_URL=http://jev:8017`.
- [ ] **Step 3:** `docker compose config` → valid; on the Pi, `docker compose up --build -d jev` then `docker compose ps` → `jev` healthy.
- [ ] **Step 4:** `bun run check` → PASS.
- [ ] **Step 5:** Commit `build: jev sidecar with resource limits`.

### Task 11: Live check and rss-bot retirement

- [ ] **Step 1:** Deploy to the Pi; in a test server `/rss channel`, `/rss follow` two real feeds, `/rss block sports`.
  Expected: no backlog posted; new articles appear within ~15 min; a sports article is blocked (check `rss_items`).
- [ ] **Step 2:** `docker compose stop jev`, wait one cycle → one down notice; start it → one back notice and backlog posted.
- [ ] **Step 3:** Ask the user before stopping rss-bot and archiving its repo.
- [ ] **Step 4:** Move the RSS cards to done on the Gork board.
