import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, spacing, radius, semanticColors, transition } = theme;

export const AccountRow = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  margin-bottom: ${spacing[2]};
  overflow: visible;
`;

// Wraps AccountRowHeader (a <button>) alongside the delete button so neither
// is nested inside the other — nested <button> elements are invalid HTML.
export const HeaderRow = styled.div`
  display: flex;
  align-items: stretch;
`;

export const AccountRowHeader = styled.button.withConfig({
  shouldForwardProp: (p) => p !== 'expanded',
})<{ expanded: boolean }>`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: ${spacing[4]};
  padding: ${spacing[4]} ${spacing[5]};
  background: ${({ expanded }) => expanded ? colors.primaryLight : colors.surface};
  border: none;
  cursor: pointer;
  text-align: left;
  border-radius: ${({ expanded }) => expanded ? `${radius.lg} 0 0 0` : `${radius.lg} 0 0 ${radius.lg}`};
  transition: background ${transition.quick};
  &:hover { background: ${colors.primaryLight}; }
`;

export const DeleteBtn = styled.button.withConfig({
  shouldForwardProp: (p) => p !== 'expanded',
})<{ expanded: boolean }>`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 ${spacing[4]};
  background: ${({ expanded }) => expanded ? colors.primaryLight : colors.surface};
  border: none;
  cursor: pointer;
  font-size: 13px;
  opacity: 0.6;
  border-radius: ${({ expanded }) => expanded ? `0 ${radius.lg} 0 0` : `0 ${radius.lg} ${radius.lg} 0`};
  transition: background ${transition.quick};
  &:hover { opacity: 1; background: ${colors.primaryLight}; }
`;

export const AccountIcon = styled.span`font-size: ${font.size['2xl']}; flex-shrink: 0;`;

export const AccountName = styled.span`
  flex: 1;
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
  text-align: left;
`;

export const AccountMeta = styled.div`display: flex; align-items: center; gap: ${spacing[5]};`;

export const MetaItem = styled.div`display: flex; flex-direction: column; align-items: flex-end; gap: 2px;`;

export const MetaLabel = styled.span`font-size: ${font.size.xs}; color: ${colors.textMuted};`;

export const MetaValue = styled.span.withConfig({
  shouldForwardProp: (p) => p !== 'textColor',
})<{ textColor?: string }>`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${({ textColor }) => textColor ?? colors.textPrimary};
`;

export const ChevronIcon = styled.span.withConfig({
  shouldForwardProp: (p) => p !== 'open',
})<{ open: boolean }>`
  font-size: ${font.size.sm};
  color: ${colors.textMuted};
  transform: ${({ open }) => open ? 'rotate(90deg)' : 'rotate(0deg)'};
  transition: transform ${transition.moderate};
  flex-shrink: 0;
  margin-left: ${spacing[2]};
`;

export const ExpandedPanel = styled.div`border-top: 1px solid ${colors.border}; background: ${colors.surface};`;

export const EditingBadge = styled.span`
  font-size: ${font.size.xs}; font-weight: ${font.weight.medium};
  padding: 2px 8px; border-radius: ${radius.full};
  background: ${colors.primaryLight}; color: ${semanticColors.primaryTextDark}; border: 1px solid ${colors.primary};
  margin-left: ${spacing[2]};
`;

export const SnapKpiRow = styled.div`
  display: flex; gap: ${spacing[3]}; padding: 14px ${spacing[5]}; flex-wrap: wrap;
`;

export const SnapKpi = styled.div`
  background: ${colors.surface}; border: 1px solid ${colors.border};
  border-radius: ${radius.md}; padding: 10px 14px; min-width: 120px; flex: 1;
`;

export const SnapKpiLabel = styled.p`
  font-size: ${font.size.xxs}; font-weight: ${font.weight.semibold}; color: ${colors.textMuted};
  text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;
`;

export const SnapKpiValue = styled.div.withConfig({
  shouldForwardProp: (p) => p !== 'textColor',
})<{ textColor?: string }>`
  font-size: ${font.size.lg}; font-weight: ${font.weight.bold};
  color: ${({ textColor }) => textColor ?? colors.textPrimary};
`;

export const HistoryTable = styled.table`width: 100%; border-collapse: collapse;`;
export const HistoryThead = styled.thead`background: ${semanticColors.surfaceMuted};`;
export const HistoryTh = styled.th`
  padding: 8px ${spacing[4]}; font-size: ${font.size.xs}; font-weight: ${font.weight.semibold};
  color: ${colors.textMuted}; text-align: center; border-bottom: 1px solid ${colors.border};
  &:first-child { text-align: left; }
`;
export const HistoryTr = styled.tr.withConfig({
  shouldForwardProp: (p) => p !== 'isCurrentMonth',
})<{ isCurrentMonth: boolean }>`
  background: ${({ isCurrentMonth }) => isCurrentMonth ? colors.primaryLight : colors.surface};
  &:nth-child(even) { background: ${({ isCurrentMonth }) => isCurrentMonth ? colors.primaryLight : semanticColors.surfaceMuted}; }
  &:last-child td { border-bottom: none; }
`;
export const HistoryTd = styled.td.withConfig({ shouldForwardProp: (p) => p !== 'bold' })<{ bold?: boolean }>`
  padding: 10px ${spacing[4]}; font-size: ${font.size.sm}; color: ${colors.textPrimary};
  border-bottom: 1px solid ${colors.border}; text-align: center;
  font-weight: ${({ bold }) => bold ? font.weight.semibold : font.weight.normal};
  &:first-child { text-align: left; font-weight: ${font.weight.medium}; }
`;

export const GoalPercent = styled.span`
  margin-left: 8px;
  color: ${colors.primary};
  font-weight: ${font.weight.semibold};
`;

export const CurrentDot = styled.span`
  margin-left: 6px;
  font-size: ${font.size.xs};
  color: ${colors.primary};
  font-weight: ${font.weight.semibold};
`;

export const MutedDash = styled.span`color: ${colors.textMuted};`;

export const EmptyTd = styled(HistoryTd)`
  text-align: center;
  color: ${colors.textMuted};
  font-style: italic;
`;

export const DepositSpan = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'zero' })<{ zero: boolean }>`
  color: ${({ zero }) => zero ? colors.textMuted : colors.textPrimary};
`;

export const GrowthSpan = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'positive' })<{ positive: boolean }>`
  color: ${({ positive }) => positive ? colors.success : colors.danger};
  font-weight: ${font.weight.medium};
`;

export const AddRowBtn = styled.button`
  width: 100%; padding: 9px ${spacing[4]};
  border: none; border-top: 1px dashed ${colors.border};
  background: transparent; color: ${colors.primary};
  font-size: ${font.size.sm}; font-weight: ${font.weight.medium};
  cursor: pointer; text-align: left;
  display: flex; align-items: center; gap: 6px;
  &:hover { background: ${colors.primaryLight}; }
`;
