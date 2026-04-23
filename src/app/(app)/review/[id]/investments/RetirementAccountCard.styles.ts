import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, spacing, radius, semanticColors } = theme;

export const Card = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  margin-bottom: ${spacing[2]};
  overflow: visible;
`;

export const CardHeaderBtn = styled.button.withConfig({
  shouldForwardProp: (p) => p !== 'expanded',
})<{ expanded: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${spacing[4]};
  padding: ${spacing[4]} ${spacing[5]};
  background: ${({ expanded }) => (expanded ? colors.primaryLight : colors.surface)};
  border: none;
  cursor: pointer;
  text-align: left;
  border-radius: ${({ expanded }) => (expanded ? `${radius.lg} ${radius.lg} 0 0` : radius.lg)};
  &:hover { background: ${colors.bg}; }
`;

export const Icon = styled.span`font-size: ${font.size['2xl']}; flex-shrink: 0;`;

export const TitleCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
`;

export const Name = styled.span`
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
`;

export const SubRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[2]};
  flex-wrap: wrap;
`;

export const TypeBadge = styled.span`
  font-size: ${font.size.xxs};
  font-weight: ${font.weight.semibold};
  color: ${semanticColors.successTextMedium};
  background: ${semanticColors.successBg};
  padding: 2px 8px;
  border-radius: ${radius.full};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const SubText = styled.span`font-size: ${font.size.xs}; color: ${colors.textMuted};`;

export const OwnerChip = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'chipColor' })<{ chipColor: string }>`
  font-size: ${font.size.xxs};
  font-weight: ${font.weight.medium};
  color: ${({ chipColor }) => chipColor};
  background: ${({ chipColor }) => chipColor + '22'};
  padding: 2px 8px;
  border-radius: ${radius.full};
`;

export const Meta = styled.div`display: flex; align-items: center; gap: ${spacing[5]};`;
export const MetaItem = styled.div`display: flex; flex-direction: column; align-items: flex-end; gap: 2px;`;
export const MetaLabel = styled.span`font-size: ${font.size.xs}; color: ${colors.textMuted};`;
export const MetaValue = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'textColor' })<{ textColor?: string }>`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${({ textColor }) => textColor ?? colors.textPrimary};
`;

export const Chevron = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'open' })<{ open: boolean }>`
  font-size: ${font.size.sm};
  color: ${colors.textMuted};
  transform: ${({ open }) => (open ? 'rotate(90deg)' : 'rotate(0deg)')};
  transition: transform 180ms ease;
  flex-shrink: 0;
  margin-left: ${spacing[2]};
`;

export const Panel = styled.div`border-top: 1px solid ${colors.border}; background: ${colors.bg};`;

export const KpiRow = styled.div`
  display: flex; gap: ${spacing[3]}; padding: 14px ${spacing[5]}; flex-wrap: wrap;
`;

export const Kpi = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  padding: 10px 14px;
  min-width: 140px;
  flex: 1;
`;

export const KpiLabel = styled.p`
  font-size: ${font.size.xxs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
`;

export const KpiValue = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'textColor' })<{ textColor?: string }>`
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${({ textColor }) => textColor ?? colors.textPrimary};
`;

export const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${spacing[2]};
  padding: ${spacing[3]} ${spacing[5]};
  border-top: 1px dashed ${colors.border};
`;

export const ActionBtn = styled.button.withConfig({ shouldForwardProp: (p) => p !== 'tone' })<{ tone?: 'danger' | 'primary' }>`
  border: none;
  background: transparent;
  color: ${({ tone }) => (tone === 'danger' ? colors.danger : colors.primary)};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  cursor: pointer;
  padding: 6px 10px;
  border-radius: ${radius.sm};
  &:hover { background: ${({ tone }) => (tone === 'danger' ? '#fee2e2' : colors.primaryLight)}; }
`;

export const HistoryTable = styled.table`width: 100%; border-collapse: collapse;`;
export const Thead = styled.thead`background: ${colors.bg};`;
export const Th = styled.th`
  padding: 8px ${spacing[4]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-align: center;
  border-bottom: 1px solid ${colors.border};
  &:first-child { text-align: left; }
`;
export const Tr = styled.tr.withConfig({ shouldForwardProp: (p) => p !== 'isCurrentMonth' })<{ isCurrentMonth: boolean }>`
  background: ${({ isCurrentMonth }) => (isCurrentMonth ? colors.primaryLight : colors.surface)};
  &:nth-child(even) { background: ${({ isCurrentMonth }) => (isCurrentMonth ? colors.primaryLight : colors.bg)}; }
  &:last-child td { border-bottom: none; }
`;
export const Td = styled.td.withConfig({ shouldForwardProp: (p) => p !== 'bold' })<{ bold?: boolean }>`
  padding: 10px ${spacing[4]};
  font-size: ${font.size.sm};
  color: ${colors.textPrimary};
  border-bottom: 1px solid ${colors.border};
  text-align: center;
  font-weight: ${({ bold }) => (bold ? font.weight.semibold : font.weight.normal)};
  &:first-child { text-align: left; font-weight: ${font.weight.medium}; }
`;
export const EmptyTd = styled(Td)`
  text-align: center;
  color: ${colors.textMuted};
  font-style: italic;
`;
export const GrowthSpan = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'positive' })<{ positive: boolean }>`
  color: ${({ positive }) => (positive ? colors.success : colors.danger)};
  font-weight: ${font.weight.medium};
`;
export const CurrentDot = styled.span`
  margin-left: 6px;
  font-size: ${font.size.xs};
  color: ${colors.primary};
  font-weight: ${font.weight.semibold};
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
