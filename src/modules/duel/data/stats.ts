import type { StatDef, StatId, Unit } from "../types.ts";

const CITY_STATES = ["MC", "SG", "VA", "GI", "MO", "HK", "BH", "MT"];

function wb(id: StatId, label: string, unit: Unit, code: string): StatDef {
  return { id, label, unit, source: { wb: code }, exclude: [] };
}

export const STAT_BY_ID: Record<StatId, StatDef> = {
  population: wb("population", "population", "int", "SP.POP.TOTL"),
  area: wb("area", "land area", "km2", "AG.SRF.TOTL.K2"),
  density: {
    ...wb("density", "population density", "per_km2", "EN.POP.DNST"),
    exclude: CITY_STATES,
  },
  gdp_pc: wb("gdp_pc", "GDP per person", "usd", "NY.GDP.PCAP.CD"),
  life_exp: wb("life_exp", "life expectancy", "years", "SP.DYN.LE00.IN"),
  urban: wb("urban", "share of people living in cities", "pct", "SP.URB.TOTL.IN.ZS"),
  forest: wb("forest", "share of land covered by forest", "pct", "AG.LND.FRST.ZS"),
  arable: wb("arable", "share of land that is farmland", "pct", "AG.LND.ARBL.ZS"),
  co2_pc: wb("co2_pc", "CO₂ emissions per person", "t", "EN.GHG.CO2.PC.CE.AR5"),
  internet: wb("internet", "share of people using the internet", "pct", "IT.NET.USER.ZS"),
  fertility: wb("fertility", "births per woman", "dp2", "SP.DYN.TFRT.IN"),
  tourists: wb("tourists", "yearly tourist arrivals", "int", "ST.INT.ARVL"),
  aged_65: wb("aged_65", "share of people aged 65+", "pct", "SP.POP.65UP.TO.ZS"),
  peak: {
    id: "peak",
    label: "highest point",
    unit: "m",
    source: { wikidata: "peak" },
    exclude: [],
  },
};

export const STATS: readonly StatDef[] = Object.values(STAT_BY_ID);
