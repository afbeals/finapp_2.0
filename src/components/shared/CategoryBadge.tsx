'use client';

import React from 'react';
import styled from 'styled-components';
import { font, radius } from '@/styles/tokens';

const Chip = styled.span.withConfig({ shouldForwardProp: (p) => !['bg', 'fg'].includes(p) })<{ bg: string; fg: string }>`
  display: inline-block;
  padding: 2px 8px;
  border-radius: ${radius.full};
  font-size: ${font.size.xs};
  font-weight: 600;
  background: ${({ bg }) => bg};
  color: ${({ fg }) => fg};
  white-space: nowrap;
`;

interface CategoryBadgeProps {
  /** Any hex color — badge bg will be color + 22 (13% alpha) */
  color: string;
  label: string;
  className?: string;
}

/** Derives background as `color + '22'` and foreground as the color itself. */
export function CategoryBadge({ color, label, className }: CategoryBadgeProps) {
  const bg = color.startsWith('#') ? `${color}22` : color;
  return (
    <Chip bg={bg} fg={color} className={className}>
      {label}
    </Chip>
  );
}
