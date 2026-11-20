import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { Check } from 'lucide-react';
import {
  ACCESSORY_PACK_PRICE_INR,
  BASE_PAIR_PRICE_INR,
  DEPOSIT_AMOUNT_INR,
  formatInr,
  HARDWARE_FINISHES,
  PRODUCT_CATALOG,
  REFERRAL_DISCOUNT_INR,
} from '../data/catalog';
import { createPreOrder } from '../lib/firebase';
import {
  BLUEPRINT_LIMITS,
  type HardwareFinish,
  type PaymentPlan,
  type PreOrderRecord,
  type ProductId,
  type ShippingRegion,
} from '../types/yugal';
import { HardwareSculpture } from './HardwareArtwork';

interface PreOrderSectionProps {
  user: User | null;
  selectedProductId: ProductId;
  onSelectProductId: (id: ProductId) => void;
  selectedFinish: HardwareFinish;
  onSelectFinish: (finish: HardwareFinish) => void;
  onSignIn: () => Promise<User | null>;
  onOrderCreated: (order: PreOrderRecord) => void;
}

export function PreOrderSection({
  user,
  selectedProductId,
  onSelectProductId,
  selectedFinish,
  onSelectFinish,
  onSignIn,
  onOrderCreated,
}: PreOrderSectionProps) {
  const product =
    PRODUCT_CATALOG.find((p) => p.id === selectedProductId) ?? PRODUCT_CATALOG[0];

  const [sizePrimary, setSizePrimary] = useState(product.sizes[2] || product.sizes[0]);
  const [sizePartner, setSizePartner] = useState(product.sizes[3] || product.sizes[0]);
  const [engraving, setEngraving] = useState('');
  const [includeAccessoryPack, setIncludeAccessoryPack] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan>('deposit_1500');
  const [shippingRegion, setShippingRegion] = useState<ShippingRegion>('India');
  const [shippingCity, setShippingCity] = useState('');
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    if (user?.displayName) {
      setCustomerName((prev) => (prev ? prev : user.displayName || ''));
    }
  }, [user?.displayName]);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<PreOrderRecord | null>(null);

  function handleProductSwitch(nextId: ProductId) {
    onSelectProductId(nextId);
    const nextProduct = PRODUCT_CATALOG.find((p) => p.id === nextId) ?? PRODUCT_CATALOG[0];
    setSizePrimary(nextProduct.sizes[1] || nextProduct.sizes[0]);
    setSizePartner(nextProduct.sizes[2] || nextProduct.sizes[0]);
  }

  const normalizedReferral = referralCodeInput.trim().toUpperCase();
  const referralValid =
    normalizedReferral.length > 0 && BLUEPRINT_LIMITS.REFERRAL_REGEX.test(normalizedReferral);
  const discountInr = includeAccessoryPack && referralValid ? REFERRAL_DISCOUNT_INR : 0;
  const totalInr =
    BASE_PAIR_PRICE_INR +
    (includeAccessoryPack ? ACCESSORY_PACK_PRICE_INR : 0) -
    discountInr;
  const dueTodayInr = paymentPlan === 'deposit_1500' ? DEPOSIT_AMOUNT_INR : totalInr;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const cityTrimmed = shippingCity.trim();
    if (cityTrimmed.length < BLUEPRINT_LIMITS.CITY_MIN) {
      setFormError('Please enter your delivery city (e.g., Bengaluru, Mumbai, New York).');
      return;
    }

    if (normalizedReferral.length > 0 && !referralValid) {
      setFormError('Referral code format should look like YGL-A1B2C3.');
      return;
    }

    let activeUser = user;
    if (!activeUser) {
      activeUser = await onSignIn();
      if (!activeUser) {
        setFormError('Sign in with Google to confirm and track your pre-order reservation.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const order = await createPreOrder(activeUser, {
        productId: product.id,
        productName: product.name,
        finish: selectedFinish,
        sizePrimary,
        sizePartner,
        engraving,
        includeAccessoryPack,
        referralCodeApplied: referralValid ? normalizedReferral : '',
        paymentPlan,
        shippingCity: cityTrimmed,
        shippingRegion,
        customerName: customerName.trim() || activeUser.displayName || 'Yugal Member',
      });
      setConfirmedOrder(order);
      onOrderCreated(order);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save pre-order.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="pre-order" className="py-24 bg-white border-t border-[#E3E5EA]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-2xl mb-14">
          <p className="text-xs font-medium tracking-[0.14em] text-[#B8293D] mb-3">
            First Production Batch
          </p>
          <h2 className="font-editorial text-4xl sm:text-5xl font-medium tracking-tight text-[#141518]">
            Pre-order your pair today and close the distance
          </h2>
          <p className="mt-4 text-[15px] text-[#525560] leading-relaxed">
            Every set includes two paired wearables, dual magnetic pebble chargers, and cross-platform
            iOS & Android companion access. Reserve with a refundable ₹1,500 deposit or lock in full
            pre-order priority.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Sticky Hardware Preview */}
          <div className="lg:col-span-6 lg:sticky lg:top-24">
            <div className="bg-[#F8F8FA] border border-[#E3E5EA] rounded-xl p-8">
              <div className="flex items-center justify-between text-xs text-[#525560] mb-4">
                <span>
                  {product.category}
                  <span aria-hidden="true" className="mx-2">
                    ·
                  </span>
                  {selectedFinish}
                </span>
                <span className="font-technical">{product.availability}</span>
              </div>

              <div className="aspect-[4/3] w-full">
                <HardwareSculpture
                  productId={product.id}
                  finish={selectedFinish}
                  engraving={engraving}
                  pulseActive={Boolean(confirmedOrder)}
                />
              </div>

              <div className="mt-6 pt-6 border-t border-[#E3E5EA] grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-[#767A87]">Dimensions</p>
                  <p className="font-medium text-[#141518] mt-1">{product.dimensions}</p>
                </div>
                <div>
                  <p className="text-[#767A87]">Battery Life</p>
                  <p className="font-technical font-medium text-[#141518] mt-1">
                    {product.battery}
                  </p>
                </div>
                <div>
                  <p className="text-[#767A87]">Cloud Sync</p>
                  <p className="font-technical font-medium text-[#141518] mt-1">
                    {product.syncLatency}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Contiguous Purchase Module */}
          <div className="lg:col-span-6">
            {confirmedOrder ? (
              <div className="bg-[#F8F8FA] border border-[#E3E5EA] rounded-xl p-8 space-y-6">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-[#141518]">
                  <span className="w-6 h-6 rounded-full bg-[#141518] text-white inline-flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                  <span>Reservation Saved to Your Account</span>
                </div>

                <div>
                  <h3 className="font-editorial text-3xl font-medium text-[#141518]">
                    Order #{confirmedOrder.orderNumber} Confirmed
                  </h3>
                  <p className="text-sm text-[#525560] mt-2 leading-relaxed">
                    Your {confirmedOrder.productName} in {confirmedOrder.finish} is reserved for
                    first-batch dispatch to {confirmedOrder.shippingCity},{' '}
                    {confirmedOrder.shippingRegion}.
                  </p>
                </div>

                <dl className="divide-y divide-[#E3E5EA] border-y border-[#E3E5EA] text-sm">
                  <div className="py-3 flex justify-between gap-4">
                    <dt className="text-[#525560]">Wearable Pair</dt>
                    <dd className="font-medium text-[#141518]">
                      {confirmedOrder.productName} ({confirmedOrder.finish})
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between gap-4">
                    <dt className="text-[#525560]">Sizes</dt>
                    <dd className="font-technical text-[#141518]">
                      {confirmedOrder.sizePrimary} / {confirmedOrder.sizePartner}
                    </dd>
                  </div>
                  {confirmedOrder.engraving && (
                    <div className="py-3 flex justify-between gap-4">
                      <dt className="text-[#525560]">Inner Engraving</dt>
                      <dd className="font-technical text-[#141518]">{confirmedOrder.engraving}</dd>
                    </div>
                  )}
                  <div className="py-3 flex justify-between gap-4">
                    <dt className="text-[#525560]">Total Pair Value</dt>
                    <dd className="font-technical font-medium text-[#141518]">
                      {formatInr(confirmedOrder.totalInr)}
                    </dd>
                  </div>
                  <div className="py-3 flex justify-between gap-4">
                    <dt className="text-[#525560]">Commitment Plan</dt>
                    <dd className="font-medium text-[#141518]">
                      {confirmedOrder.paymentPlan === 'deposit_1500'
                        ? '₹1,500 Refundable Deposit'
                        : 'Full Pre-Order Priority'}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => setConfirmedOrder(null)}
                  className="px-5 py-2.5 text-sm font-medium text-[#141518] bg-white border border-[#D8DBE2] hover:border-[#141518] rounded-lg transition-colors"
                >
                  Configure Another Pair
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-7">
                {/* Product Form Factor Switch */}
                <div>
                  <label className="block text-xs font-medium text-[#525560] mb-2.5">
                    1. Select Form Factor (Includes Pair of 2)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PRODUCT_CATALOG.map((item) => {
                      const active = item.id === product.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleProductSwitch(item.id)}
                          className={`text-left p-4 rounded-xl border transition-colors ${
                            active
                              ? 'border-[#141518] bg-[#F8F8FA]'
                              : 'border-[#E3E5EA] bg-white hover:border-[#A9AEB9]'
                          }`}
                        >
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-sm font-semibold text-[#141518]">
                              {item.name}
                            </span>
                            <span className="font-technical text-xs text-[#141518]">
                              {formatInr(item.priceInr)}
                            </span>
                          </div>
                          <p className="text-xs text-[#525560] mt-1">{item.subtitle}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Jewelry Finish */}
                <div>
                  <label className="block text-xs font-medium text-[#525560] mb-2.5">
                    2. Jewelry-Grade Finish
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {HARDWARE_FINISHES.map((fin) => {
                      const active = fin.name === selectedFinish;
                      return (
                        <button
                          key={fin.name}
                          type="button"
                          onClick={() => onSelectFinish(fin.name)}
                          className={`flex items-start gap-3 text-left p-3.5 rounded-xl border transition-colors ${
                            active
                              ? 'border-[#141518] bg-[#F8F8FA]'
                              : 'border-[#E3E5EA] bg-white hover:border-[#A9AEB9]'
                          }`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border border-black/15 shrink-0 mt-0.5"
                            style={{ backgroundColor: fin.swatchHex }}
                          />
                          <div>
                            <p className="text-sm font-medium text-[#141518]">{fin.name}</p>
                            <p className="text-xs text-[#525560] mt-0.5 leading-snug">
                              {fin.material}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dual Partner Sizing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="size-primary"
                      className="block text-xs font-medium text-[#525560] mb-1.5"
                    >
                      Your {product.sizeLabel}
                    </label>
                    <select
                      id="size-primary"
                      value={sizePrimary}
                      onChange={(e) => setSizePrimary(e.target.value)}
                      className="w-full bg-white border border-[#D8DBE2] rounded-lg px-3.5 py-2.5 text-sm text-[#141518] focus:outline-none focus:border-[#141518]"
                    >
                      {product.sizes.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="size-partner"
                      className="block text-xs font-medium text-[#525560] mb-1.5"
                    >
                      Partner’s {product.sizeLabel}
                    </label>
                    <select
                      id="size-partner"
                      value={sizePartner}
                      onChange={(e) => setSizePartner(e.target.value)}
                      className="w-full bg-white border border-[#D8DBE2] rounded-lg px-3.5 py-2.5 text-sm text-[#141518] focus:outline-none focus:border-[#141518]"
                    >
                      {product.sizes.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Optional Engraving */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="engraving-input"
                      className="text-xs font-medium text-[#525560]"
                    >
                      Complimentary Inner Engraving (Optional)
                    </label>
                    <span className="font-technical text-[11px] text-[#767A87]">
                      {engraving.length}/{BLUEPRINT_LIMITS.ENGRAVING_MAX}
                    </span>
                  </div>
                  <input
                    id="engraving-input"
                    type="text"
                    maxLength={BLUEPRINT_LIMITS.ENGRAVING_MAX}
                    value={engraving}
                    onChange={(e) => setEngraving(e.target.value)}
                    placeholder="Initials, date, or city coordinates"
                    className="w-full bg-white border border-[#D8DBE2] rounded-lg px-3.5 py-2.5 text-sm text-[#141518] placeholder:text-[#989CA8] focus:outline-none focus:border-[#141518]"
                  />
                </div>

                {/* Accessory Pack & Referral Incentive */}
                <div className="p-4 bg-[#F8F8FA] border border-[#E3E5EA] rounded-xl space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeAccessoryPack}
                      onChange={(e) => setIncludeAccessoryPack(e.target.checked)}
                      className="mt-1 accent-[#B8293D] w-4 h-4 shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-[#141518]">
                          Add Duo Magnetic Dock & Spare Bands
                        </span>
                        <span className="font-technical text-xs text-[#141518]">
                          +{formatInr(ACCESSORY_PACK_PRICE_INR)}
                        </span>
                      </div>
                      <p className="text-xs text-[#525560] mt-0.5">
                        Eligible for the ₹1,500 couple referral credit when you apply an invite
                        code below.
                      </p>
                    </div>
                  </label>

                  <div>
                    <label
                      htmlFor="referral-input"
                      className="block text-xs font-medium text-[#525560] mb-1.5"
                    >
                      Couple Referral Code (₹1,500 off accessories)
                    </label>
                    <input
                      id="referral-input"
                      type="text"
                      maxLength={20}
                      value={referralCodeInput}
                      onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. YGL-A1B2C3"
                      className="w-full bg-white border border-[#D8DBE2] rounded-lg px-3.5 py-2 font-technical text-sm uppercase tracking-wider text-[#141518] placeholder:text-[#989CA8] focus:outline-none focus:border-[#141518]"
                    />
                    {referralValid && !includeAccessoryPack && (
                      <p className="text-xs text-[#525560] mt-1.5">
                        Code recognized — check the Duo Magnetic Dock & Spare Bands box above to
                        apply ₹1,500 off.
                      </p>
                    )}
                    {discountInr > 0 && (
                      <p className="text-xs font-medium text-[#B8293D] mt-1.5">
                        ₹1,500 referral accessory credit applied.
                      </p>
                    )}
                  </div>
                </div>

                {/* Delivery Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="customer-name"
                      className="block text-xs font-medium text-[#525560] mb-1.5"
                    >
                      Full Name
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      maxLength={BLUEPRINT_LIMITS.DISPLAY_NAME_MAX}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full bg-white border border-[#D8DBE2] rounded-lg px-3.5 py-2.5 text-sm text-[#141518] placeholder:text-[#989CA8] focus:outline-none focus:border-[#141518]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="shipping-region"
                      className="block text-xs font-medium text-[#525560] mb-1.5"
                    >
                      Launch Region
                    </label>
                    <select
                      id="shipping-region"
                      value={shippingRegion}
                      onChange={(e) => setShippingRegion(e.target.value as ShippingRegion)}
                      className="w-full bg-white border border-[#D8DBE2] rounded-lg px-3.5 py-2.5 text-sm text-[#141518] focus:outline-none focus:border-[#141518]"
                    >
                      <option value="India">India (Tier-1 Metro Dispatch)</option>
                      <option value="United States">United States (Priority Dispatch)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="shipping-city"
                    className="block text-xs font-medium text-[#525560] mb-1.5"
                  >
                    Delivery City
                  </label>
                  <input
                    id="shipping-city"
                    type="text"
                    required
                    minLength={BLUEPRINT_LIMITS.CITY_MIN}
                    maxLength={BLUEPRINT_LIMITS.CITY_MAX}
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    placeholder={
                      shippingRegion === 'India'
                        ? 'Bengaluru, Mumbai, Delhi NCR, Hyderabad...'
                        : 'New York, San Francisco, Boston, Austin...'
                    }
                    className="w-full bg-white border border-[#D8DBE2] rounded-lg px-3.5 py-2.5 text-sm text-[#141518] placeholder:text-[#989CA8] focus:outline-none focus:border-[#141518]"
                  />
                </div>

                {/* Commitment Option */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentPlan('deposit_1500')}
                    className={`text-left p-3.5 rounded-xl border transition-colors ${
                      paymentPlan === 'deposit_1500'
                        ? 'border-[#141518] bg-[#F8F8FA]'
                        : 'border-[#E3E5EA] bg-white hover:border-[#A9AEB9]'
                    }`}
                  >
                    <p className="text-sm font-medium text-[#141518]">Refundable Deposit</p>
                    <p className="font-technical text-xs text-[#525560] mt-0.5">
                      {formatInr(DEPOSIT_AMOUNT_INR)} today · balance at dispatch
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentPlan('full_12999')}
                    className={`text-left p-3.5 rounded-xl border transition-colors ${
                      paymentPlan === 'full_12999'
                        ? 'border-[#141518] bg-[#F8F8FA]'
                        : 'border-[#E3E5EA] bg-white hover:border-[#A9AEB9]'
                    }`}
                  >
                    <p className="text-sm font-medium text-[#141518]">Full Pre-Order</p>
                    <p className="font-technical text-xs text-[#525560] mt-0.5">
                      {formatInr(totalInr)} total · priority Batch 1 ship
                    </p>
                  </button>
                </div>

                {formError && (
                  <p role="alert" className="text-xs font-medium text-[#B8293D]">
                    {formError}
                  </p>
                )}

                {/* Order Summary & Submit CTA */}
                <div className="pt-5 border-t border-[#E3E5EA] space-y-4">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-[#525560]">Total Pair Price</span>
                    <span className="font-technical text-lg font-medium text-[#141518]">
                      {formatInr(totalInr)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-xs text-[#525560]">
                    <span>Reservation Commitment</span>
                    <span className="font-technical font-medium text-[#141518]">
                      {formatInr(dueTodayInr)}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-6 text-sm font-medium text-white bg-[#B8293D] hover:bg-[#9B2031] disabled:opacity-60 rounded-lg transition-colors"
                  >
                    {submitting
                      ? 'Confirming Reservation...'
                      : user
                        ? `Reserve ${product.name} — ${formatInr(dueTodayInr)}`
                        : `Sign in with Google & Reserve — ${formatInr(dueTodayInr)}`}
                  </button>

                  <p className="text-xs text-[#767A87] leading-relaxed">
                    Free insured shipping across Tier-1 cities in India and the United States.
                    Cancel anytime before batch manufacturing locks.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
