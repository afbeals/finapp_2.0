'use client';

import React from 'react';
import styled, { keyframes } from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, radius } = theme;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 24px 0;
`;

const CenteredWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  color: ${colors.textMuted};
  font-size: 14px;
`;

const Bar = styled.div.withConfig({ shouldForwardProp: (p) => !['w', 'h'].includes(p) })<{ w?: string; h?: number }>`
  height: ${({ h }) => h ?? 18}px;
  width: ${({ w }) => w ?? '100%'};
  background: ${colors.border};
  border-radius: ${radius.md};
  animation: ${pulse} 1.4s ease-in-out infinite;
`;

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
