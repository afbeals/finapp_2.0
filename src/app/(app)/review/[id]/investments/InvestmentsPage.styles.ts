import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, semanticColors, font, spacing, radius } = theme;

export const SplitBarWrap = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: 14px 16px;
  margin-bottom: ${spacing[5]};
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
`;

export const SplitBar = styled.div`
  display: flex;
  height: 14px;
  border-radius: 7px;
  overflow: hidden;
  margin: 8px 0 6px;
`;

export const SplitSegment = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'pct' && p !== 'bg' })<{ pct: number; bg: string }>`
  width: ${({ pct }) => pct}%;
  background: ${({ bg }) => bg};
  transition: width 0.4s ease;
`;

export const SplitLegend = styled.div`
  display: flex;
  gap: 20px;
  font-size: 11px;
  color: ${colors.textMuted};
`;

export const LegendDot = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'bg' })<{ bg: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  &::before { content: ''; display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${({ bg }) => bg}; }
`;

export const MarketStrip = styled.div`
  background: ${colors.navbar};
  border-radius: ${radius.lg};
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  gap: 16px;
  margin-bottom: ${spacing[5]};
  flex-wrap: wrap;
`;

export const MarketTag = styled.span`
  font-size: 10px;
  color: ${colors.textDisabled};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-right: 4px;
`;

export const MarketItem = styled.div`display: flex; flex-direction: column; gap: 1px;`;
export const MarketName = styled.span`font-size: 10px; color: ${colors.textDisabled}; text-transform: uppercase; letter-spacing: 0.04em;`;
export const MarketVal = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'up' })<{ up?: boolean }>`
  font-size: ${font.size.sm};
  font-weight: 600;
  color: ${({ up }) => up === undefined ? colors.bg : up ? semanticColors.successBright : semanticColors.dangerBright};
`;
