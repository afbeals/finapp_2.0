'use client';

import styled from 'styled-components';
import { colors, font, semanticColors } from '@/styles/tokens';

// ─── Scroll wrapper ───────────────────────────────────────────────────────────

export const TableScroll = styled.div`
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: ${colors.border} transparent;
  &::-webkit-scrollbar { height: 6px; }
  &::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 3px; }
`;

// ─── Table ─────────────────────────────────────────────────────────────────────

export const DTable = styled.table.withConfig({ shouldForwardProp: (p) => p !== 'maxContent' })<{ maxContent?: boolean }>`
  width: ${({ maxContent }) => maxContent ? 'max-content' : '100%'};
  min-width: 100%;
  border-collapse: collapse;
  font-size: ${font.size.sm};
`;

export const DThead = styled.thead`
  background: ${colors.bg};
  position: sticky;
  top: 0;
  z-index: 1;
`;

export const DTh = styled.th.withConfig({
  shouldForwardProp: (p) => !['right', 'center', 'w', 'stickyLeft'].includes(p),
})<{ right?: boolean; center?: boolean; w?: number; stickyLeft?: boolean }>`
  padding: 7px 10px;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-align: ${({ right, center }) => right ? 'right' : center ? 'center' : 'left'};
  border-bottom: 1px solid ${colors.border};
  white-space: nowrap;
  ${({ w }) => w ? `width: ${w}px; min-width: ${w}px;` : ''}
  ${({ stickyLeft }) => stickyLeft ? `position: sticky; left: 0; background: ${colors.bg}; z-index: 2;` : ''}
`;

export const DTr = styled.tr.withConfig({
  shouldForwardProp: (p) => !['highlight', 'isTotal', 'dimmed', 'isCurrent'].includes(p),
})<{ highlight?: boolean; isTotal?: boolean; dimmed?: boolean; isCurrent?: boolean }>`
  background: ${({ isTotal, highlight, isCurrent }) =>
    isTotal ? semanticColors.purpleLight : isCurrent ? colors.primaryLight : highlight ? colors.dangerLight : colors.surface};
  font-weight: ${({ isCurrent, isTotal }) => (isCurrent || isTotal) ? 600 : 'normal'};
  opacity: ${({ dimmed }) => dimmed ? 0.55 : 1};
  border-left: ${({ highlight }) => highlight ? `3px solid ${colors.danger}` : '3px solid transparent'};
  &:not(:last-child) td { border-bottom: 1px solid ${colors.border}; }
  &:nth-child(even) { background: ${({ isTotal, highlight, isCurrent }) =>
    isTotal ? semanticColors.purpleLight : isCurrent ? colors.primaryLight : highlight ? colors.dangerLight : colors.bg}; }
  &:hover td { filter: brightness(0.98); }
`;

export const DTd = styled.td.withConfig({
  shouldForwardProp: (p) => !['right', 'center', 'bold', 'muted', 'stickyLeft'].includes(p),
})<{ right?: boolean; center?: boolean; bold?: boolean; muted?: boolean; stickyLeft?: boolean }>`
  padding: 9px 10px;
  font-size: ${font.size.sm};
  text-align: ${({ right, center }) => right ? 'right' : center ? 'center' : 'left'};
  font-weight: ${({ bold }) => bold ? font.weight.semibold : font.weight.normal};
  color: ${({ muted }) => muted ? colors.textMuted : colors.textPrimary};
  white-space: nowrap;
  vertical-align: middle;
  ${({ stickyLeft }) => stickyLeft ? 'position: sticky; left: 0; background: inherit; z-index: 1;' : ''}
`;
