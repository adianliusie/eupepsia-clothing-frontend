"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createOrder, getCatalogue, listCustomers, money, type Catalogue, type Customer, type Product } from "@/lib/api";
import { Button, Input, Notice, Stepper, Swatch, attention } from "@/components/ui";
import { Option, SearchIcon, ChevronIcon, menuPanel, useDismiss } from "@/components/Dropdown";
import { ColourMenu, FabricMenu, GarmentMenu, SizeMenu } from "@/components/CatalogueMenus";
import { GarmentPhoto } from "@/components/GarmentPhoto";
import { GarmentIcon } from "@/components/GarmentIcon";
import { MILL, colourOf, fabricLabel, fabricsOf, fit, garmentsOf, sizesOf, versionFor, type Choice, type Garment } from "@/lib/garments";

// A row starts empty and fills in left to right: garment, fabric, colour, size.
type Row = Choice & { key: number; garment: string | null; quantity: number; note: string; noteOpen: boolean };
// A customer picked from the list has an id; a new one is just a name until the order creates it.
type CustomerChoice = Pick<Customer, "first_name" | "last_name"> & { id?: string };

const FIELDS = ["garment", "fabric", "colour", "size"] as const;
// Desktop: one 8-column row. Phone: a card (photo | garment | remove, then fabric · colour, then size · qty · price);
// the wrappers below are `lg:contents`, so on desktop their children sit in this grid directly.
const ROW_GRID = "lg:grid-cols-[44px_minmax(0,1fr)_96px_minmax(0,1fr)_76px_80px_28px_72px_28px]";

let nextKey = 1;
const emptyRow = (): Row => ({ key: nextKey++, garment: null, fabric: null, colour: null, size: null, quantity: 1, note: "", noteOpen: false });

