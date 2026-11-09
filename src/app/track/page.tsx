import type { Metadata } from "next";
import { Suspense } from "react";
import { OrdersList } from "@/components/OrdersList";

export const metadata: Metadata = { title: "Track orders" };

export default function TrackPage() {
  return (
    <Suspense>
      <OrdersList />
    </Suspense>
  );
}
