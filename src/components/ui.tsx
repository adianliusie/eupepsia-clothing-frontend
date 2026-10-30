"use client";

import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes } from "react";
import type { Status } from "@/lib/api";
export { container, eyebrow } from "@/lib/styles";

// Every fillable control is white with a visible border.
export const control =
  "h-10 w-full rounded-lg border border-edge bg-white px-3 text-[14px] text-ink outline-none placeholder:text-muted/60 hover:border-ink focus:border-azure focus:ring-1 focus:ring-azure disabled:opacity-50";

export const label = "text-[12.5px] font-medium text-muted";

export function Field({ label: text, children, className = "", hint }: { label: string; children: ReactNode; className?: string; hint?: string }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className={label}>
        {text}
        {hint && <span className="ml-1.5 font-normal text-muted/70">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${control} ${props.className ?? ""}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${control} ${props.className ?? ""}`} />;
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
  const sizes = { md: "h-10 px-5 text-[14px]", sm: "h-8 px-3 text-[13px]" };
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

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex h-10 gap-0.5 rounded-lg border border-edge bg-white p-[3px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-[5px] px-2 text-[13.5px] font-medium ${o.value === value ? "bg-ink text-white" : "text-muted hover:bg-tint hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const statusStyle: Record<Status, string> = {
  pending: "bg-pla-bg text-pla-fg",
  processing: "bg-sky text-azure-deep",
  complete: "bg-est-bg text-est-fg",
  sent: "bg-ink text-white",
  cancelled: "bg-unp-bg text-unp-fg",
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-[13px] font-medium capitalize ${statusStyle[status]}`}>{status}</span>;
}

export function StatusSelect({ value, onChange, busy }: { value: Status; onChange: (s: Status) => void; busy?: boolean }) {
  return (
    <select
      value={value}
      disabled={busy}
      onChange={(e) => onChange(e.target.value as Status)}
      onClick={(e) => e.stopPropagation()}
      className={`h-8 cursor-pointer rounded-full border-0 py-0 pl-3 text-[13px] font-medium capitalize outline-none ring-azure focus:ring-2 disabled:opacity-50 ${statusStyle[value]}`}
      style={{ backgroundImage: "none", paddingRight: 12 }}
    >
      {(["pending", "processing", "complete", "sent", "cancelled"] as Status[]).map((s) => (
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

/** A row of mutually exclusive pills. */
export function Pills<T extends string>({ value, options, onChange, size = "md" }: { value: T; options: { value: T; label: string; disabled?: boolean }[]; onChange: (v: T) => void; size?: "md" | "sm" }) {
  const h = size === "md" ? "h-9 px-3 text-[13.5px]" : "h-8 px-2.5 text-[13px]";
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={`${h} rounded-lg border font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
              on ? "border-ink bg-ink text-white" : "border-edge bg-white text-ink hover:border-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Stepper({ value, onChange, min = 1 }: { value: number; onChange: (n: number) => void; min?: number }) {
  const btn = "grid h-full w-8 place-items-center text-[16px] text-muted hover:bg-tint hover:text-ink disabled:opacity-30";
  return (
    <div className="flex h-10 w-[104px] overflow-hidden rounded-lg border border-edge bg-white focus-within:border-azure focus-within:ring-1 focus-within:ring-azure">
      <button type="button" aria-label="Fewer" disabled={value <= min} onClick={() => onChange(value - 1)} className={btn}>
        −
      </button>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || min))}
        className="w-full min-w-0 border-0 bg-transparent text-center text-[14px] font-semibold outline-none"
      />
      <button type="button" aria-label="More" onClick={() => onChange(value + 1)} className={btn}>
        +
      </button>
    </div>
  );
}

export function Swatch({ hex, size = 22 }: { hex: string; size?: number }) {
  return <span aria-hidden className="inline-block flex-none rounded-[5px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.14)]" style={{ background: hex, width: size, height: size }} />;
}

