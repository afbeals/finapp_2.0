'use client';

import React from 'react';
import { Wrap, CenteredWrap, Bar } from './LoadingState.styles';

interface LoadingStateProps {
  rows?: number;
  /** Render a centered spinner instead of skeleton bars */
  centered?: boolean;
  className?: string;
}

export function LoadingState({ rows = 4, centered, className }: LoadingStateProps) {
  if (centered) {
    return <CenteredWrap className={className}>Loading…</CenteredWrap>;
  }
  return (
    <Wrap className={className}>
      {Array.from({ length: rows }).map((_, i) => (
        <Bar key={i} w={i % 3 === 2 ? '60%' : i % 3 === 1 ? '80%' : '100%'} h={i === 0 ? 24 : 16} />
      ))}
    </Wrap>
  );
}
