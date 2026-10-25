# Gork

Private Discord bot for one server: motorsport schedules (countdown channels, role pings) and LLM replies to @mentions. Bun + TypeScript.

## Done means green

`bun run check` (format, lint, typecheck, tests) passes. Run `bun run fmt` to fix formatting. Bun strips types without checking them, so `tsc` in `check` is the only type gate.

## Modules

Features live in `src/modules/<name>/` and export one `BotModule` (`src/core/module.ts`). Adding a feature = a new folder + one entry in the `modules` list in `src/index.ts`; core stays untouched.

- Tables: prefixed `<module>_`, created by the module's own `migrations` (append new ids, never edit an applied one).
- Component custom IDs: `<module>:<action>[:<arg>...]`; the router matches on `<module>:<action>`.
- Shared services sit in `src/core/`: `llm.ts` for any LLM call, `jev.ts` for any yes/no classification (queued, rate-limited), `scheduler.ts` jobs for anything periodic, `settings.ts` for server-wide values.

## Pure core, thin adapters

Decisions live in pure files with no runtime `discord.js` import (in motorsport: `sources/`, `rules.ts`, `time.ts`, `decisions.ts`, `render.ts`, `lead.ts`), take the clock as a parameter, and carry the tests. Discord adapters (`channels.ts`, `jobs.ts`, `commands.ts`, `components.ts`, `client.ts`) only fetch, call those functions, and send. Put new logic in a pure file with a test, then wire it.

## jev

The rss module filters articles with jevos (github.com/feder-cr/jev) on llama.cpp: the `jev` compose service, built from `docker/jev/`, reached at `JEV_URL`; without `JEV_URL` the module is off. jev's own OpenVINO server holds ~4 GB on the Pi, hence llama.cpp. Compose `mem_limit`s do nothing on the Pi until memory cgroups are enabled in `/boot/firmware/cmdline.txt`.

## Schedule data

Tunous/MotorsportCalendar (F1, WEC, WRC) and sportstimes/f1 (F2, F3, FE, IndyCar, MotoGP), raw JSON on GitHub. Test fixtures in `src/modules/motorsport/sources/fixtures/` are 2026 snapshots; ping rules per series are in `rules.ts`.

## Design docs

Spec and plan: `docs/superpowers/specs/2026-10-15-gork-rewrite-design.md`, `docs/superpowers/plans/2026-10-15-gork-rewrite.md`.

## Task board

`C:\Users\Utilizador\Documents\Obsidian Vault\Gork\Gork Kanban.md` (lanes: todo, in-progress, done). Check it when starting; move cards as status changes.
