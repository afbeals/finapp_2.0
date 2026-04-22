'use client';

import styled, { css } from 'styled-components';
import { colors, radius, font, spacing, semanticColors } from '@/styles/tokens';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'quarterly';

interface BadgeProps {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, ReturnType<typeof css>> = {
  default: css`background: ${colors.bg}; color: ${colors.textSecondary};`,
  success: css`background: ${colors.successLight}; color: ${semanticColors.successText};`,
  warning: css`background: ${colors.warningLight}; color: ${semanticColors.warningText};`,
  danger: css`background: ${colors.dangerLight}; color: ${semanticColors.dangerText};`,
  primary: css`background: ${colors.primaryLight}; color: ${semanticColors.primaryText};`,
  quarterly: css`background: ${colors.warningLight}; color: ${semanticColors.warningText};`,
};

export const Badge = styled.span<BadgeProps>`
  display: inline-flex;
  align-items: center;
  gap: ${spacing[1]};
  padding: 2px 8px;
  border-radius: ${radius.full};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  white-space: nowrap;

  ${({ variant = 'default' }) => variantStyles[variant]}
`;
