import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent third-party browser extensions (e.g. chrome-extension://) from
// disrupting the app when they attempt to overwrite read-only window globals.
window.addEventListener(
  'error',
  (event) => {
    const src = event.filename || '';
    const stack =
      event.error instanceof Error && typeof event.error.stack === 'string'
        ? event.error.stack
        : '';
    if (src.startsWith('chrome-extension://') || stack.includes('chrome-extension://')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },
  true
);

interface ErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white p-6 text-center">
          <div className="max-w-md space-y-3">
            <h1 className="text-xl font-bold text-zinc-950">Something went wrong</h1>
            <p className="text-sm text-zinc-600">
              Please reload the page to restore the SHA.AVEN storefront.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold cursor-pointer"
            >
              Reload Storefront
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
