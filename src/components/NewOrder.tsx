"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createOrder, getCatalogue, listCustomers, money, type Catalogue, type Customer, type Product } from "@/lib/api";
import { Button, Input, Notice, Stepper, Swatch, attention, label } from "@/components/ui";
import { Option, SearchIcon, ChevronIcon, menuPanel, useDismiss } from "@/components/Dropdown";
import { ColourMenu, FabricMenu, GarmentMenu, SizeMenu } from "@/components/CatalogueMenus";
import { GarmentPhoto } from "@/components/GarmentPhoto";
import { GarmentIcon } from "@/components/GarmentIcon";
import { MILL, colourOf, fabricLabel, fabricsOf, fit, garmentsOf, sizesOf, versionFor, type Choice, type Garment } from "@/lib/garments";

// A row starts empty and fills in left to right: garment, fabric, colour, size.
type Row = Choice & { key: number; garment: string | null; quantity: number };
// A customer picked from the list has an id; a new one is just a name until the order creates it.
type CustomerChoice = Pick<Customer, "first_name" | "last_name"> & { id?: string };

const FIELDS = ["garment", "fabric", "colour", "size"] as const;
const ROW_GRID = "grid grid-cols-[44px_minmax(0,1fr)_96px_minmax(0,1fr)_76px_80px_72px_28px] items-center gap-2.5";

let nextKey = 1;
const emptyRow = (): Row => ({ key: nextKey++, garment: null, fabric: null, colour: null, size: null, quantity: 1 });

