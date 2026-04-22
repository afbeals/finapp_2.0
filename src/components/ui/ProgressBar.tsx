'use client';

import styled from 'styled-components';
import { colors, radius } from '@/styles/tokens';

const Track = styled.div`
  width: 100%;
  height: 8px;
  background: ${colors.border};
  border-radius: ${radius.full};
  overflow: hidden;
`;

const Fill = styled.div.withConfig({
  shouldForwardProp: (prop) => !['value', 'color'].includes(prop),
})<{ value: number; color?: string }>`
  height: 100%;
  width: ${({ value }) => Math.min(100, Math.max(0, value))}%;
  background: ${({ color }) => color ?? colors.primary};
  border-radius: ${radius.full};
  transition: width 300ms ease;
`;

interface ProgressBarProps {
  value: number; // 0–100
  color?: string;
  className?: string;
}

export function ProgressBar({ value, color, className }: ProgressBarProps) {
  return (
    <Track className={className}>
      <Fill value={value} color={color} />
    </Track>
  );
}
