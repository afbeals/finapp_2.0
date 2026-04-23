import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, spacing, radius, semanticColors } = theme;

export const TableScroll = styled.div`
  overflow-x: auto;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  margin-bottom: ${spacing[5]};
  scrollbar-width: thin;
  scrollbar-color: ${colors.border} transparent;
  &::-webkit-scrollbar { height: 6px; }
  &::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 3px; }
`;
export const Table = styled.table`width: max-content; min-width: 100%; border-collapse: collapse;`;
export const Thead = styled.thead`background: ${colors.bg}; position: sticky; top: 0; z-index: 1;`;
export const Th = styled.th.withConfig({ shouldForwardProp: (p) => p !== 'w' })<{ w?: number }>`
  padding: ${spacing[2]} ${spacing[3]};
  font-size: ${font.size.xs}; font-weight: ${font.weight.semibold};
  color: ${colors.textMuted}; text-align: right;
  border-bottom: 1px solid ${colors.border}; white-space: nowrap;
  ${({ w }) => w ? `width: ${w}px; min-width: ${w}px;` : ''}
  &:first-child { text-align: left; position: sticky; left: 0; background: ${colors.bg}; z-index: 2; }
`;
export const Tr = styled.tr.withConfig({
  shouldForwardProp: (p) => !['highlight', 'isTotal', 'paidOff'].includes(p),
})<{ highlight?: boolean; isTotal?: boolean; paidOff?: boolean }>`
  background: ${({ isTotal, highlight, paidOff }) =>
    isTotal ? semanticColors.purpleLight : paidOff ? colors.successLight : highlight ? colors.dangerLight : colors.surface};
  border-left: ${({ highlight, paidOff }) =>
    paidOff ? `3px solid ${colors.success}` : highlight ? `3px solid ${colors.danger}` : '3px solid transparent'};
  &:not(:last-child) td { border-bottom: 1px solid ${colors.border}; }
  &:nth-child(even) { background: ${({ isTotal, highlight, paidOff }) =>
    isTotal ? semanticColors.purpleLight : paidOff ? colors.successLight : highlight ? colors.dangerLight : colors.bg}; }
`;
export const Td = styled.td.withConfig({
  shouldForwardProp: (p) => !['right', 'muted', 'danger', 'success', 'purple', 'bold'].includes(p),
})<{ muted?: boolean; danger?: boolean; success?: boolean; purple?: boolean; bold?: boolean }>`
  padding: 10px 12px; font-size: ${font.size.sm};
  color: ${({ danger, success, purple, muted }) =>
    danger ? colors.danger :
    success ? colors.success :
    purple ? semanticColors.purpleTextDark :
    muted ? colors.textMuted :
    colors.textPrimary};
  font-weight: ${({ bold }) => bold ? font.weight.bold : font.weight.normal};
  text-align: right; white-space: nowrap; vertical-align: middle;
  &:first-child { text-align: left; position: sticky; left: 0; background: inherit; z-index: 1; }
`;
export const ExtraPayTd = styled(Td).withConfig({ shouldForwardProp: (p) => p !== 'active' })<{ active?: boolean }>`
  background: ${({ active }) => active ? colors.warningLight : 'transparent'};
`;
export const PaidOffBtn = styled.button.withConfig({ shouldForwardProp: (p) => p !== 'active' })<{ active: boolean }>`
  font-size: 10px; font-weight: ${font.weight.semibold};
  padding: 2px 8px; border-radius: ${radius.full}; cursor: pointer;
  border: 1px solid ${({ active }) => active ? colors.successLight : colors.border};
  background: ${({ active }) => active ? colors.successLight : colors.surface};
  color: ${({ active }) => active ? semanticColors.successTextDeep : colors.textMuted};
  margin-left: 6px;
  &:hover { opacity: 0.8; }
`;
export const LoanNameCell = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;
export const RateSuffix = styled.span`
  font-size: ${font.size.xs};
  color: ${colors.textMuted};
`;
