/** The API's nationality words to ISO 3166-1 alpha-2; former states map to today's country. */
const CODES: Record<string, string> = {
  American: "US",
  Argentine: "AR",
  Australian: "AU",
  Austrian: "AT",
  Belgian: "BE",
  Brazilian: "BR",
  British: "GB",
  Canadian: "CA",
  Chilean: "CL",
  Chinese: "CN",
  Colombian: "CO",
  Czech: "CZ",
  Danish: "DK",
  Dutch: "NL",
  "East German": "DE",
  Finnish: "FI",
  French: "FR",
  German: "DE",
  Hungarian: "HU",
  Indian: "IN",
  Indonesian: "ID",
  Irish: "IE",
  Italian: "IT",
  Japanese: "JP",
  Liechtensteiner: "LI",
  Malaysian: "MY",
  Mexican: "MX",
  Monegasque: "MC",
  "New Zealander": "NZ",
  Polish: "PL",
  Portuguese: "PT",
  Rhodesian: "ZW",
  Russian: "RU",
  "South African": "ZA",
  Spanish: "ES",
  Swedish: "SE",
  Swiss: "CH",
  Thai: "TH",
  Uruguayan: "UY",
  Venezuelan: "VE",
};

/** The ISO code for a nationality; throws on one not in the list, so the build can't skip it. */
export function flagCode(nationality: string): string {
  const code = CODES[nationality];

  if (!code) throw new Error(`no country code for nationality "${nationality}"`);

  return code;
}
