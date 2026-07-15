# Multiple artwork images + detail-page carousel

## Context (verified by reading the code)
- Backend already supports multiple images: `artworkInputSchema` has `image: string` (required) **and** `images: string[]` (optional); `artworkService.create` stores both (`images: input.images ?? []`); `ApiArtwork.images: string[]`; `Artwork.images?: string[]`; `toArtwork` mapper builds `images: a.images?.length ? a.images.map(optimizeCloudinaryUrl) : [optimizeCloudinaryUrl(a.image)]`. **No API/schema/DB change needed.**
- Admin `src/app/admin/artworks/page.tsx`: only a **single-file** upload (`handleImageFile`) + `form.images` is a `string` that is never rendered as an input (the array is currently uneditable via UI). Submit splits `form.images` by comma — but nothing populates it.
- Detail page `src/app/artwork/[id]/page.tsx` renders `<Lightbox artwork={art} related={related} />`. `src/components/Lightbox.tsx` currently builds `items = [artwork, ...related]` → its fullscreen modal cycles through **different/related artworks**, NOT multiple images of the same piece. There is no same-artwork carousel.

Decision (confirmed with user): add a visible thumbnail carousel on the detail page for this artwork's images, and repurpose the Lightbox to cycle through **this artwork's own images**. Related-artworks grid at the bottom of the page stays as-is.

## Tasks

### 1. Admin multi-upload (`src/app/admin/artworks/page.tsx`)
- Change `form.images` from `string` to `string[]`. Update `resetForm` (`images: []`) and `openEdit` (`images: artwork.images?.length ? artwork.images : artwork.image ? [artwork.image] : []`, `image: artwork.image`).
- Replace `handleImageFile(file)` with `handleImageFiles(files: FileList | null)`:
  - Build one `FormData`, append **every** selected file under the key `files` (the upload controller's `parseForm` collects all `File` entries into `files[]`, and `uploadMany` preserves order → single POST returns the URL array).
  - `POST /api/upload`; map `env.data` → `url`s; `setForm(f => { const next = [...f.images, ...urls]; return { ...f, images: next, image: f.image || next[0] || "" }; })`.
- Replace the single-file `<input>` + `form.image` URL box with:
  - `<input type="file" multiple accept="image/*" onChange={e => handleImageFiles(e.target.files)} />`
  - A thumbnail grid of `form.images`: each thumb shows the image (or a tiny broken-state), with a remove (`×`) button; the **first** item is badged "Primary". (Optionally a "set primary" star that reorders it to index 0 — keep simple: first = primary.)
  - Keep an optional "add by URL" text input that pushes a pasted URL into `form.images`.
- `handleSubmit` payload: `image: form.images[0] ?? form.image ?? ""`, `images: form.images.length ? form.images : undefined`. (Schema requires `image` min(1) → at least one image must be uploaded; surface a friendly error if empty.)

### 2. New carousel component (`src/components/ArtworkGallery.tsx`, client)
Props: `artwork: Artwork`.
- `const gallery = artwork.images?.length ? artwork.images : [artwork.image];`
- State: `active` (index), `zoom` (bool).
- Main image: `<Image src={gallery[active]} fill priority ...>` with left/right arrow buttons that cycle `active` (wrap), and a "zoom" button that opens the modal at `active`.
- Thumbnail strip: map `gallery` → button per thumb; click sets `active`; highlight `active`.
- Renders `<LightboxModal images={gallery} title={artwork.title} artist={artwork.artist} initialIndex={active} open={zoom} onClose={() => setZoom(false)} />`.

### 3. Refactor `Lightbox.tsx` into a controlled modal (`LightboxModal`)
- Remove the outer trigger `<button>` and the `related` prop. New props: `images: string[]`, `title: string`, `artist: string`, `initialIndex?: number`, `open: boolean`, `onClose: () => void`.
- `items = images` (was `[artwork, ...related]`). `current = items[index]`.
- On `open` becoming true, set `index = initialIndex ?? 0` (useEffect). Keep all existing zoom/pan/drag/keyboard/dots logic operating on `items`.
- Keep `onClose` wired to the existing close affordances.

### 4. Wire the detail page (`src/app/artwork/[id]/page.tsx`)
- Replace `<Lightbox artwork={art} related={related} />` with `<ArtworkGallery artwork={art} />`.
- Keep `relatedApi`/`related` — it still feeds the bottom "Төстэй бүтээлүүд" grid (unchanged). Only the modal no longer consumes `related`.

## Files to change
- `src/app/admin/artworks/page.tsx`
- `src/components/ArtworkGallery.tsx` (new)
- `src/components/Lightbox.tsx` (refactor → `LightboxModal`)
- `src/app/artwork/[id]/page.tsx`

## Edge cases
- Artwork with `image` but no `images`: gallery falls back to `[artwork.image]`; editing prefills `images: [image]`.
- Single image: carousel shows one image, arrows/dots hidden (same guards Lightbox already has for `items.length > 1`).
- Zero images (shouldn't happen): guard `gallery[0]` exists before rendering `<Image>`.
- Concurrent/large multi-upload: single POST with all files; show `uploading` state; handle non-ok response with the existing error message.

## Validation
1. `npx tsc --noEmit` and `eslint` on changed files (no errors).
2. Admin: create an artwork, select multiple image files → thumbnails appear, first badged Primary → Save. Edit it → all images load as thumbnails; remove one → persists.
3. Detail page: open that artwork → carousel shows all images; arrows + thumbnails switch the main image; "zoom" opens modal cycling through THIS artwork's images (not related artworks).
4. Existing single-image artworks still render correctly (fallback `[image]`).
5. `GET /api/artworks/<id>` returns `images: [...]`; `toArtwork` returns optimized array; gallery uses `res.cloudinary.com` (already in `next.config.mjs` `remotePatterns`).

## Risks
- `Lightbox` is used only on the detail page (grep-confirmed) → renaming/refactoring it is safe; no other call sites.
- Backend `image` is required; ensure admin always sends `image = images[0]` so creation/validation never fails.
