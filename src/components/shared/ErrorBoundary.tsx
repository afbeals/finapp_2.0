'use client';

import React from 'react';
import { Wrap, Title, Sub, RetryBtn } from './ErrorBoundary.styles';
import { ApiError } from '@/lib/api';

interface ErrorBoundaryState { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  retry = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const { error } = this.state;
    const isApiError = error instanceof ApiError;
    const msg = isApiError
      ? `${error.message} (HTTP ${error.status})`
      : (error?.message ?? 'Unknown error');

    return (
      <Wrap>
        <Title>Something went wrong</Title>
        <Sub>{msg}</Sub>
        <RetryBtn onClick={this.retry}>↺ Try again</RetryBtn>
      </Wrap>
    );
  }
}
