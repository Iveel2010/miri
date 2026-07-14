# Frontend ↔ Backend Integration Plan

## Context
- A production **backend REST API** was built and verified (`tsc` + ESLint clean): Prisma/PostgreSQL, JWT **httpOnly cookies** (`access_token`, `refresh_token`), and a clean `routes → controllers → services → repositories` stack under `src/app/api`, `src/controllers`, `src/services`, `src/repositories`, `src/lib`.
- The **frontend** is a static marketing/gallery site: it renders from local `src/data/*` files, has **no auth UI**, and its `Artwork` type (`artist: string`, `year: string`, `price?: number`) differs from the backend response (`artist: {id,name,avatar,role}`, `category: {id,name,slug}`, `year: number`, `price: number`, `status`, `images[]`, `views`, `favoritesCount`, `likesCount`).
- Two visual design systems exist: the main "art" theme (`gallery`, `artwork`, `about` use `--primary/--accent`) and a "shop" theme (`shop`, `studio` use `--shop-*`). The data layer is theme-agnostic.

## Confirmed decisions
1. **Architecture — Hybrid REST client.** One typed API client is used everywhere. Server Components fetch `/api/*` via an internal absolute base URL (with cookie forwarding for authed data); Client Components use the same client with `credentials: "include"`. The REST API stays the single contract.
2. **Scope — Full, phased.** P1 browse + auth; P2 artist/customer dashboards; P3 admin UI.
3. **Pages — all wired to real data.** Gallery → `/api/artworks` list (search/filter/sort via API); Shop → real published-artwork product grid (curated hero kept); Artwork detail → `/api/artworks/[id]`; Studio → role-gated ARTIST dashboard from `/api/analytics`, `/api/artworks/artist/[id]`, `/api/collections`.

## Shared foundation (new files)
- `src/lib/api-client.ts` — `apiFetch<T>(path, init)`, `apiGet/apiPost/apiPatch/apiDelete`. Base URL: `""` on client, absolute on server (see `server-api`). Always `credentials: "include"`. Throws `ApiError` (`{status, message, errors}`) on non-2xx. On `401` invokes an optional `onUnauthorized` callback (used to clear auth context) then throws.
- `src/lib/server-api.ts` — `serverApi<T>(path, { auth?: boolean })`. Resolves base from `headers()` (`x-forwarded-host`/`host` + `x-forwarded-proto`/`http`); when `auth`, forwards the incoming `cookie` header so authed endpoints work during SSR.
- `src/types/api.ts` — backend-response shapes: `ApiArtwork` (incl. `artist` object, `category` object, `status`, `year:number`, `price:number`, `images:string[]`, `views`, `favoritesCount`, `likesCount`), `ApiUser`, `ApiCategory`, `ApiPaginated<T>`, `ApiOrder`, `ApiMessage`, `ApiNotification`.
- `src/lib/mappers.ts` — `toArtwork(api): Artwork`, `toStudioArtwork(api): StudioArtwork`, `toCategory(api)`. Also a `categoriesToNameIdMap()`.
- `src/lib/auth-client.tsx` — `"use client"` `AuthProvider` + `useAuth()` hook: calls `/api/auth/me`, exposes `{ user, status, login, register, logout, refresh }`. **Name is `auth-client` on purpose** to avoid clashing with the server-only backend `src/lib/auth.ts`.
- Extend `src/types/artwork.ts` `Artwork` with optional `slug?`, `status?`, `images?: string[]` so the mapper can carry gallery/status without breaking `ArtworkCard`/`Lightbox`.

> **Hard rule:** never import backend `src/services/*` or `src/lib/auth.ts` (server-only: Prisma, `next/headers`) into client components. Keep all client data code in `src/lib/*` client-safe.

