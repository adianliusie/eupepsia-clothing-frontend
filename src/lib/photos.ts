import type { Fabric } from "@/lib/api";
import { versionFor, type Garment } from "@/lib/garments";

/**
 * Real product photos in public/catalogue/garments/photos, 800×1000.
 * A file is named after the style it shows, plus the colour code when that colour is in the catalogue.
 * To add one: drop the file in and list it here (and in REPRESENTATIVE if the garment has none yet).
 */
const COLOUR_PHOTOS = new Set([
  "HBS-WL-TCA30L-442841", // tunic A-line, M Tabacco
  "HBS-WL-TCA30L-028772", // Carota
  "HBS-WL-TCA30L-028780", // Blu Elettrico
  "HBS-WL-TCA30L-029777", // Azalea
  "HBS-WL-TC30L-008768", // tunic straight, Rosso
  "HBS-WL-TC30L-028125", // Verde Bosco
  "HBS-WL-D37L-442841", // dress straight, M Tabacco
]);

/** The photo a garment shows until a colour we have a photo of is picked, keyed by any of its style codes. */
const REPRESENTATIVE: Record<string, string> = {
  "HBS-WL-TCA30L": "HBS-WL-TCA30L-442841",
  "HBS-WL-TC30L": "HBS-WL-TC30L-008768",
  "HBS-WL-D37L": "HBS-WL-D37L-442841",
  "HBS-CT-TC30S": "HBS-CT-TC30S", // black, not a catalogue colour
  "HBS-WL-C31": "HBS-WL-C31", // wood beige
  "HBS-WL-HOOD": "HBS-WL-HOOD", // avio
  "HBS-WL-PANJ": "HBS-WL-PANJ",
  "HBS-WL-B": "HBS-WL-B", // light blue
};

const photo = (name: string) => `/catalogue/garments/photos/${name}.jpg`;

/**
 * Photo for a garment: the chosen fabric and colour if we have that exact photo, else the garment's representative one,
 * else null (no photo yet; shown as an empty frame).
 */
export function garmentPhoto(g: Garment, fabric?: Fabric | null | "", colour?: string | null): string | null {
  const style = versionFor(g, fabric ?? null)?.style;
  if (style && colour && COLOUR_PHOTOS.has(`${style}-${colour}`)) return photo(`${style}-${colour}`);
  const rep = g.versions.map((v) => REPRESENTATIVE[v.style]).find(Boolean);
  return rep ? photo(rep) : null;
}
