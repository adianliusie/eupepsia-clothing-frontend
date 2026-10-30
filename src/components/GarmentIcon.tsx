// Simple garment silhouettes, one per catalogue type. Stroke-only so they take the current text colour.
const PATHS: Record<string, string> = {
  Top: '<path d="M17 8l-9 5 3 7 4-2v18h18V18l4 2 3-7-9-5"/><path d="M17 8c2 3 12 3 14 0"/>',
  Tunic: '<path d="M17 6l-9 5 3 7 4-2v26h18V16l4 2 3-7-9-5"/><path d="M17 6c2 3 12 3 14 0M15 42h18"/>',
  Dress: '<path d="M18 6v6c0 2-2 4-3 6l3 6-8 18h28l-8-18 3-6c-1-2-3-4-3-6V6"/><path d="M18 12c2 2 10 2 12 0"/>',
  Cardigan: '<path d="M17 8h14l11 8-4 22h-5V24v18H15V24v14h-5L6 16z"/><path d="M17 8l7 12 7-12M24 20v22"/><circle cx="27.5" cy="27" r=".8"/><circle cx="27.5" cy="34" r=".8"/>',
  Hoodie: '<path d="M17 10l-11 7 4 21h5V24v18h18V24v14h5l4-21-11-7"/><path d="M17 10c0-4 3-6 7-6s7 2 7 6c0 4-3 8-7 8s-7-4-7-8z"/><path d="M19 32h10v6H19z"/>',
  Pants: '<path d="M14 6h20l3 36h-9l-4-24-4 24h-9z"/><path d="M14 11h20"/>',
  Shawl: '<path d="M6 12h36L24 42z"/><path d="M13 23l-2 5M18 31l-2 5M35 23l2 5M30 31l2 5"/>',
};

export function GarmentIcon({ type, size = 28, className = "" }: { type: string; size?: number; className?: string }) {
  const d = PATHS[type];
  if (!d) return null;
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
      className={className}
      dangerouslySetInnerHTML={{ __html: d }}
    />
  );
}
