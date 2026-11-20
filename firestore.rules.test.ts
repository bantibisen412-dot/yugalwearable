/**
 * Yugal Wearables — Phase 0 Security Rules Verification Specification
 * Covers the "Dirty Dozen" adversarial payloads defined in security_spec.md.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  actor: { uid: string; emailVerified: boolean };
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
  enforcedBy: string;
}

export const DIRTY_DOZEN_PAYLOADS: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'PII Cross-User Read',
    operation: 'get',
    path: '/users/userA',
    actor: { uid: 'userB', emailVerified: true },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'isOwner(userId) on /users/{userId}',
  },
  {
    id: 2,
    name: 'Shadow Ghost Field on User Create',
    operation: 'create',
    path: '/users/userA',
    actor: { uid: 'userA', emailVerified: true },
    payload: {
      uid: 'userA',
      displayName: 'Aarav',
      email: 'aarav@example.com',
      photoURL: '',
      referralCode: 'YGL-A1B2C3',
      activePairId: '',
      mood: 'Calm',
      isAdmin: true,
    },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'isValidUser(incoming()) keys().hasOnly(...)',
  },
  {
    id: 3,
    name: 'Unverified Email Write',
    operation: 'create',
    path: '/preorders/order_001',
    actor: { uid: 'userA', emailVerified: false },
    payload: { orderNumber: 'YGL-AB12CD', userId: 'userA' },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'isVerifiedUser() requires request.auth.token.email_verified == true',
  },
  {
    id: 4,
    name: 'Identity Spoofing on Pair Create',
    operation: 'create',
    path: '/pairs/pair_7K9M2P4X',
    actor: { uid: 'userA', emailVerified: true },
    payload: {
      pairCode: '7K9M2P4X',
      ownerId: 'userB',
      ownerName: 'Fake',
      ownerMood: 'Calm',
      partnerId: '',
      partnerName: '',
      partnerMood: 'Calm',
      status: 'open',
      touchCount: 0,
    },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'incoming().ownerId == request.auth.uid',
  },
  {
    id: 5,
    name: 'Hijacking Paired Couple Room',
    operation: 'update',
    path: '/pairs/pair_7K9M2P4X',
    actor: { uid: 'userC', emailVerified: true },
    payload: { partnerId: 'userC', status: 'paired' },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: "existing().status == 'open' && existing().partnerId == ''",
  },
  {
    id: 6,
    name: 'Self-Joining Own Pair',
    operation: 'update',
    path: '/pairs/pair_7K9M2P4X',
    actor: { uid: 'userA', emailVerified: true },
    payload: { partnerId: 'userA', status: 'paired' },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'existing().ownerId != request.auth.uid on Join Action',
  },
  {
    id: 7,
    name: 'Orphaned Touch Write by Non-Member',
    operation: 'create',
    path: '/pairs/pair_7K9M2P4X/touches/touch_1',
    actor: { uid: 'userC', emailVerified: true },
    payload: {
      pairId: 'pair_7K9M2P4X',
      senderId: 'userC',
      type: 'squeeze',
      intensity: 80,
      durationMs: 1200,
      bpm: 0,
      note: 'spoof',
    },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'Master Gate get(/pairs/{pairId}) membership check',
  },
  {
    id: 8,
    name: 'Unsynced Touch Write Skipping Batch Counter',
    operation: 'create',
    path: '/pairs/pair_7K9M2P4X/touches/touch_2',
    actor: { uid: 'userA', emailVerified: true },
    payload: {
      pairId: 'pair_7K9M2P4X',
      senderId: 'userA',
      type: 'heartbeat',
      intensity: 70,
      durationMs: 2000,
      bpm: 74,
      note: '',
    },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'Atomicity Guarantee getAfter(/pairs/{pairId}).data.touchCount == parent.data.touchCount + 1',
  },
  {
    id: 9,
    name: 'Terminal State Resurrection on Cancelled Pre-Order',
    operation: 'update',
    path: '/preorders/order_001',
    actor: { uid: 'userA', emailVerified: true },
    payload: { status: 'reserved' },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: "existing().status != 'cancelled' terminal state lock",
  },
  {
    id: 10,
    name: 'Price Tampering on Pre-Order',
    operation: 'create',
    path: '/preorders/order_002',
    actor: { uid: 'userA', emailVerified: true },
    payload: {
      orderNumber: 'YGL-999999',
      userId: 'userA',
      includeAccessoryPack: false,
      discountInr: 1500,
      totalInr: 1,
    },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'isValidPreorder(incoming()) strict INR pricing formula',
  },
  {
    id: 11,
    name: 'Document ID Poisoning',
    operation: 'create',
    path: `/preorders/${'a'.repeat(200)}`,
    actor: { uid: 'userA', emailVerified: true },
    payload: { userId: 'userA' },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'isValidId(orderId) length <= 128 and regex guard',
  },
  {
    id: 12,
    name: 'Blanket List Scraping of Pre-Orders',
    operation: 'list',
    path: '/preorders',
    actor: { uid: 'userB', emailVerified: true },
    expectedResult: 'PERMISSION_DENIED',
    enforcedBy: 'allow list: if isVerifiedUser() && existing().userId == request.auth.uid',
  },
];
