# Gork

Private Discord bot for one server: motorsport schedules (countdown channels, role pings) and LLM replies to @mentions. Bun + TypeScript.

## Done means green

`bun run check` (format, lint, typecheck, tests) passes. Run `bun run fmt` to fix formatting (it applies lint autofixes first, such as the blank lines around blocks). Bun strips types without checking them, so `tsc` in `check` is the only type gate.

## Modules

Features live in `src/modules/<name>/` and export one `BotModule` (`src/core/types.ts`). Adding a feature = a new folder + one entry in the `modules` list in `src/index.ts`; core stays untouched.

- Tables: prefixed `<module>_`, created by the module's own `migrations` (append new ids, never edit an applied one).
- Component custom IDs: `<module>:<action>[:<arg>...]`; the router matches on `<module>:<action>`.
- Shared services sit in `src/core/`: `llm.ts` for any LLM call, `jev/` for any yes/no classification (queued, rate-limited), `scheduler.ts` jobs for anything periodic, `settings.ts` for server-wide values.

## Pure core, thin adapters

Decisions live in pure files with no runtime `discord.js` import (in motorsport: `schedule/sources/`, `pings/rules.ts`, `channels/decisions.ts`, `pings/lead.ts`, `predictions/predictions.ts`, `time.ts`), take the clock as a parameter, and carry the tests. Discord adapters (`commands/`, `components/`, `jobs.ts`, the `channels/` lookups and senders, `core/client.ts`) only fetch, call those functions, and send. Put new logic in a pure file with a test, then wire it.

## Code rules

`.oxlintrc.json` enforces the size limits and bans `else` after `return`, nested ternaries and `any`; `test/**` is exempt from the size limits. The rest is judgment:

- One responsibility per file, grouped by area (`motorsport/predictions/`, `rss/feeds/`), so the files that change together sit together.
- Values that travel together become one parameter object (`Viewer`, `SessionRef`).
- Branching on a key is a lookup map, as `HANDLERS` in each `commands/commands.ts`.
- Dependencies (repo, fetch, clock, poster) arrive as arguments, and functions return their result. Module-level state is limited to locks and once-per-process caches, each with a comment.
- Classes stay small and compose: `MotorsportRepo` and `RssRepo` hold one store per table.
- Logic exists once: a second copy becomes a shared function in an existing module of its kind (`core/guards.ts`, `motorsport/format.ts`).
- Types and interfaces go in the folder's `types.ts`; a type derived from a value (`keyof typeof X`) stays beside the value.
- Tests and fixtures live in `test/`, mirroring `src/`.

## jev

The rss module filters articles with jevos (github.com/feder-cr/jev) on llama.cpp: the `jev` compose service, built from `docker/jev/`, reached at `JEV_URL`; without `JEV_URL` the module is off. jev's own OpenVINO server holds ~4 GB on the Pi, hence llama.cpp. Compose `mem_limit`s do nothing on the Pi until memory cgroups are enabled in `/boot/firmware/cmdline.txt`.

## Schedule data

Tunous/MotorsportCalendar (F1, WEC, WRC) and sportstimes/f1 (F2, F3, FE, IndyCar, MotoGP), raw JSON on GitHub. Test fixtures in `test/modules/motorsport/testing/fixtures/` are 2026 snapshots; ping rules per series are in `pings/rules.ts`.

## Design docs

Spec and plan (local only, gitignored): `docs/superpowers/specs/2026-10-15-gork-rewrite-design.md`, `docs/superpowers/plans/2026-10-15-gork-rewrite.md`.

## Task board

`C:\Users\Utilizador\Documents\Obsidian Vault\Gork\Gork Kanban.md` (lanes: todo, in-progress, done). Check it when starting; move cards as status changes.
