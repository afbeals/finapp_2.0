import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, radius, semanticColors } = theme;

export const ScrollBody = styled.div`overflow-y: auto; max-height: calc(80vh - 120px);`;

export const AmorTable = styled.table`width: 100%; border-collapse: collapse; font-size: ${font.size.xs};`;

export const AmorTh = styled.th`
  padding: 7px 10px;
  text-align: right;
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  border-bottom: 1px solid ${colors.border};
  background: ${colors.bg};
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
  &:first-child { text-align: center; }
`;

export const AmorTr = styled.tr.withConfig({ shouldForwardProp: (p) => p !== 'isCurrent' })<{ isCurrent: boolean }>`
  background: ${({ isCurrent }) => isCurrent ? colors.primaryLight : 'transparent'};
  font-weight: ${({ isCurrent }) => isCurrent ? font.weight.semibold : font.weight.normal};
  &:nth-child(even) { background: ${({ isCurrent }) => isCurrent ? colors.primaryLight : semanticColors.surfaceMuted}; }
  &:last-child td { border-bottom: none; }
`;

export const AmorTd = styled.td`
  padding: 7px 10px;
  text-align: right;
  border-bottom: 1px solid ${colors.border};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  &:first-child { text-align: center; }
`;

export const ProgressChip = styled.span`
  font-size: ${font.size.xs};
  background: ${colors.successLight};
  color: ${semanticColors.successTextDark};
  padding: 3px 10px;
  border-radius: ${radius.full};
  font-weight: ${font.weight.semibold};
  margin-top: 6px;
  display: inline-block;
`;
