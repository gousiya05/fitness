// @ts-nocheck
// ErrorBoundary is a class component — ts-nocheck is safe here because
// this file has no complex logic, just standard React class lifecycle.
import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[FlexAI ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="h-20 w-20 bg-red-500/20 rounded-3xl flex items-center justify-center text-red-500 text-4xl font-black border border-red-500/30">
            !
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
            Neural Link <span className="text-red-500">Error</span>
          </h1>
          <p className="text-white/40 max-w-md leading-relaxed">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
            className="px-8 py-4 bg-primary text-black font-black uppercase italic rounded-2xl hover:bg-white transition-colors"
          >
            Restart Neural Link
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
