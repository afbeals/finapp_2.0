'use client';

import styled, { css } from 'styled-components';
import { colors, font, radius, transition, semanticColors } from '@/styles/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
}

const sizeStyles = {
  sm: css`
    padding: 6px 12px;
    font-size: ${font.size.sm};
    height: 32px;
  `,
  md: css`
    padding: 8px 16px;
    font-size: ${font.size.base};
    height: 38px;
  `,
  lg: css`
    padding: 10px 20px;
    font-size: ${font.size.md};
    height: 44px;
  `,
};

const variantStyles = {
  primary: css`
    background: ${colors.primary};
    color: ${colors.surface};
    border: 1px solid ${colors.primary};

    &:hover:not(:disabled) {
      background: ${colors.primaryHover};
      border-color: ${colors.primaryHover};
    }
  `,
  secondary: css`
    background: ${colors.surface};
    color: ${colors.textPrimary};
    border: 1px solid ${colors.border};

    &:hover:not(:disabled) {
      background: ${colors.bg};
      border-color: ${colors.borderStrong};
    }
  `,
  ghost: css`
    background: transparent;
    color: ${colors.textSecondary};
    border: 1px solid transparent;

    &:hover:not(:disabled) {
      background: ${colors.bg};
      color: ${colors.textPrimary};
    }
  `,
  danger: css`
    background: ${colors.danger};
    color: ${colors.surface};
    border: 1px solid ${colors.danger};

    &:hover:not(:disabled) {
      background: ${semanticColors.dangerHover};
      border-color: ${semanticColors.dangerHover};
    }
  `,
};

export const Button = styled.button.withConfig({
  shouldForwardProp: (prop) => !['fullWidth', 'loading'].includes(prop),
})<ButtonProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: ${radius.md};
  font-weight: ${font.weight.medium};
  white-space: nowrap;
  transition: background ${transition.fast}, border-color ${transition.fast}, color ${transition.fast};
  outline: none;
  text-decoration: none;

  ${({ size = 'md' }) => sizeStyles[size]}
  ${({ variant = 'primary' }) => variantStyles[variant]}
  ${({ fullWidth }) => fullWidth && css`width: 100%;`}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${colors.primaryLight};
  }
`;
