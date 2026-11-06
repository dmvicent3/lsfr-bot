import type { Driver } from "../../../../src/modules/gacha/types.ts";

/** A driver with made-up stats; override what the test cares about. */
export const driver = (over: Partial<Driver> & Pick<Driver, "id">): Driver => ({
  name: "Ann Example",
  family: "Example",
  country: "PT",
  first: 1990,
  last: 1999,
  titles: 0,
  wins: 0,
  poles: 0,
  starts: 50,
  tier: 3,
  ...over,
});
