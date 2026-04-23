import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, semanticColors, font, spacing, radius } = theme;

export const CatTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

export const CatTh = styled.th`
  padding: 8px ${spacing[4]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-align: left;
  border-bottom: 1px solid ${colors.border};
  background: ${colors.bg};
  &:not(:first-child) { text-align: right; }
`;

export const CatTd = styled.td`
  padding: 10px ${spacing[4]};
  font-size: ${font.size.sm};
  color: ${colors.textPrimary};
  border-bottom: 1px solid ${colors.border};
  &:not(:first-child) { text-align: right; font-variant-numeric: tabular-nums; }
`;

export const CatHeaderRow = styled.tr.withConfig({
  shouldForwardProp: (p) => p !== 'rowBg',
})<{ rowBg: string }>`
  background: ${({ rowBg }) => rowBg};
  cursor: pointer;
  &:hover { filter: brightness(0.97); }
`;

export const CatNameCell = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const CatColorBar = styled.span.withConfig({
  shouldForwardProp: (p) => p !== 'barColor',
})<{ barColor: string }>`
  display: inline-block;
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: ${({ barColor }) => barColor};
  flex-shrink: 0;
`;

export const CatChevron = styled.span.withConfig({
  shouldForwardProp: (p) => p !== 'open',
})<{ open: boolean }>`
  font-size: 10px;
  color: ${colors.textMuted};
  transform: ${({ open }) => open ? 'rotate(90deg)' : 'rotate(0deg)'};
  transition: transform 150ms ease;
  margin-left: 4px;
`;

export const LineItemRow = styled.tr`
  background: ${colors.bg};
  &:hover { background: ${colors.bg}; }
`;

export const LineItemTd = styled.td`
  padding: 7px ${spacing[4]} 7px ${spacing[12]};
  font-size: ${font.size.xs};
  color: ${colors.textMuted};
  border-bottom: 1px solid ${colors.border};
  &:not(:first-child) { text-align: right; padding-left: ${spacing[4]}; }
`;

export const TrendBadge = styled.span.withConfig({
  shouldForwardProp: (p) => p !== 'dir',
})<{ dir: 'up' | 'down' | 'stable' }>`
  display: inline-block;
  font-size: 10px;
  font-weight: ${font.weight.medium};
  padding: 1px 6px;
  border-radius: ${radius.full};
  margin-left: 6px;
  vertical-align: middle;
  background: ${({ dir }) => dir === 'up' ? colors.dangerLight : dir === 'down' ? semanticColors.successBg : colors.bg};
  color: ${({ dir }) => dir === 'up' ? colors.danger : dir === 'down' ? colors.success : colors.textMuted};
  border: 1px solid ${({ dir }) => dir === 'up' ? semanticColors.dangerBorder : dir === 'down' ? semanticColors.successLightBorder : colors.border};
`;

export const SummaryTr = styled.tr.withConfig({
  shouldForwardProp: (p) => !['bg', 'textColor'].includes(p),
})<{ bg: string; textColor: string }>`
  background: ${({ bg }) => bg};
  td { color: ${({ textColor }) => textColor}; font-weight: ${font.weight.bold}; }
`;
