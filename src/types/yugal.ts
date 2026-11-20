import type { Timestamp } from 'firebase/firestore';

export type MoodOption =
  | 'Calm'
  | 'Missing You'
  | 'Unwinding'
  | 'Traveling'
  | 'Deep Focus'
  | 'Celebrating';

export const MOOD_OPTIONS: readonly MoodOption[] = [
  'Calm',
  'Missing You',
  'Unwinding',
  'Traveling',
  'Deep Focus',
  'Celebrating',
] as const;

export type TouchType =
  | 'squeeze'
  | 'heartbeat'
  | 'double_tap'
  | 'goodnight'
  | 'warm_pulse';

export type ProductId = 'yugal-halo-pair' | 'yugal-band-pair';
export type HardwareFinish = 'Obsidian Ceramic' | 'Brushed Titanium Steel';
export type PaymentPlan = 'deposit_1500' | 'full_12999';
export type ShippingRegion = 'India' | 'United States';

// Blueprint-synchronized validation constants (matching firebase-blueprint.json verbatim)
export const BLUEPRINT_LIMITS = {
  DISPLAY_NAME_MAX: 80,
  PARTNER_NAME_MAX: 60,
  ENGRAVING_MAX: 16,
  NOTE_MAX: 120,
  CITY_MIN: 2,
  CITY_MAX: 80,
  REFERRAL_REGEX: /^YGL-[A-Z0-9]{4,12}$/,
  PAIR_CODE_REGEX: /^[A-Z0-9]{8,12}$/,
  ID_REGEX: /^[a-zA-Z0-9_-]{1,128}$/,
} as const;

export interface UserProfileRecord {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  referralCode: string;
  activePairId: string;
  mood: MoodOption;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface CouplePairRecord {
  id: string;
  pairCode: string;
  ownerId: string;
  ownerName: string;
  ownerMood: MoodOption;
  partnerId: string;
  partnerName: string;
  partnerMood: MoodOption;
  status: 'open' | 'paired' | 'archived';
  touchCount: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface HapticTouchRecord {
  id: string;
  pairId: string;
  ownerId: string;
  partnerId: string;
  senderId: string;
  senderName: string;
  type: TouchType;
  intensity: number;
  durationMs: number;
  bpm: number;
  note: string;
  createdAt: Timestamp | null;
}

export interface PreOrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  productId: ProductId;
  productName: string;
  finish: HardwareFinish;
  sizePrimary: string;
  sizePartner: string;
  engraving: string;
  includeAccessoryPack: boolean;
  referralCodeApplied: string;
  discountInr: number;
  totalInr: number;
  paymentPlan: PaymentPlan;
  shippingCity: string;
  shippingRegion: ShippingRegion;
  status: 'reserved' | 'cancelled';
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}
