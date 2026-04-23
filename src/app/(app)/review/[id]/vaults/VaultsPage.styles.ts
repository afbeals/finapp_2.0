import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, semanticColors, font, spacing, radius, shadow } = theme;

export const SectionTitle = styled.h2`
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
  margin: 0 0 ${spacing[4]};
  letter-spacing: -0.01em;
`;

export const SummaryBar = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: 18px 24px;
  margin-bottom: ${spacing[5]};
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  box-shadow: ${shadow.sm};
`;

export const SummaryTotal = styled.div`flex: 1; min-width: 160px;`;
export const SummaryTotalLabel = styled.p`font-size: ${font.size.xs}; font-weight: ${font.weight.semibold}; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 4px;`;
export const SummaryTotalValue = styled.p`font-size: ${font.size['4xl']}; font-weight: ${font.weight.bold}; color: ${colors.textPrimary}; margin: 0; line-height: 1;`;
export const SummaryDivider = styled.div`width: 1px; height: 50px; background: ${colors.border}; margin: 0 12px;`;

export const CatChip = styled.div.withConfig({ shouldForwardProp: (p) => !['bg', 'border', 'text'].includes(p) })<{ bg: string; border: string; text: string }>`
  background: ${({ bg }) => bg}; border: 1px solid ${({ border }) => border};
  border-radius: ${radius.md}; padding: 8px 14px; min-width: 100px;
`;
export const CatChipLabel = styled.p.withConfig({ shouldForwardProp: (p) => p !== 'textColor' })<{ textColor: string }>`font-size: ${font.size.xxs}; font-weight: ${font.weight.semibold}; color: ${({ textColor }) => textColor}; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 2px;`;
export const CatChipVal = styled.p.withConfig({ shouldForwardProp: (p) => p !== 'textColor' })<{ textColor: string }>`font-size: ${font.size.lg}; font-weight: ${font.weight.bold}; color: ${({ textColor }) => textColor}; margin: 0;`;

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

export const CellInput = styled.input`
  height: 26px; padding: 0 6px; border: 1px solid ${colors.primary};
  border-radius: ${radius.sm}; font-size: ${font.size.sm};
  color: ${colors.textPrimary}; background: ${colors.surface}; width: 120px;
  &:focus { outline: none; }
`;
export const DeleteBtn = styled.button`
  display: flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border: none; border-radius: ${radius.sm};
  background: transparent; color: ${colors.textMuted}; cursor: pointer;
  font-size: ${font.size.md}; opacity: 0.45; line-height: 1;
  &:hover { background: ${colors.dangerLight}; color: ${colors.danger}; opacity: 1; }
`;

export const TreasuryWrap = styled.div`
  background: ${colors.surface}; border: 1px solid ${colors.border};
  border-radius: ${radius.lg}; margin-bottom: ${spacing[4]};
  box-shadow: ${shadow.sm}; overflow: hidden;
`;
export const TrAmountBox = styled.div`
  display: flex; align-items: center; gap: 16px; padding: 14px 20px;
  background: ${semanticColors.amberBg}; border-bottom: 1px solid ${semanticColors.amberBorder};
`;
export const TrAmountLabel = styled.span`font-size: ${font.size.xs}; font-weight: ${font.weight.semibold}; color: ${semanticColors.amberText}; text-transform: uppercase; letter-spacing: 0.05em;`;
export const TrAmountInput = styled.input`
  height: 36px; width: 140px; padding: 0 10px;
  border: 1px solid ${semanticColors.amberStrong}; border-radius: ${radius.md};
  font-size: ${font.size.base}; font-weight: ${font.weight.bold}; color: ${semanticColors.amberText};
  background: ${colors.surface}; text-align: right;
  &:focus { outline: none; border-color: ${semanticColors.amberHover}; }
`;
export const TrAllocationBadge = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'valid' })<{ valid: boolean }>`
  margin-left: auto; font-size: ${font.size.sm}; font-weight: ${font.weight.semibold};
  color: ${({ valid }) => valid ? semanticColors.successText : colors.danger};
  background: ${({ valid }) => valid ? colors.successLight : colors.dangerLight};
  padding: 4px 12px; border-radius: ${radius.full};
`;
export const TTr = styled.tr.withConfig({ shouldForwardProp: (p) => p !== 'funded' })<{ funded?: boolean }>`
  background: ${({ funded }) => funded ? semanticColors.successBg : 'transparent'};
  &:not(:last-child) { border-bottom: 1px solid ${colors.border}; }
  &:hover { background: ${({ funded }) => funded ? colors.successLight : colors.bg}; }
`;
export const TTd = styled.td.withConfig({ shouldForwardProp: (p) => !['right', 'bold', 'green', 'muted', 'center'].includes(p) })<{ right?: boolean; bold?: boolean; green?: boolean; muted?: boolean; center?: boolean }>`
  padding: 6px 8px;
  text-align: ${({ right, center }) => right ? 'right' : center ? 'center' : 'left'};
  font-weight: ${({ bold }) => bold ? font.weight.semibold : 'normal'};
  color: ${({ green, muted }) => green ? semanticColors.successText : muted ? colors.textMuted : colors.textPrimary};
  white-space: nowrap;
`;
export const PctInput = styled.input.withConfig({ shouldForwardProp: (p) => p !== 'funded' })<{ funded?: boolean }>`
  width: 52px; height: 26px; padding: 0 6px;
  border: 1px solid ${({ funded }) => funded ? semanticColors.successBorder : semanticColors.amberStrong};
  border-radius: ${radius.sm}; font-size: ${font.size.sm}; font-weight: ${font.weight.semibold}; text-align: center;
  color: ${({ funded }) => funded ? semanticColors.successText : semanticColors.amberText};
  background: ${({ funded }) => funded ? semanticColors.successBg : semanticColors.amberBg};
  &:focus { outline: none; }
  &:disabled { background: ${colors.bg}; border-color: ${colors.border}; color: ${colors.textMuted}; }
`;
