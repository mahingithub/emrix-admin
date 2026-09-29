# EMRIX admin panel

The admin panel for the EMRIX team: orders, products, stock, collections, customers, coupons, settings and staff.
Next.js 16 + Tailwind CSS v4, served at the root of its own domain (`/`, `/orders`, `/login`…). This folder is a
complete project on its own: it has its own dependencies, lockfile and copy of the shared code (`shared/`), and deploys
without the other apps. All data comes from the [backend](https://github.com/mahingithub/emrix-backend) API, which
also checks every permission.

## Run it locally

Needs Node.js 20.12 or newer, and the backend running (locally on port 3300, or deployed).

```bash
npm install
cp .env.example .env.local    # then fill it in
npm run dev                   # http://localhost:3200
```

| Setting | What |
| --- | --- |
| `API_URL` | The backend's address, no trailing slash (e.g. `http://localhost:3300`) |
| `INTERNAL_API_KEY` | The **same** secret as in the backend and the shop |
| `NEXT_PUBLIC_SHOP_URL` | The shop's address, for "View store" links and the bundled product mockups |

Other scripts: `npm run typecheck`, `npm run lint`, `npm run build`, `npm start`.

## Deploy (e.g. [Vercel](https://vercel.com))

New project from this repository. Root Directory: *(empty: this repository's root)*; Vercel detects Next.js. Environment:
`API_URL`, `INTERNAL_API_KEY` and `NEXT_PUBLIC_SHOP_URL` (needed at build time too). Add a domain such as
`admin.emrix.com`. On an empty database the panel sends you to `/setup`, where you enter the backend's
`ADMIN_SETUP_KEY` and create the owner.

On any other Node host: `npm ci && npm run build`, then `npm start`.

## What's in it

- **Sign in:** each team member has their own email and password. Repeated wrong passwords lock that email for 15 minutes.
- **Roles:** Owner (everything) · Manager (orders, payments, catalogue, coupons, customers, revenue) · Staff (order
  status and stock counts; no revenue, payments or product edits).
- **Dashboard** with a launch checklist, **Orders** (status flow, payment checks, courier and tracking, invoices, CSV
  export), **Products** (photos, colours, stock per size, bulk photo upload), **Inventory**, **Anime collections**,
  **Customers**, **Coupons**, **Settings** (owner), **Staff** and **Activity**.
- **Import starter catalogue** (Products) adds the 12 launch collections and 24 designs as drafts with 0 stock.

| Path | What |
| --- | --- |
| `src/app/(panel)/` | Pages with the sidebar |
| `src/app/(tools)/` | Invoice and export |
| `src/app/login/` · `src/app/setup/` | Sign-in and first-owner setup |
| `src/lib/backend.ts` · `auth.ts` · `src/actions/` | The link to the API, the session cookie, form actions |
| `shared/` | Types, helpers, the brand theme and a few UI pieces, shared with the shop and backend |

**Shared code:** the shop and backend each have their own copy of `shared/`. After changing a file there, copy the
change into the other two apps' `shared/` folders so all three stay in step.
