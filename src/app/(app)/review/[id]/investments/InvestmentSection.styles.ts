import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, semanticColors, font, spacing, radius, shadow, transition } = theme;

export const SectionWrap = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  margin-bottom: ${spacing[4]};
  box-shadow: ${shadow.sm};
  overflow: hidden;
`;

export const SectionHeaderRow = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'green' })<{ green?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  cursor: pointer;
  user-select: none;
  background: ${({ green }) => green ? semanticColors.successBg : colors.surface};
  border-bottom: 1px solid ${({ green }) => green ? colors.successLight : colors.border};
  &:hover { background: ${({ green }) => green ? colors.successLight : colors.bg}; }
`;

export const Chevron = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'open' && p !== 'green' })<{ open: boolean; green?: boolean }>`
  font-size: ${font.size.xs};
  color: ${({ green }) => green ? semanticColors.successTextMedium : colors.primary};
  transform: ${({ open }) => open ? 'rotate(90deg)' : 'none'};
  transition: transform ${transition.base};
  flex-shrink: 0;
`;

export const SectionName = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'green' })<{ green?: boolean }>`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${({ green }) => green ? semanticColors.successText : colors.textPrimary};
  min-width: 220px;
`;

export const HeaderStats = styled.div`
  display: flex;
  align-items: center;
  gap: 22px;
  flex: 1;
  flex-wrap: wrap;
`;

export const HStat = styled.div`display: flex; flex-direction: column; gap: 1px;`;
export const HStatLabel = styled.span`font-size: ${font.size.micro}; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.04em;`;
export const HStatVal = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'textColor' })<{ textColor?: string }>`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${({ textColor }) => textColor ?? colors.textPrimary};
`;

export const ExpandLink = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'green' })<{ green?: boolean }>`
  margin-left: auto;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${({ green }) => green ? semanticColors.successTextMedium : colors.primary};
  white-space: nowrap;
  padding: 0 4px;
`;

export const PositionBadge = styled.span`
  font-size: ${font.size.xxs};
  color: ${colors.textMuted};
  background: ${colors.bg};
  border: 1px solid ${colors.border};
  border-radius: ${radius.full};
  padding: 2px 8px;
  white-space: nowrap;
`;

export const ExpandedWrap = styled.div`padding: 14px 18px;`;

export const SubHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
`;

export const FilterInput = styled.input`
  height: 32px;
  padding: 0 10px 0 28px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  font-size: ${font.size.sm};
  color: ${colors.textPrimary};
  background: ${colors.bg} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E") no-repeat 9px center;
  width: 200px;
  &:focus { outline: none; border-color: ${colors.primary}; }
`;

export const FilterSelect = styled.select`
  height: 32px;
  padding: 0 24px 0 8px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  font-size: ${font.size.sm};
  color: ${colors.textPrimary};
  background: ${colors.surface};
  cursor: pointer;
  &:focus { outline: none; border-color: ${colors.primary}; }
`;

export const CollapseBtn = styled.button`
  height: 32px; padding: 0 12px;
  background: transparent; border: 1px solid ${colors.border};
  border-radius: ${radius.md}; font-size: ${font.size.sm};
  color: ${colors.textMuted}; cursor: pointer;
  &:hover { background: ${colors.bg}; }
`;

export const TableScroll = styled.div`overflow-x: auto;`;

export const HTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${font.size.sm};
  min-width: 860px;
`;

export const HThead = styled.thead`background: ${semanticColors.surfaceMuted}; position: sticky; top: 0; z-index: 1;`;

export const HTh = styled.th.withConfig({ shouldForwardProp: (p) => p !== 'right' })<{ right?: boolean }>`
  padding: 7px 10px;
  font-size: ${font.size.xxs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: ${({ right }) => right ? 'right' : 'left'};
  border-bottom: 1px solid ${colors.border};
  white-space: nowrap;
`;

export const HTr = styled.tr`
  &:not(:last-child) { border-bottom: 1px solid ${colors.border}; }
  &:hover { background: ${colors.bg}; }
`;

export const HTd = styled.td.withConfig({ shouldForwardProp: (p) => p !== 'right' && p !== 'bold' })<{ right?: boolean; bold?: boolean }>`
  padding: 9px 10px;
  text-align: ${({ right }) => right ? 'right' : 'left'};
  font-weight: ${({ bold }) => bold ? font.weight.semibold : 'normal'};
  white-space: nowrap;
  color: ${colors.textPrimary};
`;

export const CategoryBadge = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'bg' && p !== 'fg' })<{ bg: string; fg: string }>`
  display: inline-block;
  padding: 1px 7px;
  border-radius: ${radius.full};
  font-size: ${font.size.xxs};
  font-weight: ${font.weight.semibold};
  background: ${({ bg }) => bg};
  color: ${({ fg }) => fg};
`;

export const AccountChip = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'bg' && p !== 'fg' })<{ bg: string; fg: string }>`
  display: inline-block;
  padding: 1px 7px;
  border-radius: ${radius.full};
  font-size: ${font.size.xxs};
  font-weight: ${font.weight.medium};
  background: ${({ bg }) => bg};
  color: ${({ fg }) => fg};
  margin: 1px 2px;
`;

export const PriceSpinner = styled.span`
  font-size: 10px;
  color: ${colors.textMuted};
  font-style: italic;
`;

export const AddPurchaseBtn = styled.button`
  height: 32px; padding: 0 14px;
  background: ${colors.primary}; color: ${colors.surface};
  border: none; border-radius: ${radius.md};
  font-size: ${font.size.sm}; font-weight: ${font.weight.semibold};
  cursor: pointer;
  &:hover { background: ${colors.primaryHover}; }
`;
