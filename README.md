# Eupepsia orders frontend

Internal order-tracking UI. Next.js 16 + Tailwind 4, same design tokens as justnaturalfibers. Talks to the Lambda API in `eupepsia-clothing-backend`.

```bash
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL
npm run dev                    # http://localhost:4001
```

Pages: `/orders` (admin list: status tabs, search, garment/fabric/colour filters, click a customer to filter, sortable columns, paging, inline status change; `?new=1` opens the new-order modal), `/orders/[id]` (detail).
