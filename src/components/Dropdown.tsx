"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { control } from "@/components/ui";

export const menuPanel = "absolute left-0 top-full z-30 mt-1.5 rounded-[10px] border border-edge bg-white p-1.5 shadow-[0_16px_40px_-12px_rgba(16,33,63,0.28)]";

/** Call `onDismiss` on a click outside `ref` or on Escape, while `open`. */
export function useDismiss(ref: RefObject<HTMLElement | null>, open: boolean, onDismiss: () => void) {
  const latest = useRef(onDismiss);
  useEffect(() => {
    latest.current = onDismiss;
  });
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) latest.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") latest.current();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open]);
}

export const ChevronIcon = ({ size = 12, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden className={`flex-none text-muted ${className}`}>
    <path d="M2.5 4.5l3.5 3.5 3.5-3.5" />
  </svg>
);

export const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className="flex-none">
    <circle cx="7" cy="7" r="5" />
    <path d="M11 11l3.5 3.5" />
  </svg>
);

/** Grey trigger text shown before anything is chosen. */
export const Placeholder = ({ children }: { children: string }) => <span className="truncate font-normal text-muted">{children}</span>;

/** A button that opens a popover menu. Closes on outside click, Escape, or when a child calls `close`. */
export function Dropdown({
  trigger,
  children,
  label,
  menuClassName = "w-full",
  disabled = false,
}: {
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  label: string;
  menuClassName?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismiss(ref, open, () => setOpen(false));

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`${control} flex items-center gap-2 px-2.5 text-left font-medium disabled:cursor-not-allowed disabled:bg-box disabled:hover:border-edge`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2.5">{trigger}</span>
        <ChevronIcon />
      </button>
      {open && (
        <div role="listbox" className={`${menuPanel} max-h-[440px] overflow-y-auto ${menuClassName}`}>
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function Option({
  selected,
  disabled,
  onClick,
  children,
  className = "",
}: {
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[13.5px] font-medium text-ink disabled:cursor-not-allowed disabled:opacity-40 ${selected ? "bg-sky" : "enabled:hover:bg-tint"} ${className}`}
    >
      {children}
    </button>
  );
}

export const GroupHeading = ({ children }: { children: ReactNode }) => <div className="px-2.5 pt-3 pb-1 text-[12.5px] font-semibold">{children}</div>;
