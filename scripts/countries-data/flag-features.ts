import type { FlagFeature } from "../../src/core/countries/types.ts";

/** Curated by hand from each country's current flag; a code absent from every list below has none. */
const ALL = `AF AL DZ AS AD AO AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BA BW BR VG BN BG
BF BI CV KH CM CA KY CF TD CL CN CO KM CR CI HR CU CW CY CZ DK DJ DM DO CD EC EG SV GQ ER EE SZ ET
FO FJ FI FR PF GA GM GE DE GH GI GR GL GD GU GT GN GW GY HT HN HK HU IS IN ID IR IQ IE IM IL IT JM
JP JO KZ KE KI XK KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME
MA MZ MM NA NR NP NL NC NZ NI NE NG KP MK MP NO OM PK PW PS PA PG PY PE PH PL PT PR QA CG RO RU RW
MF WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA KR SS ES LK KN LC VC SD SR SE CH SY TJ TZ TH TL TG
TO TT TN TR TM TC TV UG UA AE GB US VI UY UZ VU VE VN YE ZM ZW`;

const STAR = `AO AW AU AZ BA BR BF BI CV CM CF CL CN KM CU CW DJ DM CD ET GH GD GW HN IL JO XK LR LY MO
MY MH MR FM MA MZ MM NR NZ KP MP PK PA PG PH PR WS ST SN SG SB SO SS KN SR SY TJ TL TG TN TR TM TV
US UZ VE VN ZW DZ TJ HK PY GQ DM`;
const CRESCENT = "NP DZ AZ BN KM LY MY MV MR PK SG TN TR TM UZ";
// Emblem = any figurative device, seal or coat of arms (suns, leaves, animals, wheels, crosses-as-badges); plain stars, crescents, stripes, triangles and discs are not.
const EMBLEM = `AF AL AS AD AO AG AR BB BZ BM BT BO BR VG BN KH CA KY HR CY DM DO EC EG SV GQ ER SZ FJ
PF GI GD GU GT HT HK IN IR IM KZ KE KI XK KG LB LS LI MO MW MT MX MD ME MN MZ NA NC NI MP MK NP OM
PG PY PH PT RW MF SM SA RS SX SK SI ES LK TJ TM TC UG VI UY VU ZM ZW`;

const set = (list: string) => new Set(list.split(/\s+/));
const LISTS: [FlagFeature, Set<string>][] = [
  ["star", set(STAR)],
  ["crescent", set(CRESCENT)],
  ["emblem", set(EMBLEM)],
];

/** Every country code mapped to its flag features; the keys are the full list of countries. */
export const FEATURES: Record<string, FlagFeature[]> = Object.fromEntries(
  [...set(ALL)].map((iso2) => [iso2, LISTS.filter(([, s]) => s.has(iso2)).map(([f]) => f)]),
);
