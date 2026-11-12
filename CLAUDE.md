# CLAUDE.md

Internal order UI for Eupepsia (Happy Black Sheep). Not related to justnaturalfibers beyond sharing its visual tokens.

- Dev server: `npm run dev` on http://localhost:4001 (4000 is used by justnaturalfibers).
- API base in `.env.local` as `NEXT_PUBLIC_API_URL`; backend repo is `../eupepsia-clothing-backend`.
- Deployed on AWS Amplify (app `d2d9ivy11dgxo0`, `happyblacksheep` profile, us-east-1): every push to `main` rebuilds https://main.d2d9ivy11dgxo0.amplifyapp.com (password protected).
- Design tokens in `src/app/globals.css`, shared primitives in `src/components/ui.tsx`, API client/types in `src/lib/api.ts`.
- Style constants (`container`, `eyebrow`) live in `src/lib/styles.ts`, not in a "use client" file, so server components can import them.
- No auth. Pages are client components fetching the API directly.
- Routes: `/orders` is the new-order form (`NewOrder.tsx`), `/track` the orders list (`OrdersList.tsx`), `/track/<id>` an order's detail (`OrderDetail.tsx`). `/` redirects to `/orders`; `/orders/<id>` redirects to `/track/<id>`. After placing, the form goes to `/track?placed=<id>`.
- Order form: "New order for [customer]" heading (search box over `GET /users`, or create a customer by first/last name; the order creates them), then one row per item (none to start; "Add an item" adds each row, no order-level notes field) filled left to right (Garment, Fabric, Colour, Size, quantity), with a note icon per row that expands an optional per-item note (`items[].note`, shown on `/track` and the order detail), a preview panel for the row being edited, and total + Place order under the table. Design canvas: https://claude.ai/artifact/LEwjTz42xdansW8j7SjPpX
- Catalogue helpers live in `src/lib/garments.ts`: a garment is a fabric-neutral catalogue name with one style code per fabric; `fit()` drops fabric/colour/size choices that no longer apply. The Garment/Fabric/Colour/Size dropdowns (`CatalogueMenus.tsx`) are shared by the order form and the `/track` filters. A garment filter sends all its style codes as `style=A,B`.
- Dropdowns are custom (`Dropdown.tsx`, with `useDismiss` for outside click/Escape); no native selects except the order status pill.
- Garment photos: real product shots in `public/catalogue/garments/photos/<STYLE>[-<COLOUR>].jpg` (800×1000), listed in `src/lib/photos.ts`. `garmentPhoto()` picks the exact style+colour photo if listed, else the garment's representative photo, else null, which `GarmentPhoto.tsx` renders as a soft frame with the garment's `GarmentIcon` outline (no stock photos). Source photos: `../relevant_files/clothes_images`.
