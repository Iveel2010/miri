# Make logo & artist photo display from Cloudinary

## Context / verified root cause
The Cloudinary *connection* and the full pipeline are **working**. I verified end-to-end on the running app (`admin@artgallery.test`):
- `POST /api/upload` → Cloudinary returns a live URL (`201`)
- `PUT /api/site-settings` → persists `logoImage` **and** `artistPhoto` (`200`)
- `GET /api/site-settings` returns those Cloudinary URLs
- `/_next/image?url=<cloudinary>` returns **200** (optimizer works)
- CSP `img-src 'self' data: blob: https:` allows `https:` → Cloudinary is permitted
- `Navbar`/`Footer`/`About` render `<Image src={logoImage/artistPhoto}>` correctly

The logo/artist image is **not visible only because the stored value is wrong**:
- Previous `logoImage` was `…/image/upload/v…/site/….png` → returns **HTTP 404 from Cloudinary** (deleted asset; `site/` folder, not the normal `art-gallery/` folder).
- `artistPhoto` was never persisted → About falls back to local `public/misheel.jpg`.
- After diagnosis both fields were reset to `""` (text logo / local fallback currently show).

So the fix is: (1) store a **valid** Cloudinary URL (user uploads real logo), and (2) add graceful-degradation so a dead/missing URL never shows a broken image, and (3) auto-persist uploads in admin so "uploaded but forgot to click Save" can't happen.

## Changes

### 1. Graceful fallback on `<Image>` (prevents "cant see it")
- `src/components/Navbar.tsx` (logo, ~L51-59): add local `useState` `logoFailed`; render the `✦` text span when `!logoImage || logoFailed`; add `onError={() => setLogoFailed(true)}` to `<Image>`.
- `src/components/Footer.tsx` (logo, ~L41-49): same pattern as Navbar.
- `src/components/About.tsx` (artist, ~L42-50): add `useState` `imgFailed`; `src={imgFailed ? "/misheel.jpg" : artistPhoto}` with `onError={() => setImgFailed(true)}`. Keep `fill` + `priority`.

### 2. Auto-persist on upload in admin (removes the footgun)
- `src/app/admin/content/page.tsx` `handleImage` (~L144-156): after a successful upload sets the URL via `set({ [key]: url })`, also persist immediately by calling the same save the Save button uses (e.g. refactor the PUT into a `saveSite(form)` helper and call it with the merged form right after the upload resolves). This guarantees the admin preview equals what is stored in the DB, so the public site shows the logo without a separate Save click.
- Keep the existing explicit Save button (full form: text, stats, contact, socials).

### 3. User action (data)
- Upload the **real** logo via **Admin → Content → Лого зураг** (file input) — this stores an `art-gallery/…` Cloudinary URL. Do the same for **Уран зураачийн зураг** (artist photo). The auto-save (change #2) persists it; otherwise click **Хадгалах**.
- Do **not** paste a Cloudinary URL by hand unless the asset still exists (a deleted asset is what caused the original 404).

## Files to touch
- `src/components/Navbar.tsx`
- `src/components/Footer.tsx`
- `src/components/About.tsx`
- `src/app/admin/content/page.tsx`

No backend/upload/DB-schema changes required — `siteSettingsSchema` already supports `logoImage`/`artistPhoto` as optional strings.

## Validation
1. After upload + save: `GET /api/site-settings` returns `logoImage`/`artistPhoto` as `https://res.cloudinary.com/ddxygm6wd/image/upload/v…/art-gallery/….` URLs.
2. Direct fetch of that URL from Cloudinary returns **200** (not 404).
3. `GET /_next/image?url=<encoded url>&w=256&q=75` returns **200**.
4. Logo visible in Navbar/Footer; artist photo visible on `/about`.
5. Regression: temporarily set `logoImage` to a bogus URL → UI shows the `✦` text logo (no broken image), confirming the fallback.

## Risks / notes
- Auto-save overwrites the `site` row with current form state; safe because the form is loaded from DB and only changed by user input. If partial edits are a concern, debounce or save only the changed key.
- If the user later deletes the asset in Cloudinary, the fallback (change #1) keeps the UI clean instead of broken.
