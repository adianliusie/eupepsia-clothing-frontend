"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createOrder, getCatalogue, money, type Catalogue, type Fabric, type Order } from "@/lib/api";
import { Button, Field, Input, Notice, PageHead, Segmented, Select, eyebrow } from "@/components/ui";

type Line = { key: number; fabric: Fabric; style: string; colour: string; size: string; quantity: number };

let nextKey = 1;

export function OrderForm() {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Order | null>(null);

  useEffect(() => {
    getCatalogue()
      .then((c) => {
        setCatalogue(c);
        setLines([newLine(c, "wool")]);
      })
      .catch((e) => setError(e.message));
  }, []);

  function newLine(c: Catalogue, fabric: Fabric): Line {
    const product = c.products.find((p) => p.fabric === fabric)!;
    return { key: nextKey++, fabric, style: product.style, colour: c.colours[fabric][0].code, size: product.sizes[0], quantity: 1 };
  }

  function update(key: number, patch: Partial<Line>) {
    setLines((ls) =>
      ls.map((l) => {
        if (l.key !== key || !catalogue) return l;
        const next = { ...l, ...patch };
        if (patch.fabric && patch.fabric !== l.fabric) {
          const p = catalogue.products.find((x) => x.fabric === patch.fabric)!;
          next.style = p.style;
          next.size = p.sizes[0];
          next.colour = catalogue.colours[patch.fabric][0].code;
        } else if (patch.style) {
          const p = catalogue.products.find((x) => x.style === patch.style)!;
          if (!p.sizes.includes(next.size)) next.size = p.sizes[0];
        }
        return next;
      }),
    );
  }

  const product = (style: string) => catalogue?.products.find((p) => p.style === style);
  const total = lines.reduce((sum, l) => sum + (product(l.style)?.price ?? 0) * l.quantity, 0);
  const canSubmit = firstName.trim() && lastName.trim() && lines.length > 0 && lines.every((l) => l.quantity >= 1) && !submitting;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const order = await createOrder({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        notes: notes.trim() || undefined,
        items: lines.map(({ style, colour, size, quantity }) => ({ style, colour, size, quantity })),
      });
      setDone(order);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <span className={eyebrow}>Order placed</span>
        <h1 className="mt-3 text-[40px] font-normal leading-[1.05] tracking-[-0.02em]">{done.order_number}</h1>
        <p className="mt-4 text-muted">
          {done.customer.first_name} {done.customer.last_name} · {done.items.length} {done.items.length === 1 ? "item" : "items"} ·{" "}
          {money(done.total)}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href={`/orders/${done.id}`}>
            <Button variant="outline">View order</Button>
          </Link>
          <Button
            onClick={() => {
              setDone(null);
              setFirstName("");
              setLastName("");
              setNotes("");
              setLines(catalogue ? [newLine(catalogue, "wool")] : []);
            }}
          >
            New order
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHead title="New order" />

      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" autoFocus />
        </Field>
        <Field label="Last name">
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
        </Field>
      </section>

      <div className="mt-10 flex items-baseline justify-between border-t border-line pt-6">
        <h2 className="text-[24px] font-normal tracking-[-0.02em]">Items</h2>
        <span className="text-sm text-muted">Prices in USD</span>
      </div>

      {!catalogue && !error && <p className="py-10 text-center text-sm text-muted">Loading catalogue…</p>}

      <div className="mt-4 flex flex-col gap-3">
        {catalogue &&
          lines.map((l, idx) => {
            const p = product(l.style)!;
            return (
              <div key={l.key} className="rounded-2xl bg-box p-5">
                <div className="flex items-center justify-between">
                  <span className={eyebrow}>Item {idx + 1}</span>
                  {lines.length > 1 && (
                    <button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))} className="text-sm text-muted hover:text-danger">
                      Remove
                    </button>
                  )}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[180px_1fr]">
                  <Field label="Fabric">
                    <Segmented
                      value={l.fabric}
                      options={[
                        { value: "wool", label: "Wool" },
                        { value: "cotton", label: "Cotton" },
                      ]}
                      onChange={(fabric) => update(l.key, { fabric })}
                    />
                  </Field>
                  <Field label="Garment">
                    <Select value={l.style} onChange={(e) => update(l.key, { style: e.target.value })} className="bg-white">
                      {catalogue.products
                        .filter((x) => x.fabric === l.fabric)
                        .map((x) => (
                          <option key={x.style} value={x.style}>
                            {x.name} — {money(x.price)}
                          </option>
                        ))}
                    </Select>
                  </Field>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_140px_110px_110px]">
                  <Field label="Colour">
                    <Select value={l.colour} onChange={(e) => update(l.key, { colour: e.target.value })} className="bg-white">
                      {catalogue.colours[l.fabric].map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} · {c.code}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Size">
                    <Select value={l.size} onChange={(e) => update(l.key, { size: e.target.value })} className="bg-white">
                      {p.sizes.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Qty">
                    <Input
                      type="number"
                      min={1}
                      value={l.quantity}
                      onChange={(e) => update(l.key, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                      className="bg-white text-center"
                    />
                  </Field>
                  <Field label="Line total">
                    <span className="flex min-h-12 items-center justify-end pr-1 text-[15px] font-medium">{money(p.price * l.quantity)}</span>
                  </Field>
                </div>
              </div>
            );
          })}
        {catalogue && (
          <button
            type="button"
            onClick={() => setLines((ls) => [...ls, newLine(catalogue, ls[ls.length - 1]?.fabric ?? "wool")])}
            className="min-h-12 rounded-2xl border border-dashed border-azure text-[15px] font-medium text-azure hover:bg-sky"
          >
            + Add another item
          </button>
        )}
      </div>

      <section className="mt-8">
        <Field label="Notes (optional)">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Anything we should know"
            className="w-full rounded-2xl bg-tint px-5 py-3.5 text-[15px] outline-none ring-azure placeholder:text-muted/70 focus:ring-2"
          />
        </Field>
      </section>

      {error && (
        <div className="mt-6">
          <Notice>{error}</Notice>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
        <div className="flex items-baseline gap-3">
          <span className={eyebrow}>Total</span>
          <span className="text-[28px] font-normal tracking-[-0.02em]">{money(total)}</span>
        </div>
        <Button onClick={submit} disabled={!canSubmit}>
          {submitting ? "Placing order…" : "Place order"}
        </Button>
      </div>
    </div>
  );
}
