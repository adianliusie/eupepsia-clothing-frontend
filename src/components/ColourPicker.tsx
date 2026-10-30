"use client";

import { useEffect, useRef } from "react";
import type { Colour, Fabric } from "@/lib/api";
import { Swatch } from "@/components/ui";

const MILL: Record<Fabric, string> = { wool: "Zegna Baruffa Cashwool merino", cotton: "Maurice Brassard combed cotton" };

export function ColourPicker({
  open,
  fabric,
  colours,
  value,
  onPick,
  onClose,
}: {
  open: boolean;
  fabric: Fabric;
  colours: Colour[];
  value: string;
  onPick: (code: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-auto w-[min(700px,calc(100vw-24px))] max-h-[calc(100vh-48px)] overflow-y-auto rounded-2xl border border-edge bg-white p-0 text-ink shadow-[0_30px_80px_-20px_rgba(16,33,63,0.45)] backdrop:bg-ink/40"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[17px] font-semibold tracking-tight">{fabric === "wool" ? "Wool" : "Cotton"} shades</h3>
            <p className="mt-0.5 text-[12.5px] text-muted">{MILL[fabric]}. Swatches are screen approximations, so match to a physical card before confirming.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 flex-none place-items-center rounded-lg border border-edge text-muted hover:border-ink hover:text-ink">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 2l10 10M12 2L2 12" /></svg>
          </button>
        </div>
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(98px,1fr))] gap-1.5">
          {colours.map((c) => {
            const on = c.code === value;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  onPick(c.code);
                  onClose();
                }}
                className={`flex flex-col items-start gap-2 rounded-xl border p-2 text-left hover:border-ink ${on ? "border-azure ring-1 ring-azure" : "border-line"}`}
              >
                <span className="block h-11 w-full rounded-md shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)]" style={{ background: c.hex }} />
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium leading-tight">{c.name}</span>
                  <span className="block text-[11.5px] text-muted">{c.code}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </dialog>
  );
}

export function ColourButton({ colour, onClick }: { colour: Colour | undefined; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-10 w-full items-center gap-2.5 rounded-lg border border-edge bg-white pl-2 pr-3 text-left text-[14px] hover:border-ink focus:border-azure focus:outline-none focus:ring-1 focus:ring-azure"
    >
      {colour && <Swatch hex={colour.hex} size={24} />}
      <span className="min-w-0 flex-1 truncate font-medium">{colour?.name ?? "Choose a shade"}</span>
      {colour && <span className="text-[12px] text-muted">{colour.code}</span>}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" className="flex-none text-muted"><path d="M2.5 4.5l3.5 3.5 3.5-3.5" /></svg>
    </button>
  );
}
