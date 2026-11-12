const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export type Fabric = "cotton" | "wool";
export type Status = "pending" | "processing" | "complete" | "delivered" | "cancelled";

export type Product = { style: string; name: string; type: string; variant: string | null; length: string | null; fabric: Fabric; sizes: string[]; price: number };
export type Colour = { code: string; name: string; hex: string };
export type Catalogue = { products: Product[]; colours: Record<Fabric, Colour[]> };
export type Customer = { id: string; first_name: string; last_name: string };

export type OrderItem = { style: string; colour: string; size: string; quantity: number; unit_price: number; line_total: number; note?: string | null };
export type Order = {
  id: string;
  order_number: string;
  customer: Customer;
  status: Status;
  items: OrderItem[];
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type NewOrder = {
  first_name: string;
  last_name: string;
  items: { style: string; colour: string; size: string; quantity: number; note?: string }[];
  notes?: string;
};

export const STATUSES: Status[] = ["pending", "processing", "complete", "delivered", "cancelled"];

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) throw new Error(body.message ?? `Request failed (${res.status})`);
  return body.data as T;
}

let cataloguePromise: Promise<Catalogue> | null = null;
export function getCatalogue(): Promise<Catalogue> {
  cataloguePromise ??= request<Catalogue>("/catalogue");
  return cataloguePromise;
}

export type OrderQuery = {
  status?: string; // "pending,processing" | "all" | one status
  q?: string;
  customer_id?: string;
  type?: string;
  fabric?: Fabric | "";
  style?: string; // one code, or several comma-separated
  colour?: string;
  size?: string;
  sort?: string; // "-created_at" etc
  page?: number;
  page_size?: number;
};
export type Page<T> = { items: T[]; page: number; page_size: number; total: number };

export function listOrders(query: OrderQuery = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== "" && v !== null) qs.set(k, String(v));
  const s = qs.toString();
  return request<Page<Order>>(`/orders${s ? `?${s}` : ""}`);
}
export const getOrder = (id: string) => request<Order>(`/orders/${id}`);
export const listCustomers = () => request<Customer[]>("/users");
export const createOrder = (body: NewOrder) => request<Order>("/orders", { method: "POST", body: JSON.stringify(body) });
export const updateStatus = (id: string, status: Status) =>
  request<Order>(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });

export const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
