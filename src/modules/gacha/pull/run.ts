import { balanceOf, costOf } from "../engine/balance.ts";
import { landCopies } from "../engine/constellation.ts";
import { pullMany } from "../engine/pull.ts";
import { sum } from "../../../core/sum.ts";
import { ledgerOf } from "./ledger.ts";
import type { PullAsk, PullDeps, PullOutcome } from "./types.ts";

/** Balance check, rolls, counters, copies and history; run inside one transaction. */
function pullInside(d: PullDeps, a: PullAsk): PullOutcome {
  const { repo } = d;
  const ledger = ledgerOf({ repo, sources: d.sources }, a.who);
  const cost = costOf(ledger, a.price, a.count);

  if (cost === null) return { ok: false, balance: balanceOf(ledger), cost: a.price * a.count };

  const draw = { kind: a.kind, featured: a.featured, pools: d.pools };
  const { rolls, pity } = pullMany(draw, repo.pity.get(a.who, a.kind), a.count, d.random);
  const { landed, copies } = landCopies(repo.owned.all(a.who), rolls, a.price);
  const touched = new Map(rolls.map((r) => [r.driverId, copies.get(r.driverId) ?? 1]));
  repo.pity.set(a.who, a.kind, pity);
  repo.owned.save(a.who, touched, a.now);
  repo.pulls.add(a.who, { banner: a.kind, landed, price: a.price, now: a.now });
  const refunds = sum(landed.map((l) => l.refund));

  return { ok: true, landed, pity, balance: balanceOf(ledger) - cost + refunds, cost };
}

/**
 * One pull command as a single immediate transaction, so a double click or two commands at once
 * can't spend the same balance twice or roll on stale counters.
 */
export const runPull = (d: PullDeps, a: PullAsk): PullOutcome =>
  d.repo.db.transaction(() => pullInside(d, a)).immediate();
