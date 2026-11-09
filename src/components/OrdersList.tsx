"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { formatDate, getCatalogue, getOrder, listOrders, money, updateStatus, type Catalogue, type Order, type OrderQuery, type Page, type Status } from "@/lib/api";
import { Button, Notice, PageHead, StatusSelect, Swatch, control } from "@/components/ui";
import { ColourMenu, FabricMenu, GarmentMenu, SizeMenu } from "@/components/CatalogueMenus";
import { FABRICS, allSizes, colourOf, fabricsOf, fit, garmentsOf, productByStyle, sizesOf, type Choice } from "@/lib/garments";

const OPEN = "pending,processing";
const STATUS_TABS: { value: string; label: string }[] = [
  { value: OPEN, label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "complete", label: "Complete" },
  { value: "sent", label: "Sent" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];
const PAGE_SIZE = 50;
const NO_CHOICE: Choice = { fabric: null, colour: null, size: null };

type Sortable = "created_at" | "order_number" | "total" | "status";

export function OrdersList() {
  const router = useRouter();
  const params = useSearchParams();

  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [page, setPage] = useState<Page<Order> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Order | null>(null);

  // filters
  const [status, setStatus] = useState(OPEN);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [customer, setCustomer] = useState<{ id: string; name: string } | null>(null);
  const [garmentName, setGarmentName] = useState<string | null>(null);
  const [choice, setChoice] = useState<Choice>(NO_CHOICE);
  const [sort, setSort] = useState("-created_at");

  useEffect(() => {
    getCatalogue().then(setCatalogue).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const garments = useMemo(() => (catalogue ? garmentsOf(catalogue) : []), [catalogue]);
  const garment = garments.find((g) => g.name === garmentName) ?? null;
  const { fabric, colour, size } = choice;

  // A garment filter is its style code(s): one per fabric it comes in, narrowed by the fabric filter.
  const style = garment?.versions
    .filter((v) => !fabric || v.fabric === fabric)
    .map((v) => v.style)
    .join(",");
  const filters = { status, q: debouncedQ, customer_id: customer?.id, sort, colour: colour ?? "", size: size ?? "", ...(style ? { style } : { fabric: fabric ?? "" }) };

  // Any filter change goes back to page 1: the page number belongs to one set of filters.
  const filterKey = JSON.stringify(filters);
  const [paging, setPaging] = useState({ key: filterKey, n: 1 });
  const pageNo = paging.key === filterKey ? paging.n : 1;
  const goTo = (n: number) => setPaging({ key: filterKey, n });

  const query: OrderQuery = useMemo(() => ({ ...JSON.parse(filterKey), page: pageNo, page_size: PAGE_SIZE }), [filterKey, pageNo]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    listOrders(query)
      .then((p) => {
        if (!live) return;
        setPage(p);
        setError(null);
      })
      .catch((e) => live && setError(e.message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [query]);

  // A freshly placed order arrives as ?placed=<id>.
  useEffect(() => {
    const placedId = params.get("placed");
    if (placedId) {
      getOrder(placedId).then(setPlaced).catch(() => {});
      router.replace("/track");
    }
  }, [params, router]);

  function toggleSort(col: Sortable) {
    setSort((s) => (s === `-${col}` ? col : `-${col}`));
  }
  const sortMark = (col: Sortable) => (sort === col ? " ↑" : sort === `-${col}` ? " ↓" : "");

  async function changeStatus(order: Order, s: Status) {
    setBusy(order.id);
    try {
      const updated = await updateStatus(order.id, s);
      setPage((prev) => (prev ? { ...prev, items: prev.items.map((o) => (o.id === order.id ? updated : o)) } : prev));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const filtersOn = Boolean(debouncedQ || customer || garmentName || fabric || colour || size);
  function clearFilters() {
    setQ("");
    setCustomer(null);
    setGarmentName(null);
    setChoice(NO_CHOICE);
  }

  // Changing one filter drops the others that no longer fit it.
  function refine(name: string | null, next: Choice) {
    setGarmentName(name);
    if (catalogue) setChoice(fit(catalogue, garments.find((g) => g.name === name) ?? null, next));
  }

  const total = page?.total ?? 0;
  const from = total === 0 ? 0 : (page!.page - 1) * page!.page_size + 1;
  const to = page ? Math.min(total, page.page * page.page_size) : 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const th = (label: string, col?: Sortable, right = false) => (
    <th className={`py-2.5 pr-4 font-medium ${right ? "text-right" : "text-left"}`}>
      {col ? (
        <button type="button" onClick={() => toggleSort(col)} className={`hover:text-ink ${sort.replace("-", "") === col ? "text-ink" : ""}`}>
          {label}
          {sortMark(col)}
        </button>
      ) : (
        label
      )}
    </th>
  );

  return (
    <>
      <PageHead
        title="Track orders"
        action={
          <Link href="/orders">
            <Button>New order</Button>
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-1 border-y border-line py-2.5">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setStatus(t.value)}
            className={`inline-flex h-8 items-center rounded-lg px-3 text-[13.5px] font-medium ${t.value === status ? "bg-ink text-white" : "text-muted hover:bg-tint hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {catalogue && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(200px,1.2fr)_minmax(0,1.4fr)_120px_minmax(0,1.1fr)_104px_auto]">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or order number" className={control} />
          <GarmentMenu garments={garments} value={garment} onPick={(g) => refine(g?.name ?? null, choice)} placeholder="Any garment" anyLabel="Any garment" />
          <FabricMenu value={fabric} available={garment ? fabricsOf(garment) : FABRICS} onPick={(f) => refine(garmentName, { ...choice, fabric: f })} placeholder="Any fabric" anyLabel="Any fabric" />
          <ColourMenu
            catalogue={catalogue}
            fabrics={fabric ? [fabric] : garment ? fabricsOf(garment) : FABRICS}
            value={colour}
            onPick={(c) => setChoice({ ...choice, colour: c })}
            placeholder="Any colour"
            anyLabel="Any colour"
          />
          <SizeMenu
            sizes={garment ? sizesOf(garment, fabric) : allSizes(catalogue)}
            value={size}
            onPick={(s) => setChoice({ ...choice, size: s })}
            placeholder="Any size"
            anyLabel="Any size"
          />
          <Button variant="outline" onClick={clearFilters} disabled={!filtersOn}>
            Clear
          </Button>
        </div>
      )}

      {customer && (
        <div className="mt-3 flex items-center gap-2 text-[13.5px]">
          <span className="text-muted">Showing orders for</span>
          <span className="inline-flex items-center gap-2 rounded-lg bg-tint px-2.5 py-1 font-medium">
            {customer.name}
            <button type="button" onClick={() => setCustomer(null)} aria-label="Clear customer filter" className="text-muted hover:text-ink">
              ✕
            </button>
          </span>
        </div>
      )}

      {placed && (
        <div className="mt-4">
          <Notice kind="success" onClose={() => setPlaced(null)}>
            Order {placed.order_number} placed for {placed.customer.first_name} {placed.customer.last_name}, {money(placed.total)}.{" "}
            <Link href={`/track/${placed.id}`} className="font-medium underline underline-offset-2">
              View
            </Link>
          </Notice>
        </div>
      )}
      {error && (
        <div className="mt-4">
          <Notice onClose={() => setError(null)}>{error}</Notice>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-[13px] text-muted">
        <span>{loading && !page ? "Loading…" : total === 0 ? "No orders" : `${from}–${to} of ${total}`}</span>
        {lastPage > 1 && (
          <span className="flex items-center gap-1">
            <Button variant="ghost" size="sm" disabled={pageNo <= 1} onClick={() => goTo(pageNo - 1)}>
              ← Prev
            </Button>
            <span>
              Page {pageNo} of {lastPage}
            </span>
            <Button variant="ghost" size="sm" disabled={pageNo >= lastPage} onClick={() => goTo(pageNo + 1)}>
              Next →
            </Button>
          </span>
        )}
      </div>

      {page && page.items.length > 0 && (
        <div className={`overflow-x-auto ${loading ? "opacity-60" : ""}`}>
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-[12.5px] font-medium text-muted">
                {th("Order", "order_number")}
                {th("Date", "created_at")}
                {th("Customer")}
                {th("Garments")}
                {th("Total", "total", true)}
                {th("Status", "status")}
              </tr>
            </thead>
            <tbody>
              {page.items.map((o) => {
                const qty = o.items.reduce((n, i) => n + i.quantity, 0);
                const isNew = placed?.id === o.id;
                const name = `${o.customer.first_name} ${o.customer.last_name}`;
                return (
                  <tr key={o.id} className={`border-t border-line align-top ${isNew ? "bg-est-bg/40" : ""}`}>
                    <td className="py-3 pr-4 font-medium whitespace-nowrap">
                      <Link href={`/track/${o.id}`} className="hover:text-azure">
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap text-muted">{formatDate(o.created_at)}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <button type="button" onClick={() => setCustomer({ id: o.customer.id, name })} className="hover:text-azure" title="Show this customer's orders">
                        {name}
                      </button>
                    </td>
                    <td className="py-3 pr-4 text-muted">
                      <ul className="flex flex-col gap-0.5">
                        {o.items.map((i, idx) => {
                          const p = catalogue && productByStyle(catalogue, i.style);
                          const c = p ? colourOf(catalogue, p.fabric, i.colour) : undefined;
                          return (
                            <li key={idx} className="flex items-center gap-2 whitespace-nowrap">
                              {c && <Swatch hex={c.hex} size={12} />}
                              <span className="text-ink">{p?.name ?? i.style}</span>
                              <span>
                                {c?.name ?? i.colour} · {i.size}
                                {i.quantity > 1 ? ` · ×${i.quantity}` : ""}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      {qty > 1 && o.items.length > 1 && <span className="text-[12px] text-muted/70">{qty} pieces</span>}
                    </td>
                    <td className="py-3 pr-4 text-right whitespace-nowrap font-medium">{money(o.total)}</td>
                    <td className="py-3">
                      <StatusSelect value={o.status} busy={busy === o.id} onChange={(s) => changeStatus(o, s)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {page && page.items.length === 0 && !loading && (
        <div className="py-16 text-center text-[13.5px] text-muted">
          {filtersOn || status !== OPEN ? "Nothing matches these filters." : "No open orders."}{" "}
          {!filtersOn && status === OPEN && (
            <Link href="/orders" className="font-medium text-azure hover:underline">
              Place one
            </Link>
          )}
        </div>
      )}
    </>
  );
}
