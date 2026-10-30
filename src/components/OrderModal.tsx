"use client";

import { useEffect, useRef, useState } from "react";
import { createOrder, getCatalogue, money, type Catalogue, type Fabric, type Order, type Product } from "@/lib/api";
import { Button, Field, Input, Notice, Segmented, Pills, Stepper, label } from "@/components/ui";
import { GarmentIcon } from "@/components/GarmentIcon";
import { ColourButton, ColourPicker } from "@/components/ColourPicker";

type Line = { key: number; fabric: Fabric; style: string; colour: string; size: string; quantity: number };
let nextKey = 1;

const TYPE_ORDER = ["Top", "Tunic", "Dress", "Cardigan", "Hoodie", "Pants", "Shawl"];
const variantsFor = (c: Catalogue, fabric: Fabric, type: string) => c.products.filter((p) => p.fabric === fabric && p.type === type);

function newLine(c: Catalogue, fabric: Fabric): Line {
  const p = c.products.find((x) => x.fabric === fabric)!;
  return { key: nextKey++, fabric, style: p.style, colour: c.colours[fabric][0].code, size: p.sizes[1] ?? p.sizes[0], quantity: 1 };
}

// Moving to another product keeps size and colour when they still apply.
function moveTo(l: Line, p: Product, c: Catalogue): Line {
  const next = { ...l, fabric: p.fabric, style: p.style };
  if (!p.sizes.includes(next.size)) next.size = p.sizes[0];
  if (!c.colours[p.fabric].some((x) => x.code === next.colour)) next.colour = c.colours[p.fabric][0].code;
  return next;
}

