import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Dealmint crashed:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-3">Something went wrong</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            An unexpected error stopped this page from loading. Reloading usually fixes it.
          </p>
          <button
            onClick={() => window.location.assign('/')}
            className="btn-primary"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }
}
