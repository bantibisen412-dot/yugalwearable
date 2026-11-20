import type { HardwareFinish, ProductId, TouchType } from '../types/yugal';

export interface ProductCatalogItem {
  id: ProductId;
  name: string;
  subtitle: string;
  category: string;
  priceInr: number;
  priceUsdApprox: number;
  availability: string;
  description: string;
  dimensions: string;
  weight: string;
  battery: string;
  syncLatency: string;
  sizes: string[];
  sizeLabel: string;
  highlights: string[];
}

export const BASE_PAIR_PRICE_INR = 12999;
export const ACCESSORY_PACK_PRICE_INR = 2499;
export const REFERRAL_DISCOUNT_INR = 1500;
export const DEPOSIT_AMOUNT_INR = 1500;

export const HARDWARE_FINISHES: {
  name: HardwareFinish;
  material: string;
  swatchHex: string;
  ringStroke: string;
}[] = [
  {
    name: 'Obsidian Ceramic',
    material: 'Zirconia ceramic shell with satin inner titanium core',
    swatchHex: '#1D1F24',
    ringStroke: '#2E3139',
  },
  {
    name: 'Brushed Titanium Steel',
    material: '316L architectural stainless steel with micro-brushed bevels',
    swatchHex: '#B8BDC7',
    ringStroke: '#9BA2AF',
  },
];

export const PRODUCT_CATALOG: ProductCatalogItem[] = [
  {
    id: 'yugal-halo-pair',
    name: 'Yugal Halo Pair',
    subtitle: 'Connected Smart Ring Pair',
    category: 'Smart Rings',
    priceInr: BASE_PAIR_PRICE_INR,
    priceUsdApprox: 155,
    availability: 'First Batch Pre-Order · 150 Pairs',
    description:
      'Two sculpted rings machined around a proprietary micro-Linear Resonant Actuator. Press gently against the bevel to send a real-time squeeze or live heartbeat rhythm directly to your partner’s hand across any distance.',
    dimensions: '2.6 mm profile · 6.4 mm width',
    weight: '3.8 g per ring',
    battery: '48+ hours per charge',
    syncLatency: 'Sub-500 ms global cloud sync',
    sizes: ['US 5', 'US 6', 'US 7', 'US 8', 'US 9', 'US 10', 'US 11', 'Send Sizing Kit'],
    sizeLabel: 'Ring Size',
    highlights: [
      'Proprietary micro-LRA engine for lifelike squeeze & cardiac pulse modulation',
      '100% screen-free intimacy — zero notifications, step counters, or distractions',
      'Cross-platform Bluetooth Low Energy pairing for both iOS and Android',
    ],
  },
  {
    id: 'yugal-band-pair',
    name: 'Yugal Band Pair',
    subtitle: 'Connected Jewelry Bracelet Pair',
    category: 'Smart Bracelets',
    priceInr: BASE_PAIR_PRICE_INR,
    priceUsdApprox: 155,
    availability: 'First Batch Pre-Order · 150 Pairs',
    description:
      'A pair of understated wrist cuffs designed as fine everyday jewelry rather than fitness gear. Conceals an optical pulse cadence sensor and dual-axis LRA transducer that reproduces subtle wrist pressure and rhythmic heartbeats.',
    dimensions: '4.2 mm clasp profile · interchangeable strap',
    weight: '11.4 g per band',
    battery: '56 hours per charge',
    syncLatency: 'Sub-500 ms global cloud sync',
    sizes: ['Small (135–155 mm)', 'Medium (155–180 mm)', 'Large (180–205 mm)'],
    sizeLabel: 'Wrist Fit',
    highlights: [
      'Nuanced pressure-sensitive squeeze pad flush inside the outer clasp',
      'Water-resistant jewelry-grade finish built for continuous daily wear',
      'Includes two magnetic pebble chargers and dual gift presentation box',
    ],
  },
];

export interface TouchPatternSpec {
  type: TouchType;
  label: string;
  shortDesc: string;
  defaultIntensity: number;
  defaultDurationMs: number;
  defaultBpm: number;
}

export const TOUCH_PATTERNS: TouchPatternSpec[] = [
  {
    type: 'squeeze',
    label: 'Gentle Squeeze',
    shortDesc: 'Sustained warm pressure wave that mimics holding hands.',
    defaultIntensity: 78,
    defaultDurationMs: 1800,
    defaultBpm: 0,
  },
  {
    type: 'heartbeat',
    label: 'Heartbeat Rhythm',
    shortDesc: 'Dual-pulse lub-dub cardiac cadence transmitted in real time.',
    defaultIntensity: 84,
    defaultDurationMs: 2800,
    defaultBpm: 72,
  },
  {
    type: 'double_tap',
    label: 'Thinking of You',
    shortDesc: 'Crisp two-beat tactile knock to say hello without unlocking a screen.',
    defaultIntensity: 68,
    defaultDurationMs: 650,
    defaultBpm: 0,
  },
  {
    type: 'warm_pulse',
    label: 'Comfort Wave',
    shortDesc: 'Slow rising and settling acoustic tide for stressful moments apart.',
    defaultIntensity: 62,
    defaultDurationMs: 2400,
    defaultBpm: 0,
  },
  {
    type: 'goodnight',
    label: 'Goodnight Fade',
    shortDesc: 'Three tapering breaths before sleep instead of overnight battery-draining video calls.',
    defaultIntensity: 52,
    defaultDurationMs: 3200,
    defaultBpm: 0,
  },
];

export interface ComparisonRow {
  dimension: string;
  yugal: string;
  basicBracelets: string;
  smartwatches: string;
  videoCalls: string;
}

export const COMPETITOR_MATRIX: ComparisonRow[] = [
  {
    dimension: 'Tactile Realism',
    yugal: 'Micro-LRA lifelike squeezes & live heartbeat rhythms',
    basicBracelets: 'Generic single-note motor buzz',
    smartwatches: 'Secondary feature buried inside watchOS',
    videoCalls: 'None — purely visual and auditory',
  },
  {
    dimension: 'Screen-Free Presence',
    yugal: 'Zero screen attention required',
    basicBracelets: 'Screen-free tap, limited nuance',
    smartwatches: 'Constant notifications and screen glare',
    videoCalls: 'Demands active screen time and battery',
  },
  {
    dimension: 'Platform Freedom',
    yugal: 'Universal iOS & Android via BLE',
    basicBracelets: 'iOS & Android',
    smartwatches: 'Strict single-ecosystem lock-in',
    videoCalls: 'Cross-platform',
  },
  {
    dimension: 'Form Factor',
    yugal: 'Jewelry-grade ceramic & brushed steel',
    basicBracelets: 'Casual silicone / sporty bands',
    smartwatches: 'Bulky fitness computer on wrist',
    videoCalls: 'Smartphone hardware',
  },
  {
    dimension: 'Pair Price',
    yugal: '₹12,999 per pair',
    basicBracelets: '₹11,500 – ₹15,000 per pair',
    smartwatches: '₹60,000+ for two devices',
    videoCalls: 'Free (high screen fatigue)',
  },
];

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
