import type { Metadata } from "next";
import { NewOrder } from "@/components/NewOrder";

export const metadata: Metadata = { title: "New order" };

export default function OrdersPage() {
  return <NewOrder />;
}