## P1 — Browse + Auth
1. Create `api-client.ts`, `server-api.ts`, `types/api.ts`, `mappers.ts`, `auth-client.tsx`.
2. Wrap app in `<AuthProvider>` inside `src/app/layout.tsx` (provider is a client component; keep it wrapping `{children}` only).
3. Add auth pages (client components, lightweight **client-side** zod validation — do NOT reuse backend services): `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`. On success, `router.push` (register→verify notice, login→home). Logout: `apiPost("/api/auth/logout")` then `useAuth().logout()` + redirect.
4. `src/components/Navbar.tsx`: use `useAuth()` to swap Login/Register for avatar + Logout; show loading state.
5. **Gallery** `src/app/gallery/page.tsx`: make it a Server Component that `serverApi("/api/artworks")` (public) for the first page and `serverApi("/api/categories")` for the name→id map; map to `Artwork[]`; render. Extract the filter/search/sort/pagination UI into a new client component `src/components/GalleryExplorer.tsx` that calls `apiGet("/api/artworks?q=&category=<id>&sort=&page=")` and re-renders the grid (keep `ArtworkCard` as-is). Map category **name→id** via the categories list (backend `category` param expects an id).
6. **Artwork detail** `src/app/artwork/[id]/page.tsx`: Server Component; `serverApi("/api/artworks/"+id)` (increment view happens server-side), map to `Artwork` (build `images` from `image`+`images[]`), fetch related via `serverApi("/api/artworks?category=<id>&limit=4")`. Remove `generateStaticParams` (dynamic) or switch to `export const revalidate = 60` (ISR). Feed existing `Lightbox`/`ShareButtons`/`ArtworkCard` unchanged.
7. **Shop** `src/app/shop/page.tsx`: Server Component fetches published artworks `serverApi("/api/artworks?status=PUBLISHED")` + categories map; keep `ShopHero`/`ShopFeatured` curated sections; replace the product area with a new client `src/components/ShopGrid.tsx` (filter by category/price, "add to favorites" affordance) rendering `ArtworkCard` inside the existing `bg-shop` container.
8. Validate: `npm run typecheck`, `npm run lint`, `npm run dev` — register, login (cookie set), logout, browse/filter/search gallery, open detail, shop grid.

## P2 — Artist & Customer dashboards
1. **Studio** `src/app/studio/page.tsx`: role-gate (redirect if not `ARTIST`); Server Component fetches `serverApi("/api/analytics")` (forArtist) + `serverApi("/api/artworks/artist/<id>")` + `serverApi("/api/collections")` with cookie forwarding; map artworks via `toStudioArtwork` (status, `views`, `likes = likesCount`); replace static `studioArtworks/studioProfile/studioExhibitions`. Stat tiles from analytics (views, sales, revenue).
2. **Studio artworks** `/studio/artworks` + **upload** `/studio/upload`: list via API; create/edit via `apiPost/Patch("/api/artworks")`, images via `apiPost("/api/upload", FormData)` (and delete via `apiDelete("/api/upload", {publicId})`); publish via `apiPost("/api/artworks/<id>/publish")`; save draft via `apiPost("/api/artworks/<id>/draft")`.
3. **Studio collections** `/studio/collections`: CRUD via `/api/collections` (+ add/remove artwork).
4. **Studio orders** `/studio/orders` and **analytics** `/studio/analytics`: `/api/orders`, `/api/analytics`.
5. **Customer**: profile `/profile` (`/api/users/me` + PATCH), favorites `/favorites` (`/api/favorites` + `/api/favorites/toggle`), messages `/messages` (`/api/messages`), orders history (`/api/orders`).
6. Add favorite/like buttons on artwork detail + cards → `/api/favorites/toggle`, `/api/likes/toggle` (require auth; redirect to login if 401).

## P3 — Admin UI (stretch)
- `/admin/*` pages consuming `/api/admin/*` (users, artists, categories, orders, pending artworks, analytics). Gate by `ADMIN` role. Large surface — implement only if requested.

## Risks / open questions
- **Server fetch base URL:** requires either `NEXT_PUBLIC_APP_URL` or host derived from `headers()`. Ensure `NEXT_PUBLIC_APP_URL` is set (it is in `.env`).
- **httpOnly cookies:** auth state is only knowable via `/api/auth/me`; never read the token in JS.
- **Category param:** backend `/api/artworks?category=` expects a **categoryId**; UI uses names → resolve via `/api/categories` map (no backend change needed). If preferred, backend could accept a slug instead (out of scope).
- **Studio `StatusBadge`** expects a status string; backend sends enum values (`PUBLISHED`, `DRAFT`, …). Map to display labels (i18n) in `toStudioArtwork`.
- **`Lightbox`** expects `images`; ensure the mapper always provides `images` (fallback to `[image]`).
- **Two CSS themes** are present; keep data code theme-agnostic and don't mix token sets.

## Validation
- `npm run typecheck` and `npm run lint` must pass after each phase.
- Manual (`npm run dev` with a seeded Postgres): register → verify-email → login (cookie set, Navbar updates) → logout; gallery filter/search/sort/pagination; artwork detail + related; shop grid; (P2) artist studio dashboard/analytics/upload; customer profile/favorites/messages; (P3) admin screens.
