import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import { container } from "@/lib/styles";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Eupepsia Orders", template: "%s | Eupepsia Orders" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans text-ink">
        <header className="border-b border-line">
          <div className={`${container} flex min-h-16 items-center justify-between gap-8 py-3`}>
            <Link href="/orders" className="text-lg font-semibold tracking-tight">
              Eupepsia <span className="font-normal text-muted">Orders</span>
            </Link>
            <nav className="flex items-center gap-7 text-sm">
              <Link href="/orders" className="inline-flex min-h-10 items-center hover:text-azure">
                All orders
              </Link>
              <Link
                href="/orders?new=1"
                className="inline-flex min-h-9 items-center rounded-lg bg-azure px-4 font-medium text-white hover:bg-azure-deep"
              >
                New order
              </Link>
            </nav>
          </div>
        </header>
        <main className={`${container} flex-1 py-10`}>{children}</main>
      </body>
    </html>
  );
}
