import type { User } from 'firebase/auth';

interface TopBarProps {
  user: User | null;
  authLoading: boolean;
  authBusy: boolean;
  orderCount: number;
  onSignIn: () => void;
  onOpenAccount: () => void;
}

export function TopBar({
  user,
  authLoading,
  authBusy,
  orderCount,
  onSignIn,
  onOpenAccount,
}: TopBarProps) {
  const firstName = user?.displayName?.split(' ')[0] || 'Account';

  return (
    <header className="sticky top-0 z-40 bg-[#F8F8FA]/95 backdrop-blur-md border-b border-[#E3E5EA]">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="font-editorial text-2xl font-semibold tracking-tight text-[#141518] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B8293D]"
        >
          Yugal
        </a>

        {/* Zone 2: 4 clean single-line text navigation links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-[#525560]"
        >
          <a
            href="#collection"
            className="hover:text-[#141518] hover:underline underline-offset-8 decoration-[#141518]/30 transition-colors whitespace-nowrap shrink-0"
          >
            Collection
          </a>
          <a
            href="#live-touch"
            className="hover:text-[#141518] hover:underline underline-offset-8 decoration-[#141518]/30 transition-colors whitespace-nowrap shrink-0"
          >
            Live Touch
          </a>
          <a
            href="#craft"
            className="hover:text-[#141518] hover:underline underline-offset-8 decoration-[#141518]/30 transition-colors whitespace-nowrap shrink-0"
          >
            Craft
          </a>
          <a
            href="#pre-order"
            className="hover:text-[#141518] hover:underline underline-offset-8 decoration-[#141518]/30 transition-colors whitespace-nowrap shrink-0"
          >
            Pre-Order
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          {user ? (
            <button
              type="button"
              onClick={onOpenAccount}
              className="inline-flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-[#141518] bg-white border border-[#D8DBE2] rounded-lg hover:border-[#141518] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8293D]"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={firstName}
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full object-cover shrink-0"
                />
              ) : (
                <span className="w-5 h-5 rounded-full bg-[#141518] text-white text-[11px] flex items-center justify-center shrink-0">
                  {firstName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="truncate max-w-[110px]">{firstName}</span>
              {orderCount > 0 && (
                <span className="font-technical text-xs text-[#B8293D]">
                  ({orderCount})
                </span>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              disabled={authLoading || authBusy}
              className="inline-flex items-center gap-2.5 px-4 py-2 text-sm font-medium text-white bg-[#141518] rounded-lg hover:bg-[#272A31] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8293D]"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="w-4 h-4 shrink-0"
              >
                <path
                  fill="#FFFFFF"
                  d="M21.35 11.1H12v2.92h5.35c-.23 1.48-1.7 4.35-5.35 4.35-3.22 0-5.85-2.67-5.85-5.97s2.63-5.97 5.85-5.97c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.68 3.88 14.55 3 12 3 7.03 3 3 7.03 3 12s4.03 9 9 9c5.2 0 8.65-3.65 8.65-8.79 0-.59-.06-1.04-.14-1.48l-.16.37z"
                />
              </svg>
              <span>{authBusy ? 'Signing in...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
