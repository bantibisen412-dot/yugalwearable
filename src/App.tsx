import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { ArrowRight } from 'lucide-react';
import { AccountDrawer } from './components/AccountDrawer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HardwareSculpture } from './components/HardwareArtwork';
import { LiveTouchStudio } from './components/LiveTouchStudio';
import { PreOrderSection } from './components/PreOrderSection';
import { TopBar } from './components/TopBar';
import {
  COMPETITOR_MATRIX,
  formatInr,
  HARDWARE_FINISHES,
  PRODUCT_CATALOG,
} from './data/catalog';
import {
  auth,
  ensureUserProfile,
  signInWithGoogleAccount,
  signOutAccount,
  subscribeToPair,
  subscribeToPairTouches,
  subscribeToUserPreOrders,
  subscribeToUserProfile,
} from './lib/firebase';
import { triggerHapticFeedback } from './lib/haptics';
import type {
  CouplePairRecord,
  HardwareFinish,
  HapticTouchRecord,
  PreOrderRecord,
  ProductId,
  UserProfileRecord,
} from './types/yugal';

function YugalExperience() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfileRecord | null>(null);
  const [pair, setPair] = useState<CouplePairRecord | null>(null);
  const [touches, setTouches] = useState<HapticTouchRecord[]>([]);
  const [orders, setOrders] = useState<PreOrderRecord[]>([]);

  const [selectedProductId, setSelectedProductId] = useState<ProductId>('yugal-halo-pair');
  const [selectedFinish, setSelectedFinish] = useState<HardwareFinish>('Obsidian Ceramic');
  const [heroPulse, setHeroPulse] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
      if (nextUser) {
        try {
          await ensureUserProfile(nextUser);
        } catch (err) {
          console.error('Failed to ensure profile:', err);
        }
      } else {
        setProfile(null);
        setPair(null);
        setTouches([]);
        setOrders([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to signed-in user's profile and pre-orders
  useEffect(() => {
    if (!user) return;
    const unsubProfile = subscribeToUserProfile(user.uid, setProfile);
    const unsubOrders = subscribeToUserPreOrders(user.uid, setOrders);
    return () => {
      unsubProfile();
      unsubOrders();
    };
  }, [user]);

  // Subscribe to user's active pair channel
  useEffect(() => {
    if (!user || !profile?.activePairId) {
      setPair(null);
      setTouches([]);
      return;
    }
    const unsubPair = subscribeToPair(profile.activePairId, setPair);
    return () => unsubPair();
  }, [user, profile?.activePairId]);

  // Subscribe to live haptic touches for the active pair
  useEffect(() => {
    if (!user || !pair) {
      setTouches([]);
      return;
    }
    const unsubTouches = subscribeToPairTouches(pair, user.uid, setTouches);
    return () => unsubTouches();
  }, [user, pair]);

  async function handleGoogleSignIn(): Promise<User | null> {
    setAuthBusy(true);
    setAuthNotice(null);
    try {
      const signedIn = await signInWithGoogleAccount();
      await ensureUserProfile(signedIn);
      return signedIn;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to sign in with Google.';
      if (!msg.includes('popup-closed-by-user')) {
        setAuthNotice(msg);
      }
      return null;
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignOut() {
    await signOutAccount();
  }

  function handleHeroPulseDemo() {
    setHeroPulse(true);
    triggerHapticFeedback('heartbeat', { intensity: 76, bpm: 70, soundEnabled: true });
    window.setTimeout(() => setHeroPulse(false), 1600);
  }

  function handleConfigureProduct(productId: ProductId) {
    setSelectedProductId(productId);
    const el = document.getElementById('pre-order');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div id="top" className="min-h-screen bg-[#F8F8FA] text-[#141518]">
      <TopBar
        user={user}
        authLoading={authLoading}
        authBusy={authBusy}
        orderCount={orders.filter((o) => o.status === 'reserved').length}
        onSignIn={() => void handleGoogleSignIn()}
        onOpenAccount={() => setAccountOpen(true)}
      />

      {authNotice && (
        <div
          role="alert"
          className="bg-[#141518] text-white text-xs py-2.5 px-6 flex items-center justify-between gap-4"
        >
          <span>{authNotice}</span>
          <button
            type="button"
            onClick={() => setAuthNotice(null)}
            className="text-white/70 hover:text-white underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <main>
        {/* 1. Editorial Luxury Hero */}
        <section className="pt-14 pb-20 lg:pt-20 lg:pb-24">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
              {/* Left Narrative Column */}
              <div className="lg:col-span-6 flex flex-col justify-center">
                <p className="text-xs font-medium tracking-[0.14em] text-[#B8293D] mb-4">
                  Emotional Technology · Connected Relationship Wearables
                </p>

                <h1 className="font-editorial text-5xl sm:text-6xl font-medium leading-[1.06] tracking-tight text-[#141518]">
                  Feel their presence, wherever they are
                </h1>

                <p className="mt-6 text-base text-[#525560] leading-relaxed max-w-[54ch]">
                  Interconnected jewelry-grade rings and bracelets that transmit real-time gentle
                  squeezes and live heartbeat rhythms across any distance — bridging the physical
                  gap without adding screen time.
                </p>

                <div className="mt-9 flex flex-wrap items-center gap-4">
                  <a
                    href="#pre-order"
                    className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-white bg-[#B8293D] hover:bg-[#9B2031] rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Pre-Order Your Pair</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href="#live-touch"
                    className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-medium text-[#141518] bg-white border border-[#D8DBE2] hover:border-[#141518] rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>Try Live Touch Studio</span>
                  </a>
                </div>

                <p className="mt-6 text-xs text-[#767A87]">
                  First batch pre-order at{' '}
                  <span className="font-technical text-[#141518]">₹12,999</span> per pair
                  <span aria-hidden="true" className="mx-2">
                    ·
                  </span>
                  India & United States dispatch
                </p>
              </div>

              {/* Right Sculptural Hardware Stage */}
              <div className="lg:col-span-6 bg-white border border-[#E3E5EA] rounded-xl p-6 sm:p-8 flex flex-col justify-between">
                <div className="flex items-center justify-between gap-4 text-xs text-[#525560]">
                  <span>
                    {selectedProductId === 'yugal-halo-pair' ? 'Yugal Halo Pair' : 'Yugal Band Pair'}
                    <span aria-hidden="true" className="mx-2">
                      ·
                    </span>
                    {selectedFinish}
                  </span>
                  <button
                    type="button"
                    onClick={handleHeroPulseDemo}
                    className="font-medium text-[#B8293D] hover:underline whitespace-nowrap shrink-0"
                  >
                    {heroPulse ? 'Pulsing 70 BPM...' : 'Feel Sample Heartbeat'}
                  </button>
                </div>

                <div className="my-4 aspect-[4/3] w-full">
                  <HardwareSculpture
                    productId={selectedProductId}
                    finish={selectedFinish}
                    pulseActive={heroPulse}
                  />
                </div>

                <div className="pt-4 border-t border-[#E3E5EA] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {HARDWARE_FINISHES.map((fin) => (
                      <button
                        key={fin.name}
                        type="button"
                        onClick={() => setSelectedFinish(fin.name)}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-md border transition-colors whitespace-nowrap ${
                          selectedFinish === fin.name
                            ? 'border-[#141518] bg-[#F8F8FA] text-[#141518] font-medium'
                            : 'border-[#E3E5EA] text-[#525560] hover:border-[#A9AEB9]'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/15"
                          style={{ backgroundColor: fin.swatchHex }}
                        />
                        <span>{fin.name}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-[#F0F1F4] rounded-lg">
                    <button
                      type="button"
                      onClick={() => setSelectedProductId('yugal-halo-pair')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        selectedProductId === 'yugal-halo-pair'
                          ? 'bg-white text-[#141518] shadow-xs'
                          : 'text-[#525560] hover:text-[#141518]'
                      }`}
                    >
                      Rings
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedProductId('yugal-band-pair')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        selectedProductId === 'yugal-band-pair'
                          ? 'bg-white text-[#141518] shadow-xs'
                          : 'text-[#525560] hover:text-[#141518]'
                      }`}
                    >
                      Bracelets
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-Width 4-Column Hardware Engineering Strip */}
            <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 border border-[#E3E5EA] bg-white rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-[#E3E5EA]">
              <div className="p-6">
                <p className="font-technical text-2xl font-medium text-[#141518]">&lt;500 ms</p>
                <p className="text-xs text-[#525560] mt-1.5">
                  Low-latency global touch synchronization over 4G, 5G, and Wi-Fi
                </p>
              </div>
              <div className="p-6">
                <p className="font-technical text-2xl font-medium text-[#141518]">48+ hrs</p>
                <p className="text-xs text-[#525560] mt-1.5">
                  Continuous battery life per charge under 15–20 daily touch exchanges
                </p>
              </div>
              <div className="p-6">
                <p className="font-technical text-2xl font-medium text-[#141518]">Micro-LRA</p>
                <p className="text-xs text-[#525560] mt-1.5">
                  Linear resonant actuators for lifelike squeezes instead of harsh buzzing
                </p>
              </div>
              <div className="p-6">
                <p className="font-technical text-2xl font-medium text-[#141518]">iOS + Android</p>
                <p className="text-xs text-[#525560] mt-1.5">
                  Universal cross-platform BLE pairing with zero ecosystem lock-in
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Featured Collection Grid */}
        <section id="collection" className="py-24 bg-white border-t border-[#E3E5EA]">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
              <div className="max-w-xl">
                <p className="text-xs font-medium tracking-[0.14em] text-[#B8293D] mb-3">
                  The First Collection
                </p>
                <h2 className="font-editorial text-4xl sm:text-5xl font-medium tracking-tight text-[#141518]">
                  Two silhouettes, engineered strictly for intimacy
                </h2>
              </div>
              <p className="text-sm text-[#525560] max-w-md leading-relaxed">
                Deliberately free of step counters, calorie alerts, and glowing displays. Sold
                exclusively in matched pairs at ₹12,999.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {PRODUCT_CATALOG.map((item) => (
                <article
                  key={item.id}
                  className="bg-[#F8F8FA] border border-[#E3E5EA] rounded-xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="p-8 bg-[#F2F3F7] aspect-[4/3] flex items-center justify-center">
                    <HardwareSculpture productId={item.id} finish={selectedFinish} />
                  </div>

                  <div className="p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#767A87]">
                        <span>{item.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.weight}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.battery}</span>
                      </div>

                      <div className="mt-3 flex items-baseline justify-between gap-4">
                        <h3 className="font-editorial text-3xl font-medium text-[#141518]">
                          {item.name}
                        </h3>
                        <p className="font-technical text-base font-medium text-[#141518] shrink-0">
                          {formatInr(item.priceInr)}
                        </p>
                      </div>

                      <p className="mt-3 text-sm text-[#525560] leading-relaxed">
                        {item.description}
                      </p>

                      <ul className="mt-5 space-y-2 text-xs text-[#525560] border-t border-[#E3E5EA] pt-5">
                        {item.highlights.map((h) => (
                          <li key={h} className="leading-relaxed">
                            — {h}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8">
                      <button
                        type="button"
                        onClick={() => handleConfigureProduct(item.id)}
                        className="w-full py-3 px-5 text-sm font-medium text-white bg-[#141518] hover:bg-[#272A31] rounded-lg transition-colors"
                      >
                        Configure {item.name}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Interactive Live Touch Studio (Real-Time Firebase Companion) */}
        <LiveTouchStudio
          user={user}
          profile={profile}
          pair={pair}
          touches={touches}
          onSignIn={() => void handleGoogleSignIn()}
          authBusy={authBusy}
        />

        {/* 4. Craft & Positioning Comparison */}
        <section id="craft" className="py-24 bg-[#F8F8FA]">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
              <div className="lg:col-span-5">
                <p className="text-xs font-medium tracking-[0.14em] text-[#B8293D] mb-3">
                  Why Yugal Exists
                </p>
                <h2 className="font-editorial text-4xl sm:text-5xl font-medium tracking-tight text-[#141518]">
                  Built to end screen fatigue and touch deprivation
                </h2>
              </div>
              <div className="lg:col-span-7 space-y-4 text-[15px] text-[#525560] leading-relaxed">
                <p>
                  Couples separated by university campuses, relocating careers, or frequent business
                  travel often leave video calls running overnight or constantly watch read receipts
                  — draining batteries and attention without delivering genuine physical comfort.
                </p>
                <p>
                  Yugal Wearables repurposes proven micro-Linear Resonant Actuators (LRA) and
                  Bluetooth Low Energy into jewelry-grade ceramic and titanium hardware dedicated
                  solely to one purpose: letting you feel your partner’s touch or heartbeat the
                  instant they think of you.
                </p>
              </div>
            </div>

            {/* Positioning Comparison Table */}
            <div className="bg-white border border-[#E3E5EA] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[720px]">
                  <thead>
                    <tr className="border-b border-[#E3E5EA] text-xs font-medium text-[#767A87]">
                      <th className="py-4 px-6">Dimension</th>
                      <th className="py-4 px-6 text-[#141518] bg-[#F8F8FA]">Yugal Wearables</th>
                      <th className="py-4 px-6">Basic Buzz Bracelets</th>
                      <th className="py-4 px-6">Smartwatches</th>
                      <th className="py-4 px-6">Video Calls & Text</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3E5EA] text-sm">
                    {COMPETITOR_MATRIX.map((row) => (
                      <tr key={row.dimension}>
                        <td className="py-4 px-6 font-medium text-[#141518]">{row.dimension}</td>
                        <td className="py-4 px-6 font-medium text-[#141518] bg-[#F8F8FA]">
                          {row.yugal}
                        </td>
                        <td className="py-4 px-6 text-[#525560]">{row.basicBracelets}</td>
                        <td className="py-4 px-6 text-[#525560]">{row.smartwatches}</td>
                        <td className="py-4 px-6 text-[#525560]">{row.videoCalls}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Contiguous Pre-Order Section */}
        <PreOrderSection
          user={user}
          selectedProductId={selectedProductId}
          onSelectProductId={setSelectedProductId}
          selectedFinish={selectedFinish}
          onSelectFinish={setSelectedFinish}
          onSignIn={handleGoogleSignIn}
          onOrderCreated={() => {}}
        />
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="bg-[#F8F8FA] border-t border-[#E3E5EA] py-12">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-editorial text-2xl font-semibold text-[#141518]">Yugal Wearables</p>
            <p className="text-xs text-[#767A87] mt-1">
              Connected relationship wearables · Tier-1 India & United States launch
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-[#525560]">
            <a href="#collection" className="hover:text-[#141518] transition-colors">
              Collection
            </a>
            <a href="#live-touch" className="hover:text-[#141518] transition-colors">
              Live Touch
            </a>
            <a href="#craft" className="hover:text-[#141518] transition-colors">
              Craft
            </a>
            <a href="#pre-order" className="hover:text-[#141518] transition-colors">
              Pre-Order
            </a>
            <span className="text-[#767A87]">© {new Date().getFullYear()} Yugal Wearables</span>
          </div>
        </div>
      </footer>

      <AccountDrawer
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        user={user}
        profile={profile}
        orders={orders}
        onSignOut={() => void handleSignOut()}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <YugalExperience />
    </ErrorBoundary>
  );
}
