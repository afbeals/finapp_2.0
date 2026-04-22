'use client';

import React from 'react';
import styled from 'styled-components';
import { colors, font } from '@/styles/tokens';

const Wrap = styled.div`
  padding: 24px 16px;
  text-align: center;
  color: ${colors.textMuted};
  font-style: italic;
  font-size: ${font.size.sm};
`;

interface EmptyStateProps {
  message: string;
  className?: string;
}

export function EmptyState({ message, className }: EmptyStateProps) {
  return <Wrap className={className}>{message}</Wrap>;
}
