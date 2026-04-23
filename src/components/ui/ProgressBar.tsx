'use client';

import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, radius } = theme;

const Track = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'height',
})<{ height?: number }>`
  width: 100%;
  height: ${({ height }) => height ?? 8}px;
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
  height?: number; // px, default 8
  className?: string;
}

export function ProgressBar({ value, color, height, className }: ProgressBarProps) {
  return (
    <Track height={height} className={className}>
      <Fill value={value} color={color} />
    </Track>
  );
}