export function NewOrder() {
  const router = useRouter();
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<CustomerChoice | null>(null);
  const [customerMissing, setCustomerMissing] = useState(false);
  const [focusCustomer, setFocusCustomer] = useState(0);
  const [rows, setRows] = useState<Row[]>(() => [emptyRow()]);
  const [selected, setSelected] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCatalogue()
      .then(setCatalogue)
      .catch((e) => setError(e.message));
    listCustomers()
      .then(setCustomers)
      .catch(() => setCustomers([]));
  }, []);

  const garments = useMemo(() => (catalogue ? garmentsOf(catalogue) : []), [catalogue]);
  // Resolve each row's garment and product once per render, and what it still needs (in fill order).
  const resolved = rows.map((r) => {
    const garment = garments.find((g) => g.id === r.garment) ?? null;
    const missing = FIELDS.filter((f) => !r[f]);
    return { row: r, garment, product: versionFor(garment, r.fabric), missing, next: missing[0] };
  });
  // "Still needed" list, shown before submitting.
  const todo = [
    ...(customer ? [] : ["customer"]),
    ...resolved.flatMap((x, i) => (x.missing.length ? [`${rows.length > 1 ? `item ${i + 1}` : "item"}: ${x.missing.join(", ")}`] : [])),
  ];

  function update(key: number, fn: (r: Row) => Row) {
    setSelected(key);
    setRows((rs) => rs.map((r) => (r.key === key ? fn(r) : r)));
  }

  // Keep what still applies; a fabric or size that's the only option is chosen for you.
  const settle = (r: Row): Row => (catalogue ? { ...r, ...fit(catalogue, garments.find((g) => g.id === r.garment) ?? null, r, true) } : r);

  const pieces = rows.reduce((n, r) => n + r.quantity, 0);
  const total = resolved.reduce((s, x) => s + (x.product?.price ?? 0) * x.row.quantity, 0);
  const preview = resolved.find((x) => x.row.key === selected) ?? resolved[0];

  async function submit() {
    if (!customer) {
      setCustomerMissing(true);
      setFocusCustomer((n) => n + 1);
      return setError(null);
    }
    if (todo.length) return; // the footer already lists what is still needed
    setSubmitting(true);
    setError(null);
    try {
      const order = await createOrder({
        first_name: customer.first_name,
        last_name: customer.last_name,
        notes: notes.trim() || undefined,
        items: resolved.map(({ row, product }) => ({ style: product!.style, colour: row.colour!, size: row.size!, quantity: row.quantity })),
      });
      router.push(`/track?placed=${order.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <h1 className="text-[32px] font-normal leading-tight tracking-[-0.02em]">New order for</h1>
        <CustomerPicker
          customers={customers}
          value={customer}
          onChange={(c) => {
            setCustomer(c);
            setCustomerMissing(false);
          }}
          invalid={customerMissing}
          focusSignal={focusCustomer}
        />
      </div>

      {!catalogue && !error && <p className="py-16 text-center text-[13.5px] text-muted">Loading catalogue…</p>}

      {catalogue && (
        <div className="mt-7 flex flex-wrap items-start gap-8">
          <section className="flex min-w-0 flex-[999_1_680px] flex-col gap-6">
            <div className="rounded-xl border border-line">
              <div className={`${ROW_GRID} border-b border-line px-3.5 py-2.5 text-[11.5px] font-medium uppercase tracking-[0.05em] text-muted`}>
                <span />
                <span>Garment</span>
                <span>Fabric</span>
                <span>Colour</span>
                <span>Size</span>
                <span>Qty</span>
                <span className="text-right">Price</span>
                <span />
              </div>

              {resolved.map(({ row: r, garment: g, product: p, next }) => (
                <div key={r.key} className={`${ROW_GRID} border-b border-line px-3.5 py-2.5 ${r.key === preview?.row.key ? "bg-tint" : "bg-white"}`}>
                  <button type="button" aria-label="Preview item" onClick={() => setSelected(r.key)} className="h-11 w-11 overflow-hidden rounded-lg">
                    {g ? (
                      <GarmentPhoto type={g.type} className="h-11 w-11 object-[center_25%]" iconSize={24} />
                    ) : (
                      <span className="block h-11 w-11 rounded-lg border border-dashed border-edge bg-white" />
                    )}
                  </button>

                  <GarmentMenu
                    garments={garments}
                    value={g}
                    attention={next === "garment"}
                    onPick={(x) => x && update(r.key, (row) => settle({ ...row, garment: x.id }))}
                  />
                  <FabricMenu
                    value={r.fabric}
                    available={g ? fabricsOf(g) : []}
                    disabled={!g}
                    attention={next === "fabric"}
                    onPick={(f) => update(r.key, (row) => settle({ ...row, fabric: f }))}
                  />
                  <ColourMenu
                    catalogue={catalogue}
                    fabrics={r.fabric ? [r.fabric] : []}
                    value={r.colour}
                    disabled={!r.fabric}
                    attention={next === "colour"}
                    onPick={(c) => update(r.key, (row) => ({ ...row, colour: c }))}
                  />
                  <SizeMenu
                    sizes={g ? sizesOf(g, r.fabric) : []}
                    value={r.size}
                    disabled={!g}
                    attention={next === "size"}
                    onPick={(s) => update(r.key, (row) => ({ ...row, size: s }))}
                  />
                  <Stepper max={99} value={r.quantity} onChange={(quantity) => update(r.key, (row) => ({ ...row, quantity }))} />

                  <span className={`text-right text-[14.5px] font-semibold ${p ? "" : "text-muted/50"}`}>{p ? money(p.price * r.quantity) : "—"}</span>

                  <button
                    type="button"
                    aria-label="Remove item"
                    disabled={rows.length === 1}
                    onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                    className="grid h-8 w-7 place-items-center rounded-lg text-muted hover:text-danger disabled:opacity-0"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <div className="px-3.5 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const r = emptyRow();
                    setRows((rs) => [...rs, r]);
                    setSelected(r.key);
                  }}
                  className="h-10 rounded-lg border border-dashed border-edge bg-white px-3.5 text-[14px] font-medium text-azure-deep hover:border-azure"
                >
                  + Add item
                </button>
              </div>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className={label}>
                Notes <span className="ml-1 font-normal text-muted/70">optional</span>
              </span>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gift wrap, delivery date…" />
            </label>

            {error && <Notice onClose={() => setError(null)}>{error}</Notice>}

            <div className="flex flex-wrap items-center justify-end gap-5 border-t border-line pt-5">
              <p className={`mr-auto text-[13.5px] ${todo.length ? "text-pla-fg" : "text-est-fg"}`}>
                {todo.length ? (
                  <>
                    <span className="font-semibold">Still needed:</span> {todo.join(" · ")}
                  </>
                ) : (
                  "✓ Ready to place"
                )}
              </p>
              <span className="text-[13.5px] text-muted">
                {rows.length} {rows.length === 1 ? "item" : "items"} · {pieces} {pieces === 1 ? "piece" : "pieces"}
              </span>
              <span className="text-[26px] font-semibold tracking-tight">{money(total)}</span>
              <Button onClick={submit} disabled={submitting} className="h-12 px-7 text-[15px]">
                {submitting ? "Placing order…" : "Place order"}
              </Button>
            </div>
          </section>

          {preview && <Preview catalogue={catalogue} garment={preview.garment} product={preview.product} row={preview.row} index={resolved.indexOf(preview) + 1} />}
        </div>
      )}
    </>
  );
}

function Preview({ catalogue, garment, product, row, index }: { catalogue: Catalogue; garment: Garment | null; product: Product | null; row: Row; index: number }) {
  const c = row.fabric ? colourOf(catalogue, row.fabric, row.colour) : undefined;
  return (
    <aside className="w-full max-w-[300px] flex-[1_1_280px] overflow-hidden rounded-[14px] border border-line">
      <div className="relative">
        {garment ? (
          <GarmentPhoto type={garment.type} className="block aspect-[4/5] w-full" iconSize={96} />
        ) : (
          <div className="grid aspect-[4/5] w-full place-items-center bg-box text-edge">
            <GarmentIcon type="Tunic" size={96} />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[12px] font-medium">Item {index}</span>
      </div>
      <div className="flex flex-col gap-3.5 px-[18px] pt-4 pb-[18px]">
        {!garment ? (
          <p className="text-[14px] text-muted">Choose a garment to see it here.</p>
        ) : (
          <>
            <div>
              <div className="text-[17px] font-semibold tracking-tight">{garment.title}</div>
              <div className="mt-0.5 text-[13px] text-muted">
                {product ? `${fabricLabel(product.fabric)} · ${product.style} · ${money(product.price)} each` : "Choose wool or cotton"}
              </div>
            </div>
            {c && row.fabric ? (
              <div className="flex items-center gap-3 rounded-[10px] bg-box p-2.5">
                <Swatch hex={c.hex} size={52} />
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold">{c.name}</span>
                  <span className="block text-[12.5px] text-muted">
                    Shade {c.code} · {MILL[row.fabric]}
                  </span>
                </span>
              </div>
            ) : (
              <div className="rounded-[10px] border border-dashed border-edge p-3 text-[13px] text-muted">No colour chosen yet</div>
            )}
            <div className="grid grid-cols-3 gap-2 text-[13px]">
              <div>
                <div className="text-muted">Size</div>
                <div className="mt-0.5 font-semibold">{row.size ?? "—"}</div>
              </div>
              <div>
                <div className="text-muted">Qty</div>
                <div className="mt-0.5 font-semibold">{row.quantity}</div>
              </div>
              <div>
                <div className="text-muted">Line total</div>
                <div className="mt-0.5 font-semibold">{product ? money(product.price * row.quantity) : "—"}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

const initials = (c: CustomerChoice) => `${c.first_name[0] ?? ""}${c.last_name[0] ?? ""}`.toUpperCase();

/**
 * With no customer it's a search box in the heading ("New order for [ Search or add a customer ]").
 * Once chosen it collapses to the name; clicking the name brings the box back.
 */
function CustomerPicker({
  customers,
  value,
  onChange,
  invalid,
  focusSignal,
}: {
  customers: Customer[];
  value: CustomerChoice | null;
  onChange: (c: CustomerChoice) => void;
  invalid: boolean;
  focusSignal: number;
}) {
  const [changing, setChanging] = useState(false); // a customer is set but the box is open to change it
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState<{ first: string; last: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const showInput = !value || changing;

  // Focus on load, and again when "Place order" finds no customer.
  useEffect(() => {
    const id = requestAnimationFrame(() => input.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [focusSignal]);

  useDismiss(ref, open, () => {
    setOpen(false);
    setCreating(null);
    setChanging(false);
  });

  const query = q.trim().toLowerCase();
  const matches = customers.filter((c) => !query || `${c.first_name} ${c.last_name}`.toLowerCase().includes(query)).slice(0, 8);

  function startCreate() {
    const [first = "", ...rest] = q.trim().split(/\s+/);
    setCreating({ first, last: rest.join(" ") });
    setOpen(true);
  }

  function pick(c: CustomerChoice) {
    onChange(c);
    setOpen(false);
    setQ("");
    setCreating(null);
    setChanging(false);
  }

  return (
    <div ref={ref} className="relative">
      {!showInput && value ? (
        <button
          type="button"
          aria-label={`Customer: ${value.first_name} ${value.last_name}. Change`}
          onClick={() => {
            setChanging(true);
            setOpen(true);
            requestAnimationFrame(() => input.current?.focus());
          }}
          className="group flex items-center gap-2 rounded-md text-[32px] leading-tight tracking-[-0.02em] text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-azure"
        >
          <span className="whitespace-nowrap underline decoration-edge decoration-dotted decoration-2 underline-offset-[6px] group-hover:decoration-ink">
            {value.first_name} {value.last_name}
          </span>
          <ChevronIcon size={16} className="mt-1 group-hover:text-ink" />
        </button>
      ) : (
        <label
          data-attention={!value && !invalid}
          className={`flex h-12 w-[360px] max-w-[calc(100vw-40px)] items-center gap-2.5 rounded-lg border bg-white px-3.5 focus-within:ring-1 ${attention} ${
            invalid ? "border-danger ring-1 ring-danger focus-within:ring-danger" : "border-edge focus-within:border-azure focus-within:ring-azure"
          }`}
        >
          <span className="text-muted">
            <SearchIcon />
          </span>
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setCreating(null);
              setOpen(true);
            }}
            onClick={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (matches.length === 1) pick(matches[0]);
                else if (!matches.length && query) startCreate();
              }
            }}
            aria-label="Customer"
            aria-invalid={invalid}
            placeholder="Search or add a customer"
            className="min-w-0 flex-1 bg-transparent text-[18px] text-ink outline-none placeholder:text-muted/80"
          />
        </label>
      )}

      {invalid && showInput && !open && <p className="mt-1.5 text-[13px] text-danger">Choose who this order is for.</p>}

      {open && (
        <div className={`${menuPanel} w-[360px] max-w-[calc(100vw-40px)]`}>
          {creating ? (
            <form
              className="flex flex-col gap-2.5 p-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                if (creating.first.trim() && creating.last.trim()) pick({ first_name: creating.first.trim(), last_name: creating.last.trim() });
              }}
            >
              <span className="text-[13px] font-semibold">New customer</span>
              <div className="grid grid-cols-2 gap-2">
                <Input autoFocus placeholder="First name" value={creating.first} onChange={(e) => setCreating({ ...creating, first: e.target.value })} />
                <Input placeholder="Last name" value={creating.last} onChange={(e) => setCreating({ ...creating, last: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setCreating(null)}>
                  Back
                </Button>
                <Button type="submit" size="sm" disabled={!creating.first.trim() || !creating.last.trim()}>
                  Use customer
                </Button>
              </div>
            </form>
          ) : (
            <>
              {matches.map((c) => (
                <Option key={c.id} selected={value?.id === c.id} onClick={() => pick(c)} className="py-2 text-[14px]">
                  <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-full bg-sky text-[10px] font-semibold text-azure-deep">{initials(c)}</span>
                  {c.first_name} {c.last_name}
                </Option>
              ))}
              {query && !matches.length && <p className="px-2.5 py-2.5 text-[13.5px] text-muted">No customer called “{q.trim()}” yet.</p>}
              {!query && !customers.length && <p className="px-2.5 py-2.5 text-[13.5px] text-muted">No customers yet.</p>}
              <div className={matches.length || query || !customers.length ? "mt-1 border-t border-line pt-1" : ""}>
                <Option onClick={startCreate} className="py-2 text-[14px]">
                  <span className="text-azure-deep">+ {query ? `New customer “${q.trim()}”` : "New customer"}</span>
                </Option>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
