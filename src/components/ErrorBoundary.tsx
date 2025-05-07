'use client';
import React from 'react';

export class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    // You can log to an error reporting service here
    console.error('[PantyPost] Uncaught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-8 text-red-500">Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}
