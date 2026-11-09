import type { Catalogue, Colour, Fabric, Product } from "@/lib/api";

export const TYPES = ["Top", "Tunic", "Dress", "Cardigan", "Hoodie", "Pants", "Shawl"];
export const FABRICS: Fabric[] = ["wool", "cotton"];
export const fabricLabel = (f: Fabric) => (f === "wool" ? "Wool" : "Cotton");
export const MILL: Record<Fabric, string> = { wool: "Zegna Baruffa Cashwool merino", cotton: "Maurice Brassard combed cotton" };
export const sizeLabel = (s: string) => (s === "One Size" ? "One" : s);

export const productByStyle = (c: Catalogue, style: string) => c.products.find((p) => p.style === style);
export const colourOf = (c: Catalogue, fabric: Fabric, code: string | null | undefined): Colour | undefined =>
  code ? c.colours[fabric].find((x) => x.code === code) : undefined;
/** Every size in the catalogue, in catalogue order. */
export const allSizes = (c: Catalogue) => [...new Set(c.products.flatMap((p) => p.sizes))];

/** A garment is a catalogue name ("Tunic, straight — long sleeve"); each fabric it comes in is its own style code. */
export type Garment = { name: string; type: string; label: string; versions: Product[] };

export const fabricsOf = (g: Garment) => g.versions.map((v) => v.fabric);
export const versionFor = (g: Garment | null, fabric: Fabric | null | "") => (g && fabric ? g.versions.find((v) => v.fabric === fabric) ?? null : null);
export const sizesOf = (g: Garment, fabric?: Fabric | null | "") => (versionFor(g, fabric ?? null) ?? g.versions[0]).sizes;

// "Tunic, straight — long sleeve" listed under Tunic reads "Straight — long sleeve".
function styleLabel(p: Product) {
  if (p.name.startsWith(`${p.type}, `)) {
    const s = p.name.slice(p.type.length + 2);
    return s[0].toUpperCase() + s.slice(1);
  }
  if (p.name.startsWith(`${p.type} `)) return p.name.slice(p.type.length + 1);
  return p.name;
}

export function garmentsOf(c: Catalogue): Garment[] {
  const byName = new Map<string, Garment>();
  for (const p of c.products) {
    const g = byName.get(p.name);
    if (g) g.versions.push(p);
    else byName.set(p.name, { name: p.name, type: p.type, label: styleLabel(p), versions: [p] });
  }
  return [...byName.values()];
}

export type Choice = { fabric: Fabric | null; colour: string | null; size: string | null };

/**
 * Drop the fabric, colour and size that no longer fit garment `g` (any garment when null) and each other.
 * With `autoPick`, a fabric or size that is the only option is chosen too (the order form does this; filters don't).
 */
export function fit(c: Catalogue, g: Garment | null, choice: Choice, autoPick = false): Choice {
  const fabrics = g ? fabricsOf(g) : FABRICS;
  const fabric = choice.fabric && fabrics.includes(choice.fabric) ? choice.fabric : autoPick && fabrics.length === 1 ? fabrics[0] : null;
  const colourFabrics = fabric ? [fabric] : fabrics;
  const colour = choice.colour && colourFabrics.some((f) => colourOf(c, f, choice.colour)) ? choice.colour : null;
  const sizes = g ? sizesOf(g, fabric) : allSizes(c);
  const size = choice.size && sizes.includes(choice.size) ? choice.size : autoPick && sizes.length === 1 ? sizes[0] : null;
  return { fabric, colour, size };
}
