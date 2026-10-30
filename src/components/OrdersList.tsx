"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDate, getCatalogue, listOrders, money, updateStatus, type Catalogue, type Fabric, type Order, type OrderQuery, type Page, type Status } from "@/lib/api";
import { Button, Notice, PageHead, Select, StatusSelect, Swatch, control } from "@/components/ui";
import { OrderModal } from "@/components/OrderModal";

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
const TYPES = ["Top", "Tunic", "Dress", "Cardigan", "Hoodie", "Pants", "Shawl"];
const PAGE_SIZE = 50;

type Sortable = "created_at" | "order_number" | "total" | "status";

export function OrdersList() {
  const router = useRouter();
  const params = useSearchParams();
  const modalOpen = params.get("new") === "1";

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
  const [type, setType] = useState("");
  const [fabric, setFabric] = useState<Fabric | "">("");
  const [colour, setColour] = useState("");
  const [sort, setSort] = useState("-created_at");
  const [pageNo, setPageNo] = useState(1);

  useEffect(() => {
    getCatalogue().then(setCatalogue).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const query: OrderQuery = useMemo(
    () => ({ status, q: debouncedQ, customer_id: customer?.id, type, fabric, colour, sort, page: pageNo, page_size: PAGE_SIZE }),
    [status, debouncedQ, customer, type, fabric, colour, sort, pageNo],
  );

  const load = useCallback(() => {
    setLoading(true);
    listOrders(query)
      .then((p) => {
        setPage(p);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(load, [load]);
  // any filter change goes back to page 1
  useEffect(() => setPageNo(1), [status, debouncedQ, customer, type, fabric, colour, sort]);

  const productName = (style: string) => catalogue?.products.find((p) => p.style === style)?.name ?? style;
  const colourOf = (style: string, code: string) => {
    const p = catalogue?.products.find((x) => x.style === style);
    return p ? catalogue?.colours[p.fabric].find((c) => c.code === code) : undefined;
  };
  const colourOptions = useMemo(() => {
    if (!catalogue) return [];
    const list = fabric ? catalogue.colours[fabric] : [...catalogue.colours.wool, ...catalogue.colours.cotton];
    return list.map((c) => ({ ...c, fabric: fabric || (catalogue.colours.wool.includes(c) ? "wool" : "cotton") }));
  }, [catalogue, fabric]);

  const openModal = () => router.push("/orders?new=1");
  const closeModal = () => router.push("/orders");

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

  const filtersOn = Boolean(debouncedQ || customer || type || fabric || colour);
  function clearFilters() {
    setQ("");
    setCustomer(null);
    setType("");
    setFabric("");
    setColour("");
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
      <PageHead title="Orders" action={<Button onClick={openModal}>New order</Button>} />

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

      <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(200px,1.4fr)_1fr_1fr_1.2fr_auto]">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or order number" className={control} />
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Any garment</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Select
          value={fabric}
          onChange={(e) => {
            setFabric(e.target.value as Fabric | "");
            setColour("");
          }}
        >
          <option value="">Any fabric</option>
          <option value="wool">Wool</option>
          <option value="cotton">Cotton</option>
        </Select>
        <Select value={colour} onChange={(e) => setColour(e.target.value)}>
          <option value="">Any colour</option>
          {colourOptions.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} · {c.code}
              {fabric ? "" : ` (${c.fabric})`}
            </option>
          ))}
        </Select>
        <Button variant="outline" onClick={clearFilters} disabled={!filtersOn}>
          Clear
        </Button>
      </div>

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
            <Link href={`/orders/${placed.id}`} className="font-medium underline underline-offset-2">
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
            <Button variant="ghost" size="sm" disabled={pageNo <= 1} onClick={() => setPageNo((p) => p - 1)}>
              ← Prev
            </Button>
            <span>
              Page {pageNo} of {lastPage}
            </span>
            <Button variant="ghost" size="sm" disabled={pageNo >= lastPage} onClick={() => setPageNo((p) => p + 1)}>
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
                      <Link href={`/orders/${o.id}`} className="hover:text-azure">
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
                          const c = colourOf(i.style, i.colour);
                          return (
                            <li key={idx} className="flex items-center gap-2 whitespace-nowrap">
                              {c && <Swatch hex={c.hex} size={12} />}
                              <span className="text-ink">{productName(i.style)}</span>
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
            <button type="button" onClick={openModal} className="font-medium text-azure hover:underline">
              Place one
            </button>
          )}
        </div>
      )}

      <OrderModal
        open={modalOpen}
        onClose={closeModal}
        onPlaced={(o) => {
          setPlaced(o);
          closeModal();
          clearFilters();
          setStatus(OPEN);
          setSort("-created_at");
          load();
        }}
      />
    </>
  );
}
