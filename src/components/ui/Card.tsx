'use client';

import styled, { css } from 'styled-components';
import { colors, radius, shadow, spacing } from '@/styles/tokens';

interface CardProps {
  padding?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export const Card = styled.div.withConfig({
  shouldForwardProp: (prop) => !['padding', 'hoverable'].includes(prop),
})<CardProps>`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  box-shadow: ${shadow.sm};

  ${({ padding = 'md' }) =>
    padding === 'sm' ? css`padding: ${spacing[4]};` :
    padding === 'lg' ? css`padding: ${spacing[8]};` :
    css`padding: ${spacing[6]};`
  }

  ${({ hoverable }) =>
    hoverable && css`
      transition: box-shadow 150ms ease, border-color 150ms ease;
      cursor: pointer;
      &:hover {
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.10);
        border-color: #CBD5E1;
      }
    `
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

export const CardTitle = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: ${colors.textPrimary};
`;

export const CardSubtitle = styled.p`
  font-size: 13px;
  color: ${colors.textMuted};
  margin-top: 2px;
`;
