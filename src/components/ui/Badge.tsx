'use client';

import styled, { css } from 'styled-components';
import { colors, radius, font } from '@/styles/tokens';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'quarterly';

interface BadgeProps {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, ReturnType<typeof css>> = {
  default: css`background: #F1F5F9; color: ${colors.textSecondary};`,
  success: css`background: ${colors.successLight}; color: #15803D;`,
  warning: css`background: ${colors.warningLight}; color: #B45309;`,
  danger: css`background: ${colors.dangerLight}; color: #B91C1C;`,
  primary: css`background: ${colors.primaryLight}; color: #1D4ED8;`,
  quarterly: css`background: ${colors.warningLight}; color: #B45309;`,
};

export const Badge = styled.span<BadgeProps>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: ${radius.full};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  white-space: nowrap;

  ${({ variant = 'default' }) => variantStyles[variant]}
`;