export function OrderModal({ open, onClose, onPlaced }: { open: boolean; onClose: () => void; onPlaced: (o: Order) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [picking, setPicking] = useState<number | null>(null); // line key with the shade picker open
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCatalogue()
      .then((c) => {
        setCatalogue(c);
        setLines((ls) => (ls.length ? ls : [newLine(c, "wool")]));
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  function reset() {
    setFirstName("");
    setLastName("");
    setNotes("");
    setError(null);
    setLines(catalogue ? [newLine(catalogue, "wool")] : []);
  }

  function update(key: number, fn: (l: Line, c: Catalogue) => Line) {
    if (!catalogue) return;
    setLines((ls) => ls.map((l) => (l.key === key ? fn(l, catalogue) : l)));
  }

  const product = (style: string) => catalogue?.products.find((p) => p.style === style);
  const pieces = lines.reduce((n, l) => n + l.quantity, 0);
  const total = lines.reduce((sum, l) => sum + (product(l.style)?.price ?? 0) * l.quantity, 0);
  const missing = !firstName.trim() ? "Enter the customer's first name" : !lastName.trim() ? "Enter the customer's last name" : lines.length === 0 ? "Add at least one garment" : null;
  const pickingLine = lines.find((l) => l.key === picking);

  async function submit() {
    if (missing) return setError(missing);
    setSubmitting(true);
    setError(null);
    try {
      const order = await createOrder({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        notes: notes.trim() || undefined,
        items: lines.map(({ style, colour, size, quantity }) => ({ style, colour, size, quantity })),
      });
      onPlaced(order);
      reset();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(760px,calc(100vw-24px))] max-h-[calc(100vh-48px)] overflow-hidden rounded-2xl bg-white p-0 text-ink shadow-[0_30px_80px_-20px_rgba(16,33,63,0.5)] backdrop:bg-ink/50"
    >
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex max-h-[calc(100vh-48px)] flex-col"
      >
        <header className="flex items-center justify-between gap-4 px-6 pt-5 pb-3">
          <h2 className="text-[22px] font-semibold tracking-tight">New order</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-tint hover:text-ink">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 2l10 10M12 2L2 12" /></svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 pb-5">
          <section className="grid gap-3 sm:grid-cols-2">
            <Field label="First name">
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
            </Field>
            <Field label="Last name">
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
          </section>

          {!catalogue && !error && <p className="py-10 text-center text-[13px] text-muted">Loading catalogue…</p>}

          {catalogue && (
            <section className="mt-5 flex flex-col gap-3">
              {lines.map((l, idx) => {
                const p = product(l.style)!;
                const variants = variantsFor(catalogue, l.fabric, p.type);
                const colour = catalogue.colours[l.fabric].find((c) => c.code === l.colour);
                return (
                  <div key={l.key} className="rounded-xl bg-box p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold">
                        Garment {idx + 1}
                        <span className="ml-2 font-normal text-muted">
                          {p.name} · {money(p.price)}
                        </span>
                      </span>
                      <div className="flex items-center gap-3">
                        <Segmented
                          value={l.fabric}
                          options={[
                            { value: "wool", label: "Wool" },
                            { value: "cotton", label: "Cotton" },
                          ]}
                          onChange={(fabric) =>
                            update(l.key, (line, cat) => {
                              const same = cat.products.filter((x) => x.fabric === fabric);
                              const target = same.find((x) => x.type === p.type && x.variant === p.variant) ?? same.find((x) => x.type === p.type) ?? same[0];
                              return moveTo(line, target, cat);
                            })
                          }
                        />
                        {lines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                            aria-label="Remove garment"
                            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-white hover:text-danger"
                          >
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 2l10 10M12 2L2 12" /></svg>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-7 gap-1.5">
                      {TYPE_ORDER.map((t) => {
                        const available = variantsFor(catalogue, l.fabric, t);
                        const on = p.type === t;
                        const off = available.length === 0;
                        return (
                          <button
                            key={t}
                            type="button"
                            disabled={off}
                            title={off ? `${t}: ${l.fabric === "wool" ? "cotton" : "wool"} only` : undefined}
                            onClick={() => update(l.key, (line, cat) => moveTo(line, available[0], cat))}
                            className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[12px] font-medium disabled:cursor-not-allowed disabled:opacity-30 ${
                              on ? "border-ink bg-ink text-white" : "border-edge bg-white text-ink hover:border-ink"
                            }`}
                          >
                            <GarmentIcon type={t} size={30} className={on ? "text-white" : "text-muted"} />
                            {t}
                          </button>
                        );
                      })}
                    </div>

                    {variants.length > 1 && (
                      <div className="mt-3">
                        <span className={label}>Style</span>
                        <div className="mt-1.5">
                          <Pills
                            value={l.style}
                            options={variants.map((v) => ({ value: v.style, label: `${v.variant} · ${money(v.price)}` }))}
                            onChange={(style) => update(l.key, (line, cat) => moveTo(line, cat.products.find((x) => x.style === style)!, cat))}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-3 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <Field label="Colour">
                        <ColourButton colour={colour} onClick={() => setPicking(l.key)} />
                      </Field>
                      <Field label="Size">
                        {p.sizes.length > 1 ? (
                          <Pills value={l.size} options={p.sizes.map((s) => ({ value: s, label: s }))} onChange={(size) => update(l.key, (line) => ({ ...line, size }))} size="md" />
                        ) : (
                          <span className="flex h-9 items-center text-[13.5px] text-muted">One size</span>
                        )}
                      </Field>
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-3 border-t border-line pt-3">
                      <Field label="Quantity">
                        <Stepper value={l.quantity} onChange={(quantity) => update(l.key, (line) => ({ ...line, quantity }))} />
                      </Field>
                      <span className="text-[17px] font-semibold">{money(p.price * l.quantity)}</span>
                    </div>
                  </div>
                );
              })}
              <Button variant="outline" className="self-start" onClick={() => setLines((ls) => [...ls, newLine(catalogue, ls[ls.length - 1]?.fabric ?? "wool")])}>
                + Add another garment
              </Button>
            </section>
          )}

          <section className="mt-5">
            <Field label="Notes" hint="optional">
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gift wrap, delivery date…" />
            </Field>
          </section>

          {error && (
            <div className="mt-4">
              <Notice onClose={() => setError(null)}>{error}</Notice>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-3.5">
          <div className="flex items-baseline gap-2.5">
            <span className="text-[22px] font-semibold tracking-tight">{money(total)}</span>
            <span className="text-[13px] text-muted">
              {pieces} {pieces === 1 ? "piece" : "pieces"}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !catalogue}>
              {submitting ? "Placing order…" : "Place order"}
            </Button>
          </div>
        </footer>
      </form>

      {catalogue && pickingLine && (
        <ColourPicker
          open
          fabric={pickingLine.fabric}
          colours={catalogue.colours[pickingLine.fabric]}
          value={pickingLine.colour}
          onPick={(colour) => update(pickingLine.key, (line) => ({ ...line, colour }))}
          onClose={() => setPicking(null)}
        />
      )}
    </dialog>
  );
}
