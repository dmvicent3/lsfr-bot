import { expect, test } from "bun:test";
import { memberLoader } from "../../../../src/modules/motorsport/pings/members.ts";

function fakeGuild(id: string, fail = false) {
  const guild = {
    id,
    calls: 0,
    members: {
      fetch: async (): Promise<unknown> => {
        guild.calls++;
        if (fail) throw new Error("gateway");
        return null;
      },
    },
  };
  return guild;
}

test("members are fetched once per guild", async () => {
  const ensure = memberLoader();
  const a = fakeGuild("a");
  const b = fakeGuild("b");
  await Promise.all([ensure(a), ensure(a)]);
  await ensure(a);
  await ensure(b);
  expect(a.calls).toBe(1);
  expect(b.calls).toBe(1);
});

test("a failed fetch is retried next time", async () => {
  const ensure = memberLoader();
  const guild = fakeGuild("a", true);
  expect(ensure(guild)).rejects.toThrow("gateway");
  await Bun.sleep(0);
  expect(ensure(guild)).rejects.toThrow("gateway");
  await Bun.sleep(0);
  expect(guild.calls).toBe(2);
});
