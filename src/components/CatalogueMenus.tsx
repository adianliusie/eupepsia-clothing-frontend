"use client";

import { useMemo, useState } from "react";
import type { Catalogue, Fabric } from "@/lib/api";
import { Dropdown, GroupHeading, Option, Placeholder, SearchIcon } from "@/components/Dropdown";
import { GarmentPhoto } from "@/components/GarmentPhoto";
import { Swatch } from "@/components/ui";
import { FABRICS, TYPES, colourOf, fabricLabel, sizeLabel, type Garment } from "@/lib/garments";

// The order form and the /track filters share these. Pass `anyLabel` to offer a "clear" option first (filters do).

export function GarmentMenu({
  garments,
  value,
  onPick,
  placeholder = "Select garment",
  anyLabel,
  attention,
}: {
  garments: Garment[];
  value: Garment | null;
  onPick: (g: Garment | null) => void;
  placeholder?: string;
  anyLabel?: string;
  attention?: boolean;
}) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const groups = useMemo(
    () =>
      TYPES.map((t) => ({
        type: t,
        options: garments.filter(
          (g) => g.type === t && (!query || `${g.title} ${g.versions.map((v) => v.style).join(" ")}`.toLowerCase().includes(query)),
        ),
      })).filter((x) => x.options.length),
    [garments, query],
  );

  return (
    <Dropdown label="Garment" attention={attention} trigger={value ? <span className="truncate">{value.title}</span> : <Placeholder>{placeholder}</Placeholder>} menuClassName="w-[360px]">
      {(close) => {
        const pick = (g: Garment | null) => () => {
          onPick(g);
          setQ("");
          close();
        };
        return (
          <>
            <label className="flex h-[38px] items-center gap-2 rounded-md bg-box px-2.5 text-muted">
              <SearchIcon />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                aria-label="Filter garments"
                placeholder="Filter by name or code"
                className="min-w-0 flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-muted/70"
              />
            </label>
            {anyLabel && !query && (
              <Option selected={!value} onClick={pick(null)} className="mt-1">
                {anyLabel}
              </Option>
            )}
            {groups.length === 0 && <p className="px-2.5 py-3.5 text-[13.5px] text-muted">No garment matches “{q}”.</p>}
            {groups.map((grp) => (
              <div key={grp.type}>
                <GroupHeading>{grp.type}</GroupHeading>
                {grp.options.map((g) => (
                  <Option key={g.id} selected={g.id === value?.id} onClick={pick(g)}>
                    <GarmentPhoto type={g.type} className="h-10 w-8 flex-none rounded object-[center_25%]" iconSize={18} />
                    {g.label}
                  </Option>
                ))}
              </div>
            ))}
          </>
        );
      }}
    </Dropdown>
  );
}

export function FabricMenu({
  value,
  available,
  onPick,
  disabled,
  placeholder = "Select",
  anyLabel,
  attention,
}: {
  value: Fabric | null;
  available: Fabric[];
  onPick: (f: Fabric | null) => void;
  disabled?: boolean;
  placeholder?: string;
  anyLabel?: string;
  attention?: boolean;
}) {
  return (
    <Dropdown label="Fabric" attention={attention} disabled={disabled} trigger={value ? fabricLabel(value) : <Placeholder>{placeholder}</Placeholder>} menuClassName="w-[150px]">
      {(close) => {
        const pick = (f: Fabric | null) => () => {
          onPick(f);
          close();
        };
        return (
          <>
            {anyLabel && (
              <Option selected={!value} onClick={pick(null)}>
                {anyLabel}
              </Option>
            )}
            {FABRICS.map((f) => (
              <Option key={f} selected={f === value} disabled={!available.includes(f)} onClick={pick(f)}>
                {fabricLabel(f)}
                {!available.includes(f) && <span className="ml-auto text-[12px] font-normal">n/a</span>}
              </Option>
            ))}
          </>
        );
      }}
    </Dropdown>
  );
}

export function ColourMenu({
  catalogue,
  fabrics,
  value,
  onPick,
  disabled,
  placeholder = "Select colour",
  anyLabel,
  attention,
}: {
  catalogue: Catalogue;
  fabrics: Fabric[];
  value: string | null;
  onPick: (code: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  anyLabel?: string;
  attention?: boolean;
}) {
  const chosen = fabrics.map((f) => colourOf(catalogue, f, value)).find(Boolean);
  return (
    <Dropdown
      label="Colour"
      attention={attention}
      disabled={disabled}
      trigger={
        chosen ? (
          <>
            <Swatch hex={chosen.hex} size={24} />
            <span className="truncate">{chosen.name}</span>
          </>
        ) : (
          <Placeholder>{placeholder}</Placeholder>
        )
      }
      menuClassName="w-full min-w-[260px]"
    >
      {(close) => {
        const pick = (code: string | null) => () => {
          onPick(code);
          close();
        };
        return (
          <>
            {anyLabel && (
              <Option selected={!value} onClick={pick(null)}>
                {anyLabel}
              </Option>
            )}
            {fabrics.map((f) => (
              <div key={f}>
                {fabrics.length > 1 && <GroupHeading>{fabricLabel(f)}</GroupHeading>}
                {catalogue.colours[f].map((c) => (
                  <Option key={c.code} selected={c.code === value} onClick={pick(c.code)}>
                    <Swatch hex={c.hex} size={22} />
                    {c.name}
                  </Option>
                ))}
              </div>
            ))}
          </>
        );
      }}
    </Dropdown>
  );
}

export function SizeMenu({
  sizes,
  value,
  onPick,
  disabled,
  placeholder = "Size",
  anyLabel,
  attention,
}: {
  sizes: string[];
  value: string | null;
  onPick: (s: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  anyLabel?: string;
  attention?: boolean;
}) {
  return (
    <Dropdown label="Size" attention={attention} disabled={disabled} trigger={value ? sizeLabel(value) : <Placeholder>{placeholder}</Placeholder>} menuClassName="w-[130px]">
      {(close) => {
        const pick = (s: string | null) => () => {
          onPick(s);
          close();
        };
        return (
          <>
            {anyLabel && (
              <Option selected={!value} onClick={pick(null)}>
                {anyLabel}
              </Option>
            )}
            {sizes.map((s) => (
              <Option key={s} selected={s === value} onClick={pick(s)}>
                {s}
              </Option>
            ))}
          </>
        );
      }}
    </Dropdown>
  );
}
