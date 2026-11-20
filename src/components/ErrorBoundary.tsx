import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(error.message) as {
        error?: string;
        operationType?: string;
        path?: string;
      };
      if (parsed && typeof parsed === 'object' && parsed.error) {
        readable = `${parsed.error}${parsed.path ? ` (${parsed.operationType} on ${parsed.path})` : ''}`;
      }
    } catch {
      // Non-JSON error message
    }
    return { hasError: true, message: readable };
  }

  componentDidCatch(error: Error) {
    console.error('Application boundary caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F8FA] text-[#141518] flex items-center justify-center px-6 py-16">
          <div className="max-w-lg w-full bg-white border border-[#E3E5EA] rounded-xl p-8">
            <p className="text-xs font-medium tracking-wider text-[#B8293D] mb-2">
              Session Interrupted
            </p>
            <h1 className="font-editorial text-3xl font-medium tracking-tight mb-3">
              Unable to complete your request
            </h1>
            <p className="text-sm text-[#525560] leading-relaxed mb-6">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 text-sm font-medium bg-[#141518] text-white rounded-lg hover:bg-[#272A30] transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
