# Purchase Request Workflow Implementation Plan

## Goal
Build a premium "Request to Purchase" workflow for the art gallery. Visitors can submit purchase requests without payment. Artists/admins manage requests in a dedicated dashboard page.

## Current State
- Prisma schema already has `PurchaseRequest` model and `PurchaseRequestStatus` enum (`NEW`, `CONTACTED`, `COMPLETED`, `CANCELLED`)
- All previous purchase-request frontend/backend files were deleted in prior turns
- No `dashboard/` pages remain; admin area lives at `/admin` and is ADMIN-only
- Standard stack: Next.js 16 + React 19 + Prisma 6 + Tailwind 4 + Zod

## Decisions Made
- **Dashboard location**: `/admin/purchase-requests` (admin only, inside existing admin shell)
- **Status enum**: Replace `COMPLETED` with `SOLD`, add `RESERVED`. Final enum: `NEW`, `CONTACTED`, `RESERVED`, `SOLD`, `CANCELLED`

## Implementation Tasks

### 1. Database Migration
- Update `prisma/schema.prisma`:
  - Change `PurchaseRequestStatus` enum: remove `COMPLETED`, add `RESERVED` and `SOLD`
  - Keep model fields as-is
- Run `npm run prisma:migrate dev` to apply

### 2. Backend — Repository
Create `src/repositories/purchase-request.repository.ts`:
- `create(data)` — `prisma.purchaseRequest.create` with artwork + artist include
- `findById(id)` — find unique with artwork relation
- `listForAdmin(params)` — paginated list with optional status filter, ordered by `createdAt desc`
- `updateStatus(id, status)` — update only status field
- `delete(id)` — delete by id

### 3. Backend — Service
Create `src/services/purchase-request.service.ts`:
- `purchaseRequestInputSchema` (zod): `buyerName` (required, max 100), `buyerPhone` (required, max 40), `buyerEmail` (optional email, max 120), `message` (optional, max 2000)
- `submit(artworkId, input)`:
  - Validate artwork exists, get `artistId`
  - Create `PurchaseRequest`
  - Create `Notification` for artist: type `PURCHASE_REQUEST`, title "Шинэ худалдан авах хүсэлт", body with buyer name + artwork title, `relatedId` = request id
- `listForAdmin(params)` — delegate to repository, return `{ items, total }`
- `updateStatus(id, status)` — validate status enum, delegate to repository
- `delete(id)` — delegate to repository

### 4. Backend — Controller
Create `src/controllers/purchase-request.controller.ts`:
- `submit(req, params)` — public endpoint, validate input, call service, return 201
- `list(req)` — require admin auth, parse query params (page, limit, status), call service, return paginated envelope
- `updateStatus(req, params)` — require admin auth, parse body status, validate enum, call service
- `delete(req, params)` — require admin auth, call service, return 204 or `{ deleted: true }`

### 5. Backend — API Routes
- Create `src/app/api/artworks/[id]/purchase-request/route.ts` — `POST` only, public, with rate limiting (5/min per IP), delegates to `purchaseRequestController.submit`
- Create `src/app/api/admin/purchase-requests/route.ts` — `GET` only, admin auth, delegates to `purchaseRequestController.list`
- Create `src/app/api/admin/purchase-requests/[id]/route.ts` — `PATCH` (status) and `DELETE`, admin auth

### 6. API Types
Add to `src/types/api.ts`:
- `ApiPurchaseRequest` — id, buyerName, buyerPhone, buyerEmail, message, status, artworkId, artistId, artwork (id, title, image), createdAt, updatedAt
- `ApiPurchaseRequestList` — items + meta (pagination)

### 7. Frontend — Modal Component
Create `src/components/PurchaseRequestModal.tsx`:
- Props: `isOpen`, `onClose`, `artworkId`, `artworkTitle`
- State: form fields, errors, submitting, success
- Client-side validation: name required, phone required + basic format, email format if provided
- On submit: `POST /api/artworks/${artworkId}/purchase-request`
- Success state: checkmark animation + "Thank you! The artist will contact you shortly." message
- Close on Escape, backdrop click, Cancel button
- Premium styling: rounded-2xl/3xl, white card, accent borders, subtle shadows

### 8. Frontend — Trigger Component
Create `src/components/PurchaseRequestTrigger.tsx`:
- Props: `artworkId`, `artworkTitle`
- Manages `open` state, renders modal
- Renders a prominent "Request to Purchase" button (accent, rounded-full)

### 9. Frontend — Artwork Page Integration
Update `src/app/artwork/[id]/page.tsx`:
- Import `PurchaseRequestTrigger`
- Add `<PurchaseRequestTrigger artworkId={art.id} artworkTitle={art.title} />` next to existing buttons

### 10. Frontend — Admin Navigation
Update `src/app/admin/layout.tsx`:
- Add `{ href: "/admin/purchase-requests", label: "Худалдан авах хүсэлтүүд", icon: PurchaseRequestIcon }` to `NAV_ITEMS`
- Create a simple `PurchaseRequestIcon` SVG icon (e.g., document/request icon)

### 11. Frontend — Admin Dashboard Page
Create `src/app/admin/purchase-requests/page.tsx`:
- Client component
- Auth guard: redirect non-admin to `/login?next=/admin/purchase-requests`
- Poll `/api/admin/purchase-requests` every 8 seconds
- Filter dropdown by status: All, New, Contacted, Reserved, Sold, Cancelled
- Elegant card layout per request:
  - Left: artwork thumbnail (small, rounded)
  - Center: artwork title, buyer name, phone, email, message, date
  - Right: status badge + action buttons
- One-click actions:
  - Call Buyer → `tel:` link
  - Send Email → `mailto:` link
  - Copy Phone → `navigator.clipboard.writeText()`
- Status action buttons (contextual):
  - New → Mark as Contacted, Mark as Reserved, Mark as Cancelled
  - Contacted → Mark as Reserved, Mark as Sold, Mark as Cancelled
  - Reserved → Mark as Sold, Mark as Cancelled
  - Sold / Cancelled → no status changes (only Delete)
- Delete button with confirmation
- Empty state message
- Error state with retry

## Risk / Edge Cases
- **Prisma migration**: Changing enum requires careful migration. If DB has existing `COMPLETED` rows, migration must map them to `SOLD` or fail.
- **Rate limiting**: Public endpoint needs protection against spam. Use existing `rateLimit` utility.
- **Phone formatting**: Client validates loosely; backend should also sanitize/validate.
- **Notification noise**: Every request creates a notification. Ensure artist can manage them.

## Validation Plan
1. Run `npm run prisma:migrate dev` and verify enum change
2. Run `npx tsc --noEmit` — zero errors
3. Run `npx eslint` — zero errors on new files
4. Run `npm run build` — succeeds
5. Manual test: visit artwork page, submit request, verify DB record + notification
6. Manual test: open `/admin/purchase-requests`, verify card display and status transitions

## Out of Scope
- Payment integration (explicitly excluded)
- Email/SMS notifications to buyers (only in-app notifications to artists)
- Purchase request expiry or auto-cancellation
- Bulk actions on requests
