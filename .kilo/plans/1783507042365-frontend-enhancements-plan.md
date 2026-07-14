# Frontend Enhancements Plan — Miry Gallery

Scope: enhance the **art detail page**, **gallery browsing**, and **whole-site** polish.
All data is currently static (`src/data/artworks.ts`), so search/filter/sort are client-side only — no backend needed.
Goal: keep the existing design system (Tailwind v4 theme tokens, `Reveal`, `Button`, `Badge`, `ArtworkCard`) and add interactivity without breaking the prerendered static pages.

## 1. Art detail page (`src/app/artwork/[id]/page.tsx`)
- **Lightbox** (new `src/components/Lightbox.tsx`, `"use client"`): click the main image to open a fullscreen overlay; support zoom (wheel/click scale) and prev/next navigation through the related set; close on `Esc` / backdrop click. Reuse artwork images (already optimized via `next/image`).
- **Share buttons** (new `src/components/ShareButtons.tsx`): copy-link + Twitter / Facebook / Pinterest share using the artwork's title/artist/URL from `generateMetadata` data. No external SDK — plain anchor links.
- **Richer metadata**: extend `Artwork` (`src/types/artwork.ts`) with optional `dimensions?`, `edition?`, `price?`. Add values to `src/data/artworks.ts`. Render in the existing detail panel (only when present). Keep "Худалдан авах" linking to `/contact` (shop out of scope).
- Keep the existing related-artworks section; the lightbox prev/next walks this list.

## 2. Gallery browsing (`src/app/gallery/page.tsx`)
- **Search**: client input filtering by title / artist / category (case-insensitive, Mongolian text).
- **Sort**: control (newest year → oldest, title A→Z, category) combined with the existing category filter.
- **Load more**: replace instant full render with a paginated "Дэлгэрэнгүй" button (e.g. show 9, +6 each click) on the masonry; keep `animate-fade-in-up` stagger. Avoid infinite scroll to stay simple/accessible.
- Reuse `ArtworkCard` and existing `MASONRY_ASPECTS`.

## 3. Whole-site polish
- **Animation**: apply `Reveal` to remaining above-the-fold sections (Hero, About, CTA) for consistent scroll-in; add subtle hover/parallax only where it doesn't hurt performance.
- **New section on home** (`src/components/InstagramFeed.tsx` or extend `CTA`): a lightweight "Дагах" Instagram/newsletter strip reusing `SectionTitle` + `Button`.
- **Performance**: verify every `next/image` has correct `sizes`; ensure `loading`/lazy defaults; no layout shift in masonry (fixed aspect ratios already present).

## Files to create
- `src/components/Lightbox.tsx`
- `src/components/ShareButtons.tsx`
- `src/components/InstagramFeed.tsx` (or edit `CTA.tsx`)

## Files to edit
- `src/app/artwork/[id]/page.tsx` — lightbox + share + richer metadata
- `src/app/gallery/page.tsx` — search + sort + load more
- `src/types/artwork.ts` — `dimensions?`, `edition?`, `price?`
- `src/data/artworks.ts` — populate new fields + descriptions
- `src/components/Hero.tsx`, `About.tsx`, `CTA.tsx` — reveal/section polish

## Validation
- `npx eslint src` and `npx tsc --noEmit` pass.
- `npx next build` succeeds; `/artwork/[id]` still prerenders all 6 paths (SSG).
- Manual: open a detail page → lightbox opens/closes + navigates; share copies link; gallery search/sort/load-more work; home sections animate in.

## Risks / notes
- Lightbox must be a client component; detail page can stay a server component that passes data into it.
- Keep additions optional in rendering to avoid breaking entries missing new fields.
- No new dependencies required (use native share links + CSS zoom).
