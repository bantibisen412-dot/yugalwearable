# Yugal Wearables — Firestore Security Specification (Phase 0)

## 1. Data Invariants

1. **Private PII Isolation (`/users/{userId}` & `/preorders/{orderId}`)**:
   - Email addresses and shipping details are strictly readable and writable ONLY by the verified authenticated owner (`request.auth.uid == userId` / `resource.data.userId`). No blanket `isSignedIn()` reads or lists exist.
2. **Pair Channel Integrity (`/pairs/{pairId}`)**:
   - A pair must be created with `ownerId == request.auth.uid`, `partnerId == ''`, `status == 'open'`, and `touchCount == 0`.
   - Once `status == 'archived'`, the pair is terminally locked against all subsequent updates.
   - A second verified user may join an `'open'` pair only when `existing().partnerId == ''` and `existing().ownerId != request.auth.uid`, atomically transitioning `status` to `'paired'` and setting `partnerId == request.auth.uid`.
3. **Master Gate & Atomic Counter Sync (`/pairs/{pairId}/touches/{touchId}`)**:
   - A haptic touch can only be created if the parent `/pairs/{pairId}` exists, is not `'archived'`, and the sender is currently either `ownerId` or `partnerId` of that parent pair.
   - Creating a touch MUST atomically increment `touchCount` by `+1` on `/pairs/{pairId}` in the same write batch (`getAfter(...)`).
   - Touch records are immutable append-only events (no client updates).
4. **Pre-Order Integrity & Terminal State Locking (`/preorders/{orderId}`)**:
   - Pre-orders are created only with `status == 'reserved'` and `userId == request.auth.uid`.
   - Total pricing must obey hardware pricing invariants (`discountInr` is `0` or `1500` only when `includeAccessoryPack == true` and `referralCodeApplied != ''`).
   - Once a pre-order transitions to `status == 'cancelled'`, it is terminally locked against any further modification.
5. **Temporal Integrity & Bounded Payloads**:
   - Every `createdAt` must equal `request.time` on create and remain immutable on update.
   - Every `updatedAt` must equal `request.time` on create and update.
   - Every document ID matches `^[a-zA-Z0-9_\-]+$` (<= 128 chars) and every string has strict min/max size constraints.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)

1. **PII Cross-User Read**: User B attempts `get('/users/userA')` -> DENIED (owner-only isolation).
2. **Ghost Shadow Field on User Create**: User A creates `/users/userA` with extra field `isAdmin: true` -> DENIED (`hasOnly` check).
3. **Unverified Email Spoof**: User with `email_verified: false` attempts to create `/preorders/order_1` -> DENIED (`isVerifiedUser()` gate).
4. **Identity Spoofing on Pair Create**: User A attempts to create `/pairs/pair_ABCDEFGH` with `ownerId: 'userB'` -> DENIED (`incoming().ownerId == request.auth.uid`).
5. **Hijacking an Already-Paired Room**: User C attempts to update `/pairs/pair_ABCDEFGH` (`status: 'paired'`) to overwrite `partnerId: 'userC'` -> DENIED (`existing().status == 'open' && existing().partnerId == ''`).
6. **Self-Joining Own Pair**: User A attempts to join their own open pair by setting `partnerId: 'userA'` -> DENIED (`existing().ownerId != request.auth.uid`).
7. **Orphaned Touch Write (Non-Member / Missing Parent)**: User C attempts to write `/pairs/pair_ABCDEFGH/touches/touch_1` -> DENIED (Master Gate `get()` membership check).
8. **Unsynced Touch Write (Skipping Atomic Batch)**: Partner A creates `/pairs/pair_ABCDEFGH/touches/touch_1` without incrementing parent `touchCount` -> DENIED (`getAfter()` atomicity guarantee).
9. **Terminal State Resurrection on Pre-Order**: User A tries to change a `cancelled` pre-order back to `reserved` -> DENIED (terminal state lock).
10. **Price Tampering on Pre-Order**: User A submits a pre-order with `totalInr: 1` or `discountInr: 1500` without `includeAccessoryPack: true` -> DENIED (`isValidPreorder` pricing guard).
11. **ID Poisoning Attack**: User A attempts to create `/preorders/` with a 200-char ID containing `$./` -> DENIED (`isValidId(orderId)`).
12. **Client-Forged Timestamp / Blanket List Scraping**: User A submits `createdAt: Timestamp(2020-01-01)` OR User B executes `list('/preorders')` without `where('userId', '==', 'userB')` -> DENIED (`request.time` check & `resource.data.userId == request.auth.uid`).
