import { useState } from 'react';
import type { User } from 'firebase/auth';
import { Check, Copy, LogOut, X } from 'lucide-react';
import { formatInr } from '../data/catalog';
import { cancelPreOrder } from '../lib/firebase';
import type { PreOrderRecord, UserProfileRecord } from '../types/yugal';

interface AccountDrawerProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  profile: UserProfileRecord | null;
  orders: PreOrderRecord[];
  onSignOut: () => void;
}

export function AccountDrawer({
  open,
  onClose,
  user,
  profile,
  orders,
  onSignOut,
}: AccountDrawerProps) {
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  if (!open || !user) return null;

  function handleCopyReferral() {
    if (!profile?.referralCode) return;
    navigator.clipboard.writeText(profile.referralCode).catch(() => {});
    setCopiedReferral(true);
    window.setTimeout(() => setCopiedReferral(false), 2000);
  }

  async function handleCancelOrder(orderId: string) {
    setCancellingId(orderId);
    try {
      await cancelPreOrder(orderId);
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Account and Reservations"
    >
      <div className="w-full max-w-md bg-white h-full overflow-y-auto border-l border-[#E3E5EA] flex flex-col">
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-[#E3E5EA] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Account'}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#141518] text-white text-sm font-medium flex items-center justify-center shrink-0">
                {(user.displayName || 'Y').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#141518] truncate">
                {profile?.displayName || user.displayName || 'Yugal Member'}
              </p>
              <p className="text-xs text-[#767A87] truncate">{user.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close account panel"
            className="p-2 text-[#525560] hover:text-[#141518] rounded-lg hover:bg-[#F0F1F4] transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-8 flex-1">
          {/* Early-Adopter Referral Program */}
          <div className="p-5 bg-[#F8F8FA] border border-[#E3E5EA] rounded-xl">
            <p className="text-xs font-medium text-[#B8293D] mb-1.5">
              Couple Referral Program
            </p>
            <h3 className="font-editorial text-2xl font-medium text-[#141518]">
              Share ₹1,500 off accessories
            </h3>
            <p className="text-xs text-[#525560] mt-1.5 leading-relaxed">
              Invite a couple friend to reserve their Yugal pair and both of you receive ₹1,500 off
              magnetic docks and spare bands.
            </p>
            <div className="mt-4 flex items-center justify-between gap-2 bg-white border border-[#D8DBE2] rounded-lg px-3.5 py-2.5">
              <span className="font-technical text-sm font-medium text-[#141518] tracking-wider">
                {profile?.referralCode || 'Loading...'}
              </span>
              <button
                type="button"
                onClick={handleCopyReferral}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#141518] hover:text-[#B8293D] transition-colors whitespace-nowrap shrink-0"
              >
                {copiedReferral ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Pre-Order History */}
          <div>
            <div className="flex items-baseline justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#141518]">Your Pre-Orders</h3>
              <span className="font-technical text-xs text-[#767A87]">
                {orders.length} {orders.length === 1 ? 'reservation' : 'reservations'}
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="py-8 text-center border border-[#E3E5EA] rounded-xl px-4">
                <p className="text-sm text-[#525560]">No pre-orders yet.</p>
                <a
                  href="#pre-order"
                  onClick={onClose}
                  className="inline-block mt-3 text-xs font-medium text-[#B8293D] hover:underline"
                >
                  Configure your Yugal pair
                </a>
              </div>
            ) : (
              <ul className="space-y-4">
                {orders.map((order) => (
                  <li
                    key={order.id}
                    className="p-4 border border-[#E3E5EA] rounded-xl space-y-2.5"
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-technical text-xs font-medium text-[#141518]">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          order.status === 'reserved' ? 'text-[#141518]' : 'text-[#767A87]'
                        }`}
                      >
                        {order.status === 'reserved' ? 'Reserved · Batch 1' : 'Cancelled'}
                      </span>
                    </div>

                    <p className="text-sm font-medium text-[#141518]">
                      {order.productName} · {order.finish}
                    </p>

                    <div className="text-xs text-[#525560] flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span>
                        {order.sizePrimary} & {order.sizePartner}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {order.shippingCity}, {order.shippingRegion}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-technical text-[#141518]">
                        {formatInr(order.totalInr)}
                      </span>
                    </div>

                    {order.engraving && (
                      <p className="font-technical text-[11px] text-[#767A87]">
                        Engraving: {order.engraving}
                      </p>
                    )}

                    {order.status === 'reserved' && (
                      <div className="pt-2 border-t border-[#F0F1F4] flex justify-end">
                        <button
                          type="button"
                          disabled={cancellingId === order.id}
                          onClick={() => void handleCancelOrder(order.id)}
                          className="text-xs font-medium text-[#767A87] hover:text-[#B8293D] disabled:opacity-50 transition-colors"
                        >
                          {cancellingId === order.id ? 'Cancelling...' : 'Cancel Reservation'}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-4 border-t border-[#E3E5EA]">
          <button
            type="button"
            onClick={() => {
              onSignOut();
              onClose();
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[#525560] hover:text-[#141518] hover:bg-[#F8F8FA] border border-[#E3E5EA] rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
