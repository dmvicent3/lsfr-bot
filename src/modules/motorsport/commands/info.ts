import type { CommandCtx, Handler } from "./types.ts";
import { MessageFlags } from "discord.js";
import { log } from "../../../core/log.ts";
import { seasonLeaderboard } from "../predictions/predict-actions.ts";
import { latestResult } from "../results/collect-results.ts";
import { renderResults } from "../results/results.ts";
import { renderNext } from "../schedule/next.ts";
import { fetchStandings } from "../standings/fetch.ts";
import { renderStandings } from "../standings/standings.ts";
import { SERIES, seriesInfo } from "../series.ts";
import { seriesOption } from "./kit.ts";

async function next({ i, repo }: CommandCtx): Promise<void> {
  const sessions = new Map(SERIES.map((s) => [s.key, repo.sessions.list(s.key)] as const));
  const followed = new Map(repo.followed.list().map((f) => [f.series, f.channelId] as const));
  await i.reply({
    embeds: [renderNext(sessions, followed, Date.now())],
    flags: MessageFlags.Ephemeral,
  });
}

async function results({ i, repo }: CommandCtx): Promise<void> {
  const series = seriesOption(i);
  const info = seriesInfo(series);
  await i.deferReply({ flags: MessageFlags.Ephemeral });
  const latest = await latestResult(repo, series, Date.now(), fetch);
  if (!latest) {
    await i.editReply(`No ${info.name} results yet.`);
    return;
  }
  const heading = { info, eventName: latest.eventName, kind: latest.kind };
  await i.editReply(renderResults(heading, { rows: latest.rows }, { spoiler: false }));
}

async function standings({ i }: CommandCtx): Promise<void> {
  const series = seriesOption(i);
  const info = seriesInfo(series);
  const champ = i.options.getString("championship") === "constructors" ? "constructors" : "drivers";
  await i.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    const table = await fetchStandings(series, champ, new Date());
    const missing =
      champ === "constructors" && series !== "f1"
        ? "Constructors' standings are only available for F1."
        : `No ${info.name} standings available right now.`;
    await i.editReply(table ? renderStandings(info, champ, table) : missing);
  } catch (err) {
    log.error("motorsport:standings", `${series} ${champ} failed`, err);
    await i.editReply("⚠️ Couldn't load the standings right now.");
  }
}

/** Public, so the table can be argued over; mentions show names without pinging. */
async function leaderboard({ i, repo }: CommandCtx): Promise<void> {
  await i.reply({
    content: seasonLeaderboard(repo, seriesOption(i), Date.now()),
    allowedMentions: { parse: [] },
  });
}

export const infoHandlers: Record<string, Handler> = { next, results, standings, leaderboard };