export function NewOrder() {
  const router = useRouter();
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customer, setCustomer] = useState<CustomerChoice | null>(null);
  const [customerMissing, setCustomerMissing] = useState(false);
  const [focusCustomer, setFocusCustomer] = useState(0);
  const [rows, setRows] = useState<Row[]>([]); // empty until "Add item"
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCatalogue()
      .then(setCatalogue)
      .catch((e) => setError(e.message));
    listCustomers()
      .catch((): Customer[] => [])
      .then((list) => {
        setCustomers(list);
        // Pre-fill the last name used in this browser, refreshed from the list when it's there.
        const last = readLastCustomer();
        if (!last) return;
        const known = list.find((c) => (last.id && c.id === last.id) || (c.first_name === last.first_name && c.last_name === last.last_name));
        setCustomer((current) => current ?? known ?? last);
      });
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
    ...(customer ? [] : ["name"]),
    ...(rows.length ? [] : ["an item"]),
    ...resolved.flatMap((x, i) => (x.missing.length ? [`${rows.length > 1 ? `item ${i + 1}` : "item"}: ${x.missing.join(", ")}`] : [])),
  ];

  function update(key: number, fn: (r: Row) => Row) {
    setSelected(key);
    setRows((rs) => rs.map((r) => (r.key === key ? fn(r) : r)));
  }

  function addRow() {
    const r = emptyRow();
    setRows((rs) => [...rs, r]);
    setSelected(r.key);
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
        items: resolved.map(({ row, product }) => ({ style: product!.style, colour: row.colour!, size: row.size!, quantity: row.quantity, note: row.note.trim() || undefined })),
      });
      router.push(`/track?placed=${order.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span id="name-label" className="text-[15px] font-medium">
          Name:
        </span>
        <CustomerPicker
          customers={customers}
          value={customer}
          onChange={(c) => {
            setCustomer(c);
            setCustomerMissing(false);
            saveLastCustomer(c);
          }}
          invalid={customerMissing}
          focusSignal={focusCustomer}
        />
      </div>

      {!catalogue && !error && <p className="py-16 text-center text-[13.5px] text-muted">Loading catalogue…</p>}

      {catalogue && (
        <div className="mt-6 flex flex-wrap items-start gap-8 lg:mt-7">
          <section className="flex min-w-0 flex-[999_1_680px] flex-col gap-6">
            <div className="rounded-xl border border-line">
              <div className={`hidden ${ROW_GRID} items-center gap-2.5 border-b border-line px-3.5 py-2.5 text-[11.5px] font-medium uppercase tracking-[0.05em] text-muted lg:grid`}>
                <span />
                <span>Garment</span>
                <span>Fabric</span>
                <span>Colour</span>
                <span>Size</span>
                <span>Qty</span>
                <span />
                <span className="text-right">Price</span>
                <span />
              </div>

              {resolved.map(({ row: r, garment: g, product: p, next }) => (
                <div
                  key={r.key}
                  className={`grid grid-cols-[44px_minmax(0,1fr)_28px] items-center gap-2.5 border-b border-line px-3.5 py-3 lg:py-2.5 ${ROW_GRID} ${r.key === preview?.row.key ? "bg-tint" : "bg-white"}`}
                >
                  <button type="button" aria-label="Preview item" onClick={() => setSelected(r.key)} className="h-11 w-11 overflow-hidden rounded-lg">
                    {g ? (
                      <GarmentPhoto garment={g} fabric={r.fabric} colour={r.colour} className="h-11 w-11 object-[center_25%]" />
                    ) : (
                      <span className="grid h-11 w-11 place-items-center bg-gradient-to-b from-box to-tint text-edge">
                        <HangerIcon />
                      </span>
                    )}
                  </button>

                  <GarmentMenu
                    garments={garments}
                    value={g}
                    attention={next === "garment"}
                    onPick={(x) => x && update(r.key, (row) => settle({ ...row, garment: x.id }))}
                  />
                  <div className="col-span-3 grid grid-cols-2 gap-2.5 lg:contents">
                  <FabricMenu
                    placeholder="Fabric"
                    value={r.fabric}
                    available={g ? fabricsOf(g) : []}
                    disabled={!g}
                    attention={next === "fabric"}
                    onPick={(f) => update(r.key, (row) => settle({ ...row, fabric: f }))}
                  />
                  <ColourMenu
                    placeholder="Colour"
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
                  <div className="flex items-center gap-2.5 lg:contents">
                    <Stepper max={99} value={r.quantity} onChange={(quantity) => update(r.key, (row) => ({ ...row, quantity }))} />
                    <button
                      type="button"
                      aria-label={r.note ? "Edit note" : "Add a note"}
                      aria-expanded={r.noteOpen}
                      title={r.note || "Add a note"}
                      onClick={() => update(r.key, (row) => ({ ...row, noteOpen: !row.noteOpen }))}
                      className={`relative grid h-8 w-7 place-items-center rounded-lg hover:text-azure-deep ${r.noteOpen || r.note ? "text-azure-deep" : "text-muted"}`}
                    >
                      <NoteIcon />
                      {r.note && !r.noteOpen && <span className="absolute bottom-1 left-0.5 h-1.5 w-1.5 rounded-full bg-azure" />}
                    </button>
                    <span className={`ml-auto text-right text-[14.5px] font-semibold lg:ml-0 ${p ? "" : "text-muted/50"}`}>{p ? money(p.price * r.quantity) : "—"}</span>
                  </div>
                  </div>

                  <div className="col-start-3 row-start-1 flex items-center justify-end lg:col-auto lg:row-auto">
                    <button
                      type="button"
                      aria-label="Remove item"
                      onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
                      className="grid h-8 w-7 place-items-center rounded-lg text-muted hover:text-danger"
                    >
                      ✕
                    </button>
                  </div>

                  {r.noteOpen && (
                    <Input
                      autoFocus
                      aria-label="Note for this item"
                      value={r.note}
                      maxLength={500}
                      onChange={(e) => update(r.key, (row) => ({ ...row, note: e.target.value }))}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === "Escape") && update(r.key, (row) => ({ ...row, noteOpen: false }))}
                      placeholder="Note for this item, e.g. shorten sleeves"
                      className="col-span-full lg:col-start-2"
                    />
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addRow}
                className={`group flex w-full items-center gap-2.5 rounded-b-xl px-3.5 text-left hover:bg-tint ${rows.length ? "py-2.5" : "py-5"}`}
              >
                <span className="grid h-11 w-11 flex-none place-items-center rounded-lg border border-dashed border-edge text-[22px] font-light leading-none text-azure-deep group-hover:border-azure group-hover:bg-white">
                  +
                </span>
                <span className="flex flex-col">
                  <span className="text-[14.5px] font-medium">{rows.length ? "Add another item" : "Add an item"}</span>
                  {!rows.length && <span className="text-[13px] text-muted">Choose a garment, then its fabric, colour and size.</span>}
                </span>
              </button>
            </div>

            {error && <Notice onClose={() => setError(null)}>{error}</Notice>}

            <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-3 border-t border-line pt-5">
              <p className={`w-full text-[13.5px] sm:mr-auto sm:w-auto ${todo.length ? "text-pla-fg" : "text-est-fg"}`}>
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
              <Button onClick={submit} disabled={submitting} className="h-12 w-full px-7 text-[15px] sm:w-auto">
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
    <aside className="hidden w-full max-w-[300px] flex-[1_1_280px] overflow-hidden rounded-[14px] border border-line lg:block">
      <div className="relative">
        {garment ? (
          <GarmentPhoto garment={garment} fabric={row.fabric} colour={row.colour} className="aspect-[4/5] w-full" caption />
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

// The last name picked is remembered in this browser (a convenience, so storage failures are ignored).
const LAST_CUSTOMER = "eupepsia:last-customer";
function readLastCustomer(): CustomerChoice | null {
  try {
    const raw = localStorage.getItem(LAST_CUSTOMER);
    return raw ? (JSON.parse(raw) as CustomerChoice) : null;
  } catch {
    return null;
  }
}
function saveLastCustomer(c: CustomerChoice) {
  try {
    localStorage.setItem(LAST_CUSTOMER, JSON.stringify(c));
  } catch {}
}

/**
 * "Name: [ Search or add a name ]". With no customer it's a search box; once chosen it shows the name in the
 * same field shape, and clicking it brings the search back.
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
    <div ref={ref} className="relative min-w-0 flex-1 sm:flex-none">
      {!showInput && value ? (
        <button
          type="button"
          aria-label={`Name: ${value.first_name} ${value.last_name}. Change`}
          onClick={() => {
            setChanging(true);
            setOpen(true);
            requestAnimationFrame(() => input.current?.focus());
          }}
          className="flex h-12 w-full items-center gap-2.5 rounded-lg border border-edge bg-white px-3 text-left sm:w-[360px] text-[16px] font-medium text-ink hover:border-ink focus:border-azure focus:outline-none focus:ring-1 focus:ring-azure"
        >
          <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-sky text-[11px] font-semibold text-azure-deep">{initials(value)}</span>
          <span className="min-w-0 flex-1 truncate">
            {value.first_name} {value.last_name}
          </span>
          <ChevronIcon />
        </button>
      ) : (
        <label
          data-attention={!value && !invalid}
          className={`flex h-12 w-full items-center gap-2.5 rounded-lg border bg-white px-3.5 sm:w-[360px] focus-within:ring-1 ${attention} ${
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
            aria-labelledby="name-label"
            aria-invalid={invalid}
            placeholder="Search or add a name"
            className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-muted/80"
          />
        </label>
      )}

      {invalid && showInput && !open && <p className="mt-1.5 text-[13px] text-danger">Choose a name for this order.</p>}

      {open && (
        <div className={`${menuPanel} w-full sm:w-[360px]`}>
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
              {/* One line: why there's nothing to pick (if so) and the create action. */}
              <div className={matches.length ? "mt-1 border-t border-line pt-1" : ""}>
                <Option onClick={startCreate} className="py-2 text-[14px]">
                  {!matches.length && (
                    <span className="truncate font-normal text-muted">{query ? `No “${q.trim()}” yet` : "No names yet"}</span>
                  )}
                  <span className={`whitespace-nowrap text-azure-deep ${matches.length ? "" : "ml-auto"}`}>+ {query && matches.length ? `Create new “${q.trim()}”` : "Create new"}</span>
                </Option>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Pencil writing on a sheet ("write a note"); path shapes follow Lucide's square-pen (ISC).
function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
    </svg>
  );
}

function HangerIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 9V8a2 2 0 1 0-2-2" />
      <path d="M12 9l8.5 6.2a1 1 0 0 1-.6 1.8H4.1a1 1 0 0 1-.6-1.8z" />
    </svg>
  );
}
