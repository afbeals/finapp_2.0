'use client';

import styled, { css } from 'styled-components';
import { colors, font, radius, shadow, spacing } from '@/styles/tokens';

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
        border-color: ${colors.borderStrong};
      }
    `
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing[4]};
`;

export const CardTitle = styled.h3`
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  color: ${colors.textPrimary};
`;

export const CardSubtitle = styled.p`
  font-size: ${font.size.sm};
  color: ${colors.textMuted};
  margin-top: 2px;
`;

// ─── Panel card: surface card with a divided header, used in review pages ────

export const PanelCard = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
`;

export const PanelHead = styled.div`
  padding: 14px 18px 10px;
  border-bottom: 1px solid ${colors.border};
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${spacing[3]};
`;

export const PanelTitle = styled.h2`
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
`;

export const PanelSubtitle = styled.p`
  font-size: ${font.size.xs};
  color: ${colors.textMuted};
`;

export const PanelBody = styled.div`
  padding: 16px 18px;
`;
