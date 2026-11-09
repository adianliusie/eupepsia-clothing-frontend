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

/**
 * A garment is one cut, whatever the fabric: same type, variant and length. Each fabric it comes in is its own style code.
 * `label` is its line under the type heading ("Straight, long sleeve · 30""), `title` the full name ("Tunic, straight — long sleeve · 30"").
 */
export type Garment = { id: string; type: string; label: string; title: string; versions: Product[] };

export const fabricsOf = (g: Garment) => g.versions.map((v) => v.fabric);
export const versionFor = (g: Garment | null, fabric: Fabric | null | "") => (g && fabric ? g.versions.find((v) => v.fabric === fabric) ?? null : null);
export const sizesOf = (g: Garment, fabric?: Fabric | null | "") => (versionFor(g, fabric ?? null) ?? g.versions[0]).sizes;

const join = (...parts: (string | null)[]) => parts.filter(Boolean).join(" · ");

export function garmentsOf(c: Catalogue): Garment[] {
  const byId = new Map<string, Garment>();
  for (const p of c.products) {
    const id = [p.type, p.variant, p.length].join("|");
    const g = byId.get(id);
    if (g) g.versions.push(p);
    else byId.set(id, { id, type: p.type, label: join(p.variant, p.length) || p.name, title: join(p.name, p.length), versions: [p] });
  }
  return [...byId.values()];
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
