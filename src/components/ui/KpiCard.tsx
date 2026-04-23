'use client';

import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, radius, shadow, spacing } = theme;

export const KpiCard = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: ${spacing[4]} ${spacing[5]};
  box-shadow: ${shadow.sm};
  display: flex;
  align-items: flex-start;
  gap: 14px;
`;

export const KpiIcon = styled.span`font-size: 26px; flex-shrink: 0; margin-top: 2px;`;

export const KpiBody = styled.div`flex: 1;`;

export const KpiLabel = styled.p`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 3px;
`;

export const KpiValue = styled.p.withConfig({ shouldForwardProp: (p) => p !== 'tc' })<{ tc?: string }>`
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.bold};
  color: ${({ tc }) => tc ?? colors.textPrimary};
  line-height: 1;
  margin-bottom: 4px;
`;

export const KpiSub = styled.p`font-size: ${font.size.xs}; color: ${colors.textMuted};`;
