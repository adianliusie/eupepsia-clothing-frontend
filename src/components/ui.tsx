"use client";

import type { ReactNode, InputHTMLAttributes } from "react";
import { STATUSES, type Status } from "@/lib/api";

// Every fillable control is white with a visible border.
export const control =
  "h-11 w-full rounded-lg border border-edge bg-white px-3 text-[14px] text-ink outline-none placeholder:text-muted/60 hover:border-ink focus:border-azure focus:ring-1 focus:ring-azure disabled:opacity-50";

export const label = "text-[12.5px] font-medium text-muted";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${control} ${props.className ?? ""}`} />;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  ...props
}: { children: ReactNode; variant?: "primary" | "outline" | "ghost"; size?: "md" | "sm" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: "bg-azure text-white hover:bg-azure-deep",
    outline: "border border-edge bg-white text-ink hover:border-ink",
    ghost: "text-muted hover:text-ink",
  };
  const sizes = { md: "h-11 px-5 text-[14px]", sm: "h-8 px-3 text-[13px]" };
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${sizes[size]} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

const statusStyle: Record<Status, string> = {
  pending: "bg-pla-bg text-pla-fg",
  processing: "bg-sky text-azure-deep",
  complete: "bg-est-bg text-est-fg",
  sent: "bg-ink text-white",
  cancelled: "bg-unp-bg text-unp-fg",
};

export function StatusSelect({ value, onChange, busy }: { value: Status; onChange: (s: Status) => void; busy?: boolean }) {
  return (
    <select
      value={value}
      disabled={busy}
      onChange={(e) => onChange(e.target.value as Status)}
      onClick={(e) => e.stopPropagation()}
      className={`h-8 cursor-pointer appearance-none rounded-full border-0 py-0 px-3 text-[13px] font-medium capitalize outline-none ring-azure focus:ring-2 disabled:opacity-50 ${statusStyle[value]}`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} className="text-ink">
          {s}
        </option>
      ))}
    </select>
  );
}

export function PageHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <h1 className="text-[32px] font-normal leading-[1.05] tracking-[-0.02em] md:text-[40px]">{title}</h1>
      {action}
    </div>
  );
}

export function Notice({ kind = "error", children, onClose }: { kind?: "error" | "success"; children: ReactNode; onClose?: () => void }) {
  const styles = kind === "error" ? "border-danger/30 bg-[#fdf1ec] text-danger" : "border-est-fg/20 bg-est-bg text-est-fg";
  return (
    <div className={`flex items-center justify-between gap-4 rounded-lg border px-4 py-2.5 text-[13.5px] ${styles}`}>
      <span>{children}</span>
      {onClose && (
        <button type="button" onClick={onClose} className="text-current opacity-60 hover:opacity-100" aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
}

/** Quantity box sized to sit in a row of h-11 controls. */
export function Stepper({ value, onChange, max }: { value: number; onChange: (n: number) => void; max?: number }) {
  const btn = "grid h-full w-6 flex-none place-items-center text-[16px] text-muted hover:bg-tint hover:text-ink disabled:opacity-30";
  const clamp = (n: number) => Math.max(1, max === undefined ? n : Math.min(max, n));
  return (
    <div className="flex h-11 w-[80px] overflow-hidden rounded-lg border border-edge bg-white focus-within:border-azure focus-within:ring-1 focus-within:ring-azure">
      <button type="button" aria-label="Fewer" disabled={value <= 1} onClick={() => onChange(value - 1)} className={btn}>
        −
      </button>
      <input
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value) || 1))}
        className="w-full min-w-0 border-0 bg-transparent text-center text-[14px] font-semibold outline-none"
      />
      <button type="button" aria-label="More" disabled={max !== undefined && value >= max} onClick={() => onChange(clamp(value + 1))} className={btn}>
        +
      </button>
    </div>
  );
}

export function Swatch({ hex, size = 22 }: { hex: string; size?: number }) {
  return <span aria-hidden className="inline-block flex-none rounded-[5px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.14)]" style={{ background: hex, width: size, height: size }} />;
}
