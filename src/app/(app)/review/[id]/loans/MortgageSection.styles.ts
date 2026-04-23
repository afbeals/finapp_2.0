import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, semanticColors, font, spacing, radius, transition } = theme;

export const ProgressWrap = styled.div`margin-bottom: ${spacing[3]};`;
export const ProgressLabel = styled.div`font-size: ${font.size.xs}; color: ${colors.textMuted}; margin-bottom: 6px;`;
export const ProgressTrack = styled.div`height: 10px; background: ${colors.border}; border-radius: ${radius.full}; overflow: hidden;`;
export const ProgressFill = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'pct' && p !== 'color' })<{ pct: number; color: string }>`
  height: 100%; width: ${({ pct }) => pct}%; background: ${({ color }) => color};
  border-radius: ${radius.full}; transition: width ${transition.exit};
`;

export const SplitBar = styled.div`display: flex; height: 10px; border-radius: ${radius.full}; overflow: hidden; margin: 6px 0 4px;`;
export const SplitSegment = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'pct' && p !== 'bg' })<{ pct: number; bg: string }>`
  width: ${({ pct }) => pct}%;
  background: ${({ bg }) => bg};
  transition: width ${transition.exit};
`;
export const SplitLegend = styled.div`display: flex; gap: 14px; font-size: ${font.size.xs}; color: ${colors.textMuted};`;
export const SplitDot = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'bg' })<{ bg: string }>`
  display: inline-flex; align-items: center; gap: 4px;
  &::before { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: ${({ bg }) => bg}; }
`;
export const PiCardWrap = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: ${spacing[3]} ${spacing[4]};
`;

export const PaymentCard = styled.div`
  background: ${colors.primaryLight};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: ${spacing[4]} ${spacing[5]};
  margin-bottom: ${spacing[4]};
`;

export const PaymentCardTitle = styled.p`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${semanticColors.primaryTextDark};
  margin-bottom: ${spacing[3]};
`;

export const PaymentRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${spacing[3]};
  flex-wrap: wrap;
`;

export const FieldGroup = styled.div`display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 160px;`;
export const FieldLabel = styled.label`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;
export const FieldInput = styled.input`
  padding: 8px 12px;
  font-size: ${font.size.base};
  font-family: inherit;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface};
  color: ${colors.textPrimary};
  outline: none;
  &:focus { border-color: ${colors.primary}; box-shadow: 0 0 0 2px ${colors.primaryLight}; }
  &:disabled { opacity: 0.5; background: ${colors.bg}; }
`;

export const PmiCard = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: ${spacing[3]} ${spacing[4]};
  margin-bottom: ${spacing[4]};
`;

export const PmiTitle = styled.p`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${colors.textPrimary};
  margin-bottom: ${spacing[2]};
`;

export const GearBtn = styled.button`
  background: none;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  padding: 4px 10px;
  font-size: 15px;
  cursor: pointer;
  color: ${colors.textMuted};
  &:hover { background: ${colors.bg}; color: ${colors.textPrimary}; }
`;

export const ActionsRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[2]};
`;
