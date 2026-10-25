# RSS module — design

Date: 2026-10-25
Status: draft, awaiting review

## Goal

Replace the separate `rss-bot` (github.com/dmvicent3/rss-bot) with an `rss` module in Gork, written from scratch with TDD. Servers follow RSS/Atom feeds; each new article is checked against the server's exclusion rules by a local jev model and, if no rule matches, posted to the server's news channel as it arrives. rss-bot's data is not migrated; servers re-follow their feeds.

## Decisions

| Topic | Decision |
|---|---|
| Servers | Multi-server: feeds, rules and channel are per guild (module tables, not `core/settings.ts`) |
| Filtering | Block rules (an article posts unless one matches) and only-rules (with any on its feed, an article needs one to match). A rule applies to every feed or to the feeds ticked in its select menu (added 2026-10-25: exclusion alone could not express "concerns Europe") |
| Default rules | None: a new server starts with no rules |
| Classifier | jevos model (github.com/feder-cr/jev) on llama.cpp, a yes/no question per rule, blocked at P(yes) >= 0.5 |
| jev hosting | Its own service in `docker-compose.yml` on the Pi (llama.cpp server + GGUF); Gork reaches it at `JEV_URL` |
| Posting | As articles arrive: feeds checked every 15 minutes, one message per article |
| jev unavailable | Articles wait as `pending`; one down notice and one back notice per server in the news channel; pending older than 24 h expire |
| Channel | One news channel per server |
| Message | Embed: title linking to the article, short description, feed name, date, image if the item has one; no category |
| Registration | `/rss` is a global command: `SlashCommand` gains `global?: true`; core registers global commands with `Routes.applicationCommands` and the rest per guild as now |
| Permissions | `/rss` commands need Manage Server (the rest of Gork stays open to everyone: this module is multi-server) |
| XML | `fast-xml-parser` as a second runtime dependency (hand-parsing RSS/Atom entities, CDATA and namespaces is not worth owning) |

## Prerequisite: jev on the Pi (spike)

Before the plan is executed, check on the Pi 5 (ARM64, 8 GB) that jev builds from source (`scripts/build.py`, OpenVINO from pip) and serves `POST /v1/systemone`; record latency for a short and a long article. The release has prebuilt binaries for linux-x64, macos-arm64 and windows-x64 only.

- Builds and runs: proceed as designed.
- Does not: fall back to `llama-server` with the release's GGUF (`jevos-v5-q4_k_m.gguf`), reading yes/no probabilities from token logprobs behind the same `core/jev.ts` interface; re-check accuracy on a handful of real articles. If that fails too, the classifier becomes Gemini through `core/llm.ts`, still behind the same interface.

## jev

**Spike outcome (2026-10-25):** jev's own server builds on the Pi but holds ~4 GB (OpenVINO on ARM unpacks the int8 weights), so the jevos model runs on `llama-server` (llama.cpp) from the release's `jevos-v5-q4_k_m.gguf` (~1 GB), with the prompt and probability reading jev uses. Verdicts match jev's on the test questions.

For each question, `POST {JEV_URL}/completion`:

```json
{"prompt": "<evidence>\n<title>\n\n<description>\n</evidence>\n\nQuestion: Is this article about sports?\nAnswer:",
 "n_predict": 1, "grammar": "root ::= [01]", "temperature": 1, "top_k": 0, "top_p": 1, "min_p": 0,
 "n_probs": 2, "post_sampling_probs": true, "cache_prompt": true}
```

P(yes) is the probability of token `1` in `completion_probabilities[0].top_probs` (0 when absent). A server's rules are asked one after another about the same article; `cache_prompt` reuses the shared evidence prefix. `/health` is not used for the down notice: a failed classification call is the signal.

A rule is stored as typed. A rule ending in `?` is sent as written; anything else is a topic and is sent as `Is this article about <rule>?`.

## Resource limits (keep the Pi up)

