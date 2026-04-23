import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, spacing, radius, shadow, transition } = theme;

export const SectionWrap = styled.div`
  background: ${colors.surface}; border: 1px solid ${colors.border};
  border-radius: ${radius.lg}; margin-bottom: ${spacing[4]};
  box-shadow: ${shadow.xs}; overflow: hidden;
`;

export const SectionHeaderRow = styled.div.withConfig({ shouldForwardProp: (p) => !['bg', 'borderColor'].includes(p) })<{ bg: string; borderColor: string }>`
  display: flex; align-items: center; gap: 10px; padding: 13px 18px;
  cursor: pointer; user-select: none;
  background: ${({ bg }) => bg}; border-bottom: 1px solid ${({ borderColor }) => borderColor};
`;

export const Chevron = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'open' })<{ open: boolean }>`
  font-size: ${font.size.xxs}; color: ${colors.textMuted};
  transform: ${({ open }) => open ? 'rotate(90deg)' : 'none'}; transition: transform ${transition.base};
`;

export const SectionLabel = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'textColor' })<{ textColor: string }>`
  font-size: ${font.size.sm}; font-weight: ${font.weight.bold}; color: ${({ textColor }) => textColor}; min-width: 120px;
`;

export const SubtotalBadge = styled.span.withConfig({ shouldForwardProp: (p) => !['bg', 'textColor'].includes(p) })<{ bg: string; textColor: string }>`
  margin-left: auto; font-size: ${font.size.sm}; font-weight: ${font.weight.semibold};
  color: ${({ textColor }) => textColor}; background: ${({ bg }) => bg};
  padding: 3px 10px; border-radius: ${radius.full};
`;

export const AddRowBtn = styled.button`
  display: flex; align-items: center; gap: 5px;
  margin: 10px 18px; padding: 5px 12px;
  background: transparent; border: 1px dashed ${colors.border};
  border-radius: ${radius.md}; font-size: ${font.size.sm}; color: ${colors.textMuted};
  cursor: pointer;
  &:hover { background: ${colors.bg}; color: ${colors.textPrimary}; border-color: ${colors.primary}; }
`;

export const TableWrap = styled.div`overflow-x: auto;`;

export const FTable = styled.table`width: 100%; border-collapse: collapse; font-size: ${font.size.sm}; min-width: 860px;`;
export const FThead = styled.thead`background: ${colors.bg}; position: sticky; top: 0; z-index: 1;`;

export const FTh = styled.th.withConfig({ shouldForwardProp: (p) => !['right', 'w', 'center'].includes(p) })<{ right?: boolean; w?: number; center?: boolean }>`
  padding: 6px 8px; font-size: ${font.size.xxs}; font-weight: ${font.weight.semibold}; color: ${colors.textMuted};
  text-transform: uppercase; letter-spacing: 0.04em;
  text-align: ${({ right, center }) => right ? 'right' : center ? 'center' : 'left'};
  border-bottom: 1px solid ${colors.border}; white-space: nowrap;
  ${({ w }) => w ? `width: ${w}px; min-width: ${w}px;` : ''}
`;

export const FTr = styled.tr`&:not(:last-child) { border-bottom: 1px solid ${colors.border}; } &:hover { background: ${colors.bg}; }`;

export const FTd = styled.td.withConfig({ shouldForwardProp: (p) => !['right', 'bold', 'center', 'muted'].includes(p) })<{ right?: boolean; bold?: boolean; center?: boolean; muted?: boolean }>`
  padding: 6px 8px;
  text-align: ${({ right, center }) => right ? 'right' : center ? 'center' : 'left'};
  font-weight: ${({ bold }) => bold ? font.weight.semibold : 'normal'};
  color: ${({ muted }) => muted ? colors.textMuted : colors.textPrimary};
  white-space: nowrap;
`;

export const RawNameCell = styled.span`
  display: inline-block;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, monospace;
  font-size: ${font.size.xs};
  color: ${colors.textMuted};
  cursor: default;
  vertical-align: middle;
`;

export const CellSelect = styled.select`
  height: 26px; padding: 0 4px; border: 1px solid ${colors.primary};
  border-radius: ${radius.sm}; font-size: ${font.size.sm};
  color: ${colors.textPrimary}; background: ${colors.surface}; cursor: pointer;
  &:focus { outline: none; }
`;

export const NumInput = styled.input`
  width: 82px; height: 26px; padding: 0 6px; border: 1px solid ${colors.border};
  border-radius: ${radius.sm}; font-size: ${font.size.sm};
  text-align: right; color: ${colors.textPrimary}; background: ${colors.surface};
  &:focus { outline: none; border-color: ${colors.primary}; }
  &:disabled { background: ${colors.bg}; color: ${colors.textMuted}; }
`;

export const OrderInput = styled.input`
  width: 40px; height: 26px; padding: 0 4px; border: 1px solid ${colors.border};
  border-radius: ${radius.sm}; font-size: ${font.size.sm};
  text-align: center; color: ${colors.textPrimary}; background: ${colors.surface};
  &:focus { outline: none; border-color: ${colors.primary}; }
`;

export const DueInput = styled.input`
  width: 70px; height: 26px; padding: 0 6px; border: 1px solid ${colors.border};
  border-radius: ${radius.sm}; font-size: ${font.size.sm};
  color: ${colors.textPrimary}; background: ${colors.surface};
  &:focus { outline: none; border-color: ${colors.primary}; }
  &:disabled { background: ${colors.bg}; color: ${colors.textMuted}; }
`;

export const DeleteBtn = styled.button`
  display: flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border: none; border-radius: ${radius.sm};
  background: transparent; color: ${colors.textMuted}; cursor: pointer;
  font-size: 15px; opacity: 0.45; line-height: 1;
  &:hover { background: ${colors.dangerLight}; color: ${colors.danger}; opacity: 1; }
`;

export const OwnerBadge = styled.span.withConfig({ shouldForwardProp: (p) => !['bg', 'fg'].includes(p) })<{ bg: string; fg: string }>`
  display: inline-block; padding: 2px 8px; border-radius: ${radius.full};
  font-size: ${font.size.xxs}; font-weight: ${font.weight.semibold}; background: ${({ bg }) => bg}; color: ${({ fg }) => fg};
`;
