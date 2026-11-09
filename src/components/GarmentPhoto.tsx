"use client";

import { useState } from "react";
import { GarmentIcon } from "@/components/GarmentIcon";

// Photos live in public/catalogue/garments/<type>.jpg for now (one per garment type).
// Swap for per-style photos (<STYLE>.jpg) once they exist.
const garmentPhoto = (type: string) => `/catalogue/garments/${type.toLowerCase()}.jpg`;

/** Garment photo, falling back to the line icon when the file is missing. */
export function GarmentPhoto({ type, className = "", iconSize = 28 }: { type: string; className?: string; iconSize?: number }) {
  const [failed, setFailed] = useState<string | null>(null);
  const src = garmentPhoto(type);
  if (failed === src)
    return (
      <span className={`grid place-items-center bg-box text-muted ${className}`}>
        <GarmentIcon type={type} size={iconSize} />
      </span>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(src)} className={`bg-box object-cover ${className}`} />;
}