Three layers; no separate queue service (Gork is jev's only caller).

**jev container.** Lives in this repo: `docker/jev/Dockerfile` is the pinned `llama.cpp` server image (`server-b11870`) plus the `jevos-v5` Q4_K_M GGUF, checked against the release's `SHA256SUMS.txt`; `docker-compose.yml` adds the `jev` service.

- Command: `llama-server -m <gguf> --port 8017 -t 2 -c 2048 --parallel 1`.
- Compose: `cpus: 2`, `mem_limit: 1536m`, `restart: unless-stopped`, healthcheck `GET /health` every 30 s. Note: the Pi's kernel has memory cgroups off (`cgroup_enable=memory cgroup_memory=1` missing from `/boot/firmware/cmdline.txt`), so `mem_limit` only takes effect once those are enabled and the Pi rebooted; `cpus` works regardless.
- No published port: reachable only from Gork on the compose network (`JEV_URL=http://jev:8017`), so no API key.

**Gork's client (`core/jev.ts`), the queue.**

- One request in flight: callers queue in order (shared by any future module that uses jev).
- At most one article (`yesNo` call) a second; the rss check classifies at most 30 items per cycle, the rest stay `pending` for the next.
- `state` cut to 1,500 characters before sending.
- After a failure, no call for 1 min, then 2, 4, 8, capped at 15 min; any success resets it. Calls during the pause fail fast as `JevError` without touching the network.

**Gork itself.**

- Feed download capped at 2 MB (stopped reading past that, counted as a failure) and the first 50 items of a feed.
- Gork's container: `mem_limit: 512m`.

## Module layout

```
src/core/jev.ts             classify(state, questions, {url, fetchFn}) -> Map<key, number>; JevError on any failure
src/modules/rss/
  parse.ts                  RSS 2.0 / Atom XML -> FeedItem[] (title, link, guid, description as plain text, date, image)
  dedupe.ts                 itemKey(item): guid, else normalised link (no fragment, no utm_* params, lowercase host)
  rules.ts                  question(rule), buildQuestions(rules), verdict(answers, rules) -> pass | block(rule)
  decisions.ts              pure: expiry cut-off, notice transitions, feed failure bookkeeping
  fetch.ts                  fetchFeed(url): timeout, 2 MB cap, FeedError
  cycle.ts                  one check for one server, every effect injected (repo, fetchFeed, jev, post, clock): no Discord
  render.ts                 FeedItem + feed name -> embed
  repo.ts                   SQLite access (rss_* tables)
  jobs.ts                   15-minute scheduler job: runs cycle.ts per server with Discord posting wired in
  commands.ts               /rss subcommands + autocomplete
  index.ts                  BotModule
```

Pure files (`parse`, `dedupe`, `rules`, `decisions`, `render`) have no runtime `discord.js` import, take the clock as a parameter, and carry the tests.

## Data

- `rss_servers(guild_id PK, channel_id NULL, jev_down INT)`
- `rss_feeds(id PK, guild_id, url, name, last_fetched_at NULL, failures INT, warned INT)`, unique `(guild_id, url)`
- `rss_rules(id PK, guild_id, text, kind)`, `kind` in `block | only`
- `rss_rule_feeds(rule_id, feed_id)` PK both: no rows means every feed
- `rss_items(id PK, guild_id, item_key, feed_id, title, link, description, image NULL, published_at NULL, state, created_at)`, unique `(guild_id, item_key)`; `state` in `pending | passed | posted | blocked | expired`

## Commands

`/rss` group, default member permission Manage Server, guild only.

- `channel [#channel]`: sets the news channel (default: the current channel).
- `follow url [name]`: fetches and parses the feed first (a URL that is not a feed is refused with the reason); stores every current item as `posted` so nothing old floods the channel. Name defaults to the feed title.
- `unfollow feed`: autocomplete over the server's feeds.
- `feeds`: lists feeds with failure state.
- `block rule` / `only rule`: adds a rule (1–200 chars) for every feed; the reply carries a multi-select of the server's feeds to limit it (nothing ticked: every feed). Feeds are capped at 25, a select menu's limit.
- `remove-rule rule`: autocomplete over the server's rules, shown with kind and feeds.
- `rules`: lists rules, with a picker that opens a rule's feed menu.
- Unfollowing a feed removes the rules that applied to it alone (left with no feeds they would apply to every feed).

Replies are ephemeral. Feed or rule commands before a channel is set still work; nothing is checked until a channel exists.

## Check cycle (every 15 minutes)

For each server with a channel:

1. Fetch each feed (timeout 20 s; feeds independent, one failure never stops the others). New items (item key not in `rss_items` for the guild) are stored `pending`. The same article from two feeds is stored once.
2. Expire: `pending` and `passed` items older than 24 h become `expired`.
3. Classify `pending` items, oldest first, against the rules that apply to the item's feed. None: `passed` without calling jev. Else one jev call per item: `blocked` when a block rule reaches 0.5 or when the feed has only-rules and none reaches 0.5, otherwise `passed`. On `JevError`, stop classifying for this cycle.
4. Post `passed` items, oldest first, one embed each; success sets `posted`.
5. Notices: jev failed and `jev_down` was 0, send "⚠️ jev is down, new articles will be checked once it's back." and set it; a jev call succeeded and `jev_down` was 1, send "✅ jev is back." and clear it.

The job never overlaps itself (skip a tick while one is running).

## Errors

- Feed: fetch or parse failure increments `failures`; at 10 in a row (with `warned` 0) the channel gets one "Feed <name> keeps failing: <reason>" and `warned` is set; a success resets both.
- jev: any network error, non-2xx, timeout (10 s) or answer missing a requested key is a `JevError`; items stay `pending` (see cycle).
- Discord: Missing Access or Unknown Channel on post clears the server's `channel_id` (checks stop until `/rss channel` is run again); other send failures leave the item `passed` for the next cycle.

## Testing

TDD; `bun run check` must pass.

- `parse`: fixture feeds (RSS 2.0, Atom, CDATA, HTML entities and tags in descriptions, missing guid, media/enclosure images).
- `dedupe`: guid vs link, tracking parameters, fragments, host case.
- `rules`: topic vs question wording, request keys, threshold edge (0.5 blocks, 0.49 passes), no rules, missing answer key is an error.
- `decisions`: due feeds, new-item detection across feeds, 24 h expiry, notice transitions (down once, back once), failure warning at the 10th failure only.
- `core/jev.ts`: fake `fetch` for success, non-2xx, timeout, malformed body; one request in flight under concurrent callers; 1 per second spacing and the back-off schedule with an injected clock; fail-fast during the pause; `state` truncation.
- Check cycle: the 30-item cap leaves the rest `pending`; the 2 MB and 50-item feed caps.
- `repo`: in-memory SQLite.
- No live network in tests. After the spike, one manual run against the Pi's jev with a few real feeds.

## Rollout

1. Spike (above).
2. jev service in `docker-compose.yml`; `JEV_URL` in config (optional: the module stays off without it).
3. Module, per the plan.
4. Deploy; follow the old feeds again; retire rss-bot.
