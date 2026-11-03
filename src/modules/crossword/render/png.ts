import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";

const FONTS = join(import.meta.dir, "fonts");

const OPTIONS = {
  font: {
    loadSystemFonts: false,
    fontFiles: [join(FONTS, "DejaVuSans.ttf"), join(FONTS, "DejaVuSans-Bold.ttf")],
    defaultFontFamily: "DejaVu Sans",
  },
};

/** Rasterises a grid SVG with the bundled DejaVu fonts. */
export const gridPng = (svg: string): Buffer => new Resvg(svg, OPTIONS).render().asPng();
