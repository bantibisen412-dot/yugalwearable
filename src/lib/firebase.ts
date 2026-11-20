import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  increment,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  ACCESSORY_PACK_PRICE_INR,
  BASE_PAIR_PRICE_INR,
  REFERRAL_DISCOUNT_INR,
} from '../data/catalog';
import {
  BLUEPRINT_LIMITS,
  type CouplePairRecord,
  type HardwareFinish,
  type HapticTouchRecord,
  type MoodOption,
  type PaymentPlan,
  type PreOrderRecord,
  type ProductId,
  type ShippingRegion,
  type TouchType,
  type UserProfileRecord,
} from '../types/yugal';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

function randomAlphaNum(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

function sanitizeText(input: string, maxLength: number): string {
  return input.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

export async function signInWithGoogleAccount(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function signOutAccount(): Promise<void> {
  await signOut(auth);
}

export async function ensureUserProfile(user: User): Promise<UserProfileRecord> {
  const path = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfileRecord;
    }

    const displayName = sanitizeText(
      user.displayName || user.email?.split('@')[0] || 'Yugal Member',
      BLUEPRINT_LIMITS.DISPLAY_NAME_MAX
    );
    const referralCode = `YGL-${randomAlphaNum(6)}`;
    const newProfile = {
      uid: user.uid,
      displayName: displayName || 'Yugal Member',
      email: (user.email || '').slice(0, 160),
      photoURL: (user.photoURL || '').slice(0, 500),
      referralCode,
      activePairId: '',
      mood: 'Calm' as MoodOption,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, newProfile);
    const created = await getDoc(ref);
    return created.data() as UserProfileRecord;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToUserProfile(
  uid: string,
  onUpdate: (profile: UserProfileRecord | null) => void
): Unsubscribe {
  const path = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      onUpdate(snap.exists() ? (snap.data() as UserProfileRecord) : null);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function createCouplePair(
  user: User,
  ownerNameInput: string,
  mood: MoodOption
): Promise<CouplePairRecord> {
  const pairCode = randomAlphaNum(8);
  const pairId = `pair_${pairCode}`;
  const pairPath = `pairs/${pairId}`;
  const ownerName =
    sanitizeText(ownerNameInput || user.displayName || 'You', BLUEPRINT_LIMITS.PARTNER_NAME_MAX) ||
    'You';

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'pairs', pairId), {
      pairCode,
      ownerId: user.uid,
      ownerName,
      ownerMood: mood,
      partnerId: '',
      partnerName: '',
      partnerMood: 'Calm' as MoodOption,
      status: 'open',
      touchCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'users', user.uid), {
      activePairId: pairId,
      mood,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();

    const snap = await getDoc(doc(db, 'pairs', pairId));
    return { id: snap.id, ...(snap.data() as Omit<CouplePairRecord, 'id'>) };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, pairPath);
  }
}

export async function joinCouplePairByCode(
  user: User,
  rawCode: string,
  partnerNameInput: string,
  mood: MoodOption
): Promise<{ ok: true; pair: CouplePairRecord } | { ok: false; reason: string }> {
  const cleaned = rawCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!BLUEPRINT_LIMITS.PAIR_CODE_REGEX.test(cleaned)) {
    return {
      ok: false,
      reason: 'Enter an 8-character pair code (letters and numbers, e.g. 7K9M2P4X).',
    };
  }

  const pairId = `pair_${cleaned}`;
  const pairPath = `pairs/${pairId}`;
  const pairRef = doc(db, 'pairs', pairId);

  try {
    const snap = await getDoc(pairRef);
    if (!snap.exists()) {
      return { ok: false, reason: 'No open pair channel was found for that code.' };
    }
    const data = snap.data() as Omit<CouplePairRecord, 'id'>;
    if (data.status === 'archived') {
      return { ok: false, reason: 'This pair channel has been archived.' };
    }
    if (data.ownerId === user.uid || data.partnerId === user.uid) {
      await updateDoc(doc(db, 'users', user.uid), {
        activePairId: pairId,
        updatedAt: serverTimestamp(),
      });
      return { ok: true, pair: { id: snap.id, ...data } };
    }
    if (data.status !== 'open' || data.partnerId !== '') {
      return { ok: false, reason: 'This pair code is already linked to another couple.' };
    }

    const partnerName =
      sanitizeText(
        partnerNameInput || user.displayName || 'Partner',
        BLUEPRINT_LIMITS.PARTNER_NAME_MAX
      ) || 'Partner';

    const batch = writeBatch(db);
    batch.update(pairRef, {
      partnerId: user.uid,
      partnerName,
      partnerMood: mood,
      status: 'paired',
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'users', user.uid), {
      activePairId: pairId,
      mood,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();

    const updated = await getDoc(pairRef);
    return {
      ok: true,
      pair: { id: updated.id, ...(updated.data() as Omit<CouplePairRecord, 'id'>) },
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, pairPath);
  }
}

export async function updatePairPresenceMood(
  pair: CouplePairRecord,
  user: User,
  mood: MoodOption
): Promise<void> {
  const pairPath = `pairs/${pair.id}`;
  const isOwnerRole = pair.ownerId === user.uid;
  try {
    const batch = writeBatch(db);
    if (isOwnerRole) {
      batch.update(doc(db, 'pairs', pair.id), {
        ownerMood: mood,
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.update(doc(db, 'pairs', pair.id), {
        partnerMood: mood,
        updatedAt: serverTimestamp(),
      });
    }
    batch.update(doc(db, 'users', user.uid), {
      mood,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, pairPath);
  }
}

export async function sendRealtimeTouch(
  pair: CouplePairRecord,
  user: User,
  payload: {
    type: TouchType;
    intensity: number;
    durationMs: number;
    bpm: number;
    note: string;
  }
): Promise<void> {
  const touchId = `tch_${Date.now()}_${randomAlphaNum(4)}`;
  const touchPath = `pairs/${pair.id}/touches/${touchId}`;

  const intensity = Math.round(Math.min(100, Math.max(1, payload.intensity)));
  const durationMs = Math.round(Math.min(6000, Math.max(150, payload.durationMs)));
  const bpm =
    payload.type === 'heartbeat'
      ? Math.round(Math.min(180, Math.max(45, payload.bpm || 72)))
      : 0;
  const note = sanitizeText(payload.note, BLUEPRINT_LIMITS.NOTE_MAX);
  const senderName =
    pair.ownerId === user.uid
      ? pair.ownerName
      : pair.partnerName || sanitizeText(user.displayName || 'Partner', 60);

  try {
    // Pillar 7 Atomic Write Batch: touch creation + parent touchCount increment
    const batch = writeBatch(db);
    batch.set(doc(db, 'pairs', pair.id, 'touches', touchId), {
      pairId: pair.id,
      ownerId: pair.ownerId,
      partnerId: pair.partnerId,
      senderId: user.uid,
      senderName: senderName.slice(0, BLUEPRINT_LIMITS.PARTNER_NAME_MAX) || 'Partner',
      type: payload.type,
      intensity,
      durationMs,
      bpm,
      note,
      createdAt: serverTimestamp(),
    });
    batch.update(doc(db, 'pairs', pair.id), {
      touchCount: increment(1),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, touchPath);
  }
}

export function subscribeToPair(
  pairId: string,
  onUpdate: (pair: CouplePairRecord | null) => void
): Unsubscribe {
  const path = `pairs/${pairId}`;
  return onSnapshot(
    doc(db, 'pairs', pairId),
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
        return;
      }
      onUpdate({ id: snap.id, ...(snap.data() as Omit<CouplePairRecord, 'id'>) });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToPairTouches(
  pair: CouplePairRecord,
  userUid: string,
  onUpdate: (touches: HapticTouchRecord[]) => void
): Unsubscribe {
  const path = `pairs/${pair.id}/touches`;
  // Single-field where query matches Pillar 8 security rule without requiring a composite index
  const filterField = pair.ownerId === userUid ? 'ownerId' : 'partnerId';
  const q = query(
    collection(db, 'pairs', pair.id, 'touches'),
    where(filterField, '==', userUid),
    limit(40)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: HapticTouchRecord[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<HapticTouchRecord, 'id'>),
      }));
      items.sort((a, b) => {
        const ta = a.createdAt?.toMillis() ?? Date.now();
        const tb = b.createdAt?.toMillis() ?? Date.now();
        return tb - ta;
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export interface CreatePreOrderInput {
  productId: ProductId;
  productName: string;
  finish: HardwareFinish;
  sizePrimary: string;
  sizePartner: string;
  engraving: string;
  includeAccessoryPack: boolean;
  referralCodeApplied: string;
  paymentPlan: PaymentPlan;
  shippingCity: string;
  shippingRegion: ShippingRegion;
  customerName: string;
}

export async function createPreOrder(
  user: User,
  input: CreatePreOrderInput
): Promise<PreOrderRecord> {
  const orderCode = randomAlphaNum(6);
  const orderNumber = `YGL-${orderCode}`;
  const orderId = `ord_${Date.now()}_${orderCode}`;
  const path = `preorders/${orderId}`;

  const cleanedReferral = input.referralCodeApplied.trim().toUpperCase();
  const validReferral = BLUEPRINT_LIMITS.REFERRAL_REGEX.test(cleanedReferral)
    ? cleanedReferral
    : '';
  const discountInr = input.includeAccessoryPack && validReferral ? REFERRAL_DISCOUNT_INR : 0;
  const totalInr =
    BASE_PAIR_PRICE_INR +
    (input.includeAccessoryPack ? ACCESSORY_PACK_PRICE_INR : 0) -
    discountInr;

  const docPayload = {
    orderNumber,
    userId: user.uid,
    customerName:
      sanitizeText(
        input.customerName || user.displayName || 'Yugal Customer',
        BLUEPRINT_LIMITS.DISPLAY_NAME_MAX
      ) || 'Yugal Customer',
    customerEmail: (user.email || '').slice(0, 160),
    productId: input.productId,
    productName: sanitizeText(input.productName, 80),
    finish: input.finish,
    sizePrimary: sanitizeText(input.sizePrimary, 24),
    sizePartner: sanitizeText(input.sizePartner, 24),
    engraving: sanitizeText(input.engraving, BLUEPRINT_LIMITS.ENGRAVING_MAX),
    includeAccessoryPack: input.includeAccessoryPack,
    referralCodeApplied: validReferral,
    discountInr,
    totalInr,
    paymentPlan: input.paymentPlan,
    shippingCity: sanitizeText(input.shippingCity, BLUEPRINT_LIMITS.CITY_MAX),
    shippingRegion: input.shippingRegion,
    status: 'reserved' as const,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'preorders', orderId), docPayload);
    const snap = await getDoc(doc(db, 'preorders', orderId));
    return { id: snap.id, ...(snap.data() as Omit<PreOrderRecord, 'id'>) };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function cancelPreOrder(orderId: string): Promise<void> {
  const path = `preorders/${orderId}`;
  try {
    await updateDoc(doc(db, 'preorders', orderId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToUserPreOrders(
  uid: string,
  onUpdate: (orders: PreOrderRecord[]) => void
): Unsubscribe {
  const path = 'preorders';
  const q = query(collection(db, 'preorders'), where('userId', '==', uid), limit(25));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: PreOrderRecord[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<PreOrderRecord, 'id'>),
      }));
      items.sort((a, b) => {
        const ta = a.createdAt?.toMillis() ?? Date.now();
        const tb = b.createdAt?.toMillis() ?? Date.now();
        return tb - ta;
      });
      onUpdate(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
