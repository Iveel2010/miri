# Purchase Request System — Implementation Plan

## Status Assessment
The **backend** is 100% complete. All APIs, DB models, services, repositories, controllers, and the artist dashboard page exist and work. Only the **public-facing UI and a navigation link** are missing.

## Tasks

### Task 1: Create `PurchaseRequestModal` component
**File:** `src/components/PurchaseRequestModal.tsx` (new)

A `"use client"` modal for submitting purchase requests on the artwork detail page.

**Props:**
- `open: boolean`
- `artworkId: string`
- `onClose: () => void`

**State:**
- `form` — `{ buyerName, buyerPhone, buyerEmail, message }`
- `sending` — boolean
- `sent` — boolean (success state)
- `error` — `string | null`

**Behavior:**
- On submit → `POST /api/artworks/${artworkId}/purchase-request`
- Body matches `purchaseRequestInputSchema`:
  - `buyerName`: required, trimmed
  - `buyerPhone`: required, trimmed
  - `buyerEmail`: optional, trimmed or `null`
  - `message`: optional, trimmed or `null`
- On success → show success animation (green check icon + "Баярлалаа! Уран зураач тангуугаа хүлээж байна." + "Хавсралт" close button)
- On error → show error text below form
- Close via Cancel button, backdrop click, or success close button
- Lock body scroll when open

**Design (matches gallery aesthetic):**
- Centered modal: `fixed inset-0 z-50 flex items-center justify-center p-4`
- Backdrop: `absolute inset-0 bg-black/50 backdrop-blur-sm`
- Modal card: `relative w-full max-w-lg rounded-[2rem] border border-border bg-card p-8 shadow-xl`
- Inputs: `w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-primary/40 focus:border-accent`
- Primary button: `rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white hover:brightness-110`
- Cancel button: `rounded-full border border-border px-6 py-2.5 text-sm font-medium text-primary/70 hover:bg-accent/5`

### Task 2: Wire modal into artwork detail page
**File:** `src/app/artwork/[id]/page.tsx`

**Current state:**
- Line 154: `<Button href="#contact-artist" size="lg">Уран зураачтай холбогдох</Button>` — dead anchor
- The `#contact-artist` section was removed

**Changes:**
1. Import `PurchaseRequestModal` and `useState`
2. Add `const [showPurchaseModal, setShowPurchaseModal] = useState(false)`
3. Replace the dead button:
   ```tsx
   <Button onClick={() => setShowPurchaseModal(true)} size="lg">
     Худалдан авах хүсэлт илгээх
   </Button>
   ```
4. Render modal at the bottom of the page (before the related artworks section):
   ```tsx
   <PurchaseRequestModal
     open={showPurchaseModal}
     artworkId={api.id}
     onClose={() => setShowPurchaseModal(false)}
   />
   ```

### Task 3: Add nav link to artist purchase requests
**File:** `src/app/dashboard/contact/page.tsx`

**Current state:** Lines 268-273 have a link to `/dashboard/inquiries` ("Хүсэлтүүд харах →").

**Changes:**
Add a similar link to `/dashboard/purchase-requests`:
```tsx
<Link
  href="/dashboard/purchase-requests"
  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent transition-colors hover:text-accent/80"
>
  Худалдан авах хүсэлтүүд →
</Link>
```

## Validation
- `npx tsc --noEmit` — zero errors
- `npm run lint` — zero errors
- Manual: visit artwork page → click "Худалдан авах хүсэлт илгээх" → modal opens → submit empty → validation errors shown → fill form → submit → success animation → artist dashboard shows new request with `NEW` status

## Out of Scope
- Payment integration (none requested)
- Admin contact/messages (already deleted per prior request)
- Notification UI for artists (notification record is created; display is future work)
