# Admin Backend Completion Plan

## Current State

The admin **API backend** is fully implemented with these routes and handlers:

| Route | Method | Handler | Purpose |
|-------|--------|---------|---------|
| `/api/admin/analytics` | GET | `analyticsController.dashboard` | Platform dashboard |
| `/api/admin/artists` | GET | `adminController.listArtists` | List artists |
| `/api/admin/users` | GET | `adminController.listUsers` | List users |
| `/api/admin/users/[id]` | GET | `adminController.getUser` | Get user |
| `/api/admin/users/[id]` | PATCH | `adminController.updateRole` | Update role |
| `/api/admin/users/[id]` | DELETE | `adminController.deleteUser` | Delete user |
| `/api/admin/artworks/pending` | GET | `adminController.pendingArtworks` | Pending artworks |
| `/api/admin/artworks/[id]` | PATCH | `adminController.moderateArtwork` | Approve/reject |
| `/api/admin/orders` | GET | `orderController.adminList` | List all orders |
| `/api/admin/orders/[id]` | PATCH | `orderController.adminUpdate` | Update order status |
| `/api/admin/categories` | GET | `adminController.listCategories` | List categories |
| `/api/admin/categories` | POST | `adminController.createCategory` | Create category |

Supporting layers: controllers → services → repositories are all present.

**Critical gap:** there is **no admin frontend** (`src/app/admin/`). The navbar links ADMIN-role users to `/admin` (see `src/components/NavbarAuth.tsx:24`), but the page does not exist.

## Issues Found

### 1. Artist analytics returns platform-wide data (bug)
**File:** `src/services/analytics.service.ts:62-67`

The `forArtist(artistId)` method calls `analyticsRepository.eventCount`, `salesCount`, and `revenue(30d)` without filtering by the artist. This means an artist viewing their analytics sees the entire platform's metrics, not their own.

### 2. Missing category update/delete routes
**File:** `src/app/api/admin/categories/route.ts`

The route only exposes GET and POST. The service layer (`admin.service.ts:56-61`) has `updateCategory` and `deleteCategory` but no PUT/DELETE route handlers exist.

### 3. Dead code in admin controller
**File:** `src/controllers/admin.controller.ts:96-107`

`adminController.listOrders` is defined but never wired to a route. The `/api/admin/orders` route uses `orderController.adminList` instead.

## Implementation Plan

### Task 1: Fix artist analytics filtering
**File:** `src/services/analytics.service.ts`

Update `forArtist(artistId)` so analytics are scoped to the artist:
- Views: count `VIEW_ARTWORK` events where `artworkId` belongs to the artist
- Revenue/sales: aggregate orders whose items reference the artist's artworks
- If no artist-specific data path exists in `analyticsRepository`, add one or compute via `artworkRepository`

### Task 2: Add missing category routes
**Files:**
- `src/app/api/admin/categories/[id]/route.ts` (new)
- Wire `PUT` → `adminController.updateCategory`
- Wire `DELETE` → `adminController.deleteCategory`

### Task 3: Clean up dead code
**File:** `src/controllers/admin.controller.ts`

Remove the unused `listOrders` method, or if it should be used, update the route to import from `admin.controller` consistently.

### Task 4: Build admin frontend (primary gap)
Create the admin UI under `src/app/admin/` with these pages:

| Page | Purpose |
|------|---------|
| `/admin` (dashboard) | Stats cards, revenue chart, top artists/artworks |
| `/admin/users` | User table with search, role update, delete |
| `/admin/artists` | Artist list with details |
| `/admin/artworks` | Pending artworks moderation (approve/reject) |
| `/admin/orders` | Order list with status filters and update |
| `/admin/categories` | Category CRUD |

Shared layout: admin navbar with links to all sections. Use existing API routes.

## Validation

- After fixes: build must pass (`npm run build`)
- Verify each admin API route returns expected responses
- Verify admin frontend renders and navigates correctly
- Verify artist analytics now returns artist-scoped data

## Open Questions

None. Scope is the existing admin controllers/services/repositories plus the missing frontend and the two backend bugs above.
