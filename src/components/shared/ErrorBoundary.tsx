'use client';

import React from 'react';
import styled from 'styled-components';
import { colors, font, radius, spacing, semanticColors } from '@/styles/tokens';
import { ApiError } from '@/lib/api';

const Wrap = styled.div`
  padding: ${spacing[8]};
  text-align: center;
  background: ${colors.dangerLight};
  border: 1px solid ${semanticColors.dangerBorder};
  border-radius: ${radius.lg};
  margin: ${spacing[4]} 0;
`;

const Title = styled.p`
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${semanticColors.dangerTextDark};
  margin-bottom: ${spacing[2]};
`;

const Sub = styled.p`
  font-size: ${font.size.sm};
  color: ${semanticColors.dangerText};
  margin-bottom: ${spacing[4]};
`;

const RetryBtn = styled.button`
  padding: 7px 18px;
  background: ${colors.surface};
  border: 1px solid ${semanticColors.dangerBorder};
  border-radius: ${radius.md};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${semanticColors.dangerTextDark};
  cursor: pointer;
  &:hover { background: ${colors.dangerLight}; }
`;

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
