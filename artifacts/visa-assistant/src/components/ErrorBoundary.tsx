import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportClientError } from '@/lib/reportClientError';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Keeps a render crash from leaving the visitor on a blank white screen. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
    reportClientError(error, { kind: 'react', component: (info.componentStack || '').slice(0, 400) });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="min-h-dvh flex items-center justify-center bg-[#f4f6f9] px-5"
        style={{
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          paddingTop: 'max(20px, env(safe-area-inset-top))',
        }}
      >
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-7 text-center">
          <h1 className="text-[18px] font-semibold text-slate-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
            The page could not be displayed. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 min-h-[48px] w-full rounded-xl bg-[#ff3c00] text-[15px] font-semibold text-white"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
