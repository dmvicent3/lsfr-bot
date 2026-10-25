import { generate } from "../../core/llm.ts";
import { log } from "../../core/log.ts";
import type { Job } from "../../core/types.ts";
import { safely } from "../../core/scheduler.ts";
import { fetchSeriesChannel, guildOf } from "./channels/lookup.ts";
import { updatePinned } from "./channels/pinned.ts";
import { poster } from "./channels/poster.ts";
import { ensureThreadPermissions } from "./channels/setup.ts";
import { tickSeries } from "./channels/tick.ts";
import { collectResults } from "./results/collect-results.ts";
import { collectRulings } from "./rulings/collect-rulings.ts";
import { deleteDuePings } from "./pings/cleanup.ts";
import { getLeadMinutes } from "./pings/lead.ts";
import { refreshAll, refreshWeather } from "./schedule/refresh.ts";
import { MotorsportRepo } from "./repo.ts";
import { pdfText } from "./rulings/pdf.ts";

const refresh: Job = {
  name: "refresh",
  cron: "0 */6 * * *",
  runOnStart: true,
  async run(ctx) {
    const repo = new MotorsportRepo(ctx.db);
    const now = new Date();
    const results = await refreshAll(repo, now);
    log.info(
      "motorsport:refresh",
      results.map((r) => `${r.series}:${r.ok ? "ok" : "failed"}`).join(" "),
    );
    await refreshWeather(repo, now);
    const guild = await guildOf(ctx);
    for (const f of repo.followed.list()) {
      await safely(`motorsport:refresh:${f.series}`, async () => {
        const channel = await fetchSeriesChannel(guild, f);
        if (!channel) return;
        await updatePinned(channel, repo, f, now.getTime());
        await ensureThreadPermissions(channel);
      });
    }
  },
};

const tick: Job = {
  name: "tick",
  cron: "* * * * *",
  async run(ctx) {
    const repo = new MotorsportRepo(ctx.db);
    const followed = repo.followed.list();
    if (followed.length === 0) return;
    const guild = await guildOf(ctx);
    const leadMs = getLeadMinutes(ctx.db) * 60_000;
    for (const f of followed) {
      await safely(`motorsport:tick:${f.series}`, () =>
        tickSeries({ guild, repo, followed: f, leadMs, now: Date.now() }),
      );
    }
  },
};

const cleanup: Job = {
  name: "cleanup",
  cron: "* * * * *",
  async run(ctx) {
    await deleteDuePings(new MotorsportRepo(ctx.db), () => guildOf(ctx), Date.now());
  },
};

/** Posts session results (spoilered) into the weekend threads as they get published. */
const results: Job = {
  name: "results",
  cron: "*/5 * * * *",
  runOnStart: true,
  async run(ctx) {
    const repo = new MotorsportRepo(ctx.db);
    await collectResults(repo, Date.now(), fetch, poster(ctx, repo));
  },
};

/** F1 stewards' rulings published after their session, into the weekend thread. */
const rulings: Job = {
  name: "rulings",
  cron: "*/10 * * * *",
  runOnStart: true,
  async run(ctx) {
    const repo = new MotorsportRepo(ctx.db);
    await collectRulings(repo, Date.now(), {
      fetchFn: fetch,
      pdfText,
      summarize: (prompt) =>
        generate(prompt, { apiKey: ctx.config.geminiApiKey, model: ctx.config.geminiModel }),
      post: poster(ctx, repo),
    });
  },
};

export const motorsportJobs: Job[] = [refresh, tick, cleanup, results, rulings];
