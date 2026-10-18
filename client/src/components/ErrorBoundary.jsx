import { Component } from 'react';
import { Logo } from './ui';
export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-5 p-6 text-center">
          <Logo />
          <h1 className="text-2xl font-semibold">Let’s try that again.</h1>
          <p className="max-w-sm text-sm text-muted">
            The page could not be displayed. Your saved workspace data is still available.
          </p>
          <button className="btn btn-primary" onClick={() => window.location.assign('/dashboard')}>
            Reload workspace
          </button>
        </div>
      );
    return this.props.children;
  }
}