import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Geist } from "next/font/google";
import { container } from "@/lib/styles";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Eupepsia Timeless Collection", template: "%s | Eupepsia Timeless Collection" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans text-ink">
        <header className="border-b border-line">
          <div className={`${container} flex min-h-16 items-center justify-between gap-8 py-3`}>
            <Link href="/orders" className="flex items-center gap-3 text-lg font-semibold tracking-tight">
              <Image src="/eupepsia-mark.svg" alt="" width={21} height={36} priority />
              <span>
                Eupepsia <span className="font-normal text-muted">Timeless Collection</span>
              </span>
            </Link>
            <nav className="flex items-center gap-7 text-sm">
              <Link href="/orders" className="inline-flex min-h-10 items-center hover:text-azure">
                New order
              </Link>
              <Link href="/track" className="inline-flex min-h-10 items-center hover:text-azure">
                Track orders
              </Link>
            </nav>
          </div>
        </header>
        <main className={`${container} flex-1 py-10`}>{children}</main>
      </body>
    </html>
  );
}
