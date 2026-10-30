import type { Metadata } from "next";
import { Suspense } from "react";
import { OrdersList } from "@/components/OrdersList";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <Suspense>
      <OrdersList />
    </Suspense>
  );
}
