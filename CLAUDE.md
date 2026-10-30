# CLAUDE.md

Internal order UI for Eupepsia (Happy Black Sheep). Not related to justnaturalfibers beyond sharing its visual tokens.

- Dev server: `npm run dev` on http://localhost:4001 (4000 is used by justnaturalfibers).
- API base in `.env.local` as `NEXT_PUBLIC_API_URL`; backend repo is `../eupepsia-clothing-backend`.
- Design tokens in `src/app/globals.css`, shared primitives in `src/components/ui.tsx`, API client/types in `src/lib/api.ts`.
- Style constants (`container`, `eyebrow`) live in `src/lib/styles.ts`, not in a "use client" file, so server components can import them.
- No auth. Pages are client components fetching the API directly.
- The order form is a modal (`src/components/OrderModal.tsx`, native `<dialog>`) opened via `/orders?new=1`. Controls are white with a visible border. Each garment is a panel: fabric toggle, garment-type icon tiles (`GarmentIcon.tsx`), style pills (only when a type has several), colour button opening a swatch grid dialog (`ColourPicker.tsx`), size pills, quantity stepper. No native selects in the form.
