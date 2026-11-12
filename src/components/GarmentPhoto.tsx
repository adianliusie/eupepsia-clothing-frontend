"use client";

import { useState } from "react";
import type { Fabric } from "@/lib/api";
import { GarmentIcon } from "@/components/GarmentIcon";
import type { Garment } from "@/lib/garments";
import { garmentPhoto } from "@/lib/photos";

type Props = { garment: Garment; fabric?: Fabric | null | ""; colour?: string | null; className?: string; caption?: boolean };

/**
 * Garment photo (in the chosen colour when we have it). With no photo of the garment, a soft frame with its outline,
 * and "No photo yet" under it when `caption` is set (for the large preview).
 */
export function GarmentPhoto({ garment, fabric, colour, className = "", caption = false }: Props) {
  const [failed, setFailed] = useState<string | null>(null);
  const src = garmentPhoto(garment, fabric, colour);
  if (!src || failed === src)
    return (
      <span className={`grid place-items-center bg-gradient-to-b from-box to-tint text-edge ${className}`}>
        <span className="flex w-full flex-col items-center gap-3">
          <GarmentIcon type={garment.type} className="h-auto w-[46%]" />
          {caption && <span className="text-[12.5px] text-muted">No photo yet</span>}
        </span>
      </span>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(src)} className={`block bg-box object-cover ${className}`} />;
}
