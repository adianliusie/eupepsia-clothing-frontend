"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDate, getCatalogue, getOrder, money, updateStatus, type Catalogue, type Order, type Status, type OrderItem, type Product, type Colour } from "@/lib/api";
import { Button, Notice, StatusSelect, Swatch } from "@/components/ui";
import { eyebrow } from "@/lib/styles";
import { colourOf, fabricLabel, productByStyle } from "@/lib/garments";

export function OrderDetail({ id }: { id: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getOrder(id), getCatalogue()])
      .then(([o, c]) => {
        setOrder(o);
        setCatalogue(c);
      })
      .catch((e) => setError(e.message));
  }, [id]);

  async function changeStatus(status: Status) {
    if (!order) return;
    setBusy(true);
    setError(null);
    try {
      setOrder(await updateStatus(order.id, status));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (error && !order) return <Notice>{error}</Notice>;
  if (!order || !catalogue) return <p className="py-16 text-center text-sm text-muted">Loading order…</p>;

  const lines = order.items.map((i) => {
    const p = productByStyle(catalogue, i.style);
    return { i, p, c: p && colourOf(catalogue, p.fabric, i.colour) };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/track">
        <Button variant="outline" size="sm">← All orders</Button>
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className={eyebrow}>Order</span>
          <h1 className="mt-1 text-[32px] font-normal sm:text-[40px] leading-[1.05] tracking-[-0.02em]">{order.order_number}</h1>
        </div>
        <StatusSelect value={order.status} busy={busy} onChange={changeStatus} />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line pt-5 md:mt-8 md:grid-cols-3 md:gap-6 md:pt-6">
        <div className="col-span-2 md:col-span-1">
          <dt className={eyebrow}>Customer</dt>
          <dd className="mt-1">
            {order.customer.first_name} {order.customer.last_name}
          </dd>
        </div>
        <div>
          <dt className={eyebrow}>Placed</dt>
          <dd className="mt-1">{formatDate(order.created_at)}</dd>
        </div>
        <div>
          <dt className={eyebrow}>Last updated</dt>
          <dd className="mt-1">{formatDate(order.updated_at)}</dd>
        </div>
      </dl>

      {/* Phones: one block per item. */}
      <ul className="mt-6 border-t border-line md:hidden">
        {lines.map(({ i, p, c }, idx) => (
          <li key={idx} className="border-b border-line py-3.5">
            <div className="flex items-start justify-between gap-3">
              <ItemName item={i} product={p} />
              <span className="whitespace-nowrap font-medium">{money(i.line_total)}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[14px] text-muted">
              <ItemColour item={i} colour={c} swatch={16} />
              <span>· {i.size}</span>
              <span>
                · {i.quantity} × {money(i.unit_price)}
              </span>
            </div>
            {i.note && <p className="mt-1.5 text-[14px] italic text-muted">“{i.note}”</p>}
          </li>
        ))}
        <li className="flex items-baseline justify-between py-4">
          <span className={eyebrow}>Total</span>
          <span className="text-[22px] font-normal tracking-[-0.02em]">{money(order.total)}</span>
        </li>
      </ul>

      <table className="mt-8 hidden w-full border-t border-line text-[15px] md:table">
        <thead>
          <tr className="text-left text-[11px] font-medium uppercase tracking-[0.06em] text-muted">
            <th className="py-3 pr-4 font-medium">Garment</th>
            <th className="py-3 pr-4 font-medium">Colour</th>
            <th className="py-3 pr-4 font-medium">Size</th>
            <th className="py-3 pr-4 text-right font-medium">Qty</th>
            <th className="py-3 pr-4 text-right font-medium">Unit</th>
            <th className="py-3 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map(({ i, p, c }, idx) => (
            <tr key={idx} className="border-t border-line">
              <td className="py-3.5 pr-4">
                <ItemName item={i} product={p} />
                {i.note && <p className="mt-1 text-[13.5px] italic text-muted">“{i.note}”</p>}
              </td>
              <td className="py-3.5 pr-4 text-muted">
                <span className="inline-flex items-center gap-2">
                  <ItemColour item={i} colour={c} swatch={18} />
                </span>
              </td>
              <td className="py-3.5 pr-4 text-muted">{i.size}</td>
              <td className="py-3.5 pr-4 text-right">{i.quantity}</td>
              <td className="py-3.5 pr-4 text-right text-muted">{money(i.unit_price)}</td>
              <td className="py-3.5 text-right font-medium">{money(i.line_total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-line">
            <td colSpan={5} className="py-4 text-right">
              <span className={eyebrow}>Total</span>
            </td>
            <td className="py-4 text-right text-[22px] font-normal tracking-[-0.02em]">{money(order.total)}</td>
          </tr>
        </tfoot>
      </table>

      {order.notes && (
        <div className="mt-6 rounded-2xl bg-box px-5 py-4">
          <span className={eyebrow}>Notes</span>
          <p className="mt-1.5 text-[15px] leading-relaxed">{order.notes}</p>
        </div>
      )}

      {error && (
        <div className="mt-6">
          <Notice>{error}</Notice>
        </div>
      )}
    </div>
  );
}

// How an item reads, shared by the phone list and the desktop table.
function ItemName({ item, product }: { item: OrderItem; product: Product | undefined }) {
  return (
    <div>
      <div className="font-medium">{product?.name ?? item.style}</div>
      <div className="mt-0.5 text-[13px] text-muted">
        {product && `${fabricLabel(product.fabric)} · `}
        {item.style}
      </div>
    </div>
  );
}

function ItemColour({ item, colour, swatch }: { item: OrderItem; colour: Colour | undefined; swatch: number }) {
  return (
    <>
      {colour && <Swatch hex={colour.hex} size={swatch} />}
      <span className="text-ink">{colour?.name ?? item.colour}</span>
      <span className="text-muted/60">{item.colour}</span>
    </>
  );
}
