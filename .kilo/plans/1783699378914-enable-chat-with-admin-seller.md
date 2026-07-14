# Enable customer ↔ admin (seller) chat to buy art

## Context
On this single-seller shop the artworks are owned by the **ADMIN** user (Miry). Customers
currently cannot chat with the admin to arrange a purchase because the messaging system is
hard-wired as **CUSTOMER ↔ ARTIST only**, with three guards blocking the admin:

1. `src/services/conversation.service.ts:137-139` — `start()` rejects any recipient that is
   not role `ARTIST` ("You can only message artists"). A customer clicking "contact the artist"
   on an admin-owned artwork is blocked here.
2. `src/components/chat/ChatWindow.tsx:213` — `<Composer ... disabled={isAdmin} />` prevents the
   admin from ever replying.
3. `src/components/chat/ChatWindow.tsx:63` — seller tools (discount / mark-sold) are hidden for
   admins (`isArtist = ... && !isAdmin`).

Good news: the backend `messageService.send` already permits an admin who is a **participant**
to send (`src/services/message.service.ts:105-112`), and `runAction` already keys off
`conv.artistId === userId`. So no DB/schema migration is required — the `Conversation.artistId`
column can simply hold the admin's id (admin acts as the seller on the "artist" side).

## Decisions (confirmed with user)
- Treat the **ADMIN user as the seller**; a CUSTOMER may start a conversation with them.
- Admin gets **full two-way** chat: can reply and use seller tools (OFFER_DISCOUNT, MARK_SOLD).
- "Buy it" = chat + existing seller tools only. No in-chat checkout/order creation.

## Changes

### Backend
- `src/services/conversation.service.ts` `start()`:
  - Change the recipient check from `if (artist.role !== "ARTIST")` to allow
    `artist.role === "ARTIST" || artist.role === "ADMIN"` (keep the "You can only message
    artists" semantics but permit the seller/admin). Update the error string accordingly.
  - No other change — the auto artwork-card + NEW_INQUIRY notification already target
    `input.artistId` (the admin), which is correct.
- `src/services/user.service.ts` `listArtists()`:
  - Return both sellers: `userRepository.listByRolePublic(["ARTIST", "ADMIN"], search)` so the
    "New message" picker in `/messages` includes the admin seller.
- `src/repositories/user.repository.ts` `listByRolePublic(role, search?, take?)`:
  - Accept `Role | Role[]`; build `where.role` as `Array.isArray(role) ? { in: role } : role`.

### Frontend
- `src/components/chat/ChatWindow.tsx`:
  - Replace `const isArtist = !!conversation.artist && conversation.artist.id === meId && !isAdmin;`
    with `const isSeller = !!conversation.artist && conversation.artist.id === meId;`
    (admin-seller now sees the seller tools bar).
  - Compute participant flag:
    `const isParticipant = conversation.customer.id === meId || conversation.artist.id === meId;`
  - Render `<ArtistActionBar ... />` when `isSeller` (rename the var at the usage site).
  - Change `<Composer ... disabled={isAdmin} />` to `disabled={!isParticipant}` so a
    monitoring (non-participant) admin still can't inject messages, but an admin **seller**
    participant can reply. Keep passing `isAdmin` to `MessageList` (unchanged — admin may still
    delete any message when monitoring).
- `src/components/chat/NewConversationDialog.tsx` (polish): the listed seller's sub-label is
  hardcoded "Artist" — show role-aware text ("Artist" for ARTIST, "Seller"/"Захирал" for ADMIN)
  using the `role` already returned by `listArtists`.
- `src/components/ContactArtistButton.tsx` (polish, optional): once the backend accepts the
  admin recipient, the existing per-artwork button "Уран зураачтай холбогдох" works as-is.
  Consider relabeling to "Бидэнтэй холбогдох" / "Захиралтай холбогдох" when the recipient is the
  admin. Low priority — leave behavior intact either way.

## Out of scope
- No new DB migration / schema change (reuses `artistId`).
- No in-chat checkout, order creation, or payment (purchase is arranged in chat; completion
  stays outside the conversation, e.g. existing MARK_SOLD + the `/contact` path).
- `messages/page.tsx`, `ConversationList`, `ConversationItem`, realtime/presence: no changes
  needed (they already render `otherParticipant` generically).

## Validation
1. `npx tsc --noEmit` and `npm run lint` pass.
2. Manual / API:
   - As a CUSTOMER, POST `/api/conversations` with `{ artistId: <adminId>, artworkId, message }`
     → 201 and returns the conversation (previously 403 "You can only message artists").
   - GET `/api/artists` → includes the admin seller.
   - As the admin, open the thread in `/messages`: Composer is enabled, "Artist tools" (discount /
     mark-sold) bar is visible, MARK_SOLD flips the artwork to SOLD.
   - As a non-participant admin monitoring someone else's thread: Composer stays disabled
     (cannot inject messages).
3. Click "contact the artist" on an admin-owned artwork while logged in as a customer → lands in
   the chat thread with the seller.
