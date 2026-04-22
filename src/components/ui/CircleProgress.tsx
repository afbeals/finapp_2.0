'use client';

import React from 'react';
import styled from 'styled-components';
import { colors, font } from '@/styles/tokens';

const Wrap = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'size' })<{ size: number }>`
  position: relative;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  flex-shrink: 0;
`;

const Svg = styled.svg`transform: rotate(-90deg);`;

const Label = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${font.size.micro};
  font-weight: ${font.weight.bold};
  color: ${colors.success};
`;

interface CircleProgressProps {
  value: number;
  color?: string;
  size?: number;
  label?: string;
}

export function CircleProgress({ value, color = colors.success, size = 52, label }: CircleProgressProps) {
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = Math.min(100, value) / 100 * circumference;

  return (
    <Wrap size={size}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.border} strokeWidth="5" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </Svg>
      {label && <Label style={{ color }}>{label}</Label>}
    </Wrap>
  );
}
