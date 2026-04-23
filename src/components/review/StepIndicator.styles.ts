import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, radius, spacing, semanticColors, transition } = theme;

export const Wrapper = styled.div`
  background: ${colors.surface};
  border-bottom: 1px solid ${colors.border};
  padding: ${spacing[4]} ${spacing[6]};
`;

export const Inner = styled.div`
  max-width: 960px;
  margin: 0 auto;
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${spacing[3]};
  margin-bottom: ${spacing[3]};
`;

export const ProgressTitle = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
`;

export const ProgressCounter = styled.span`
  font-size: ${font.size.xs};
  color: ${colors.textMuted};
`;

export const ContentRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${spacing[4]};
`;

export const StepsArea = styled.div`
  flex: 1;
  display: flex;
  align-items: flex-start;
  min-width: 0;
`;

export const BADGE_H = 20;
export const CIRCLE_SIZE = 36;

export const StepCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 56px;
`;

export const BadgeArea = styled.div`
  height: ${BADGE_H}px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin-bottom: 4px;
`;

export const QuarterlyBadge = styled.div`
  background: ${colors.warning};
  color: ${colors.surface};
  font-size: ${font.size.micro};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.04em;
  padding: 2px 5px;
  border-radius: ${radius.sm};
`;

export type CircleStatus = 'current' | 'complete' | 'skipped' | 'pending' | 'quarterly';

export const Circle = styled.button.withConfig({
  shouldForwardProp: (prop) => !['status', 'clickable'].includes(prop),
})<{ status: CircleStatus; clickable: boolean }>`
  width: ${CIRCLE_SIZE}px;
  height: ${CIRCLE_SIZE}px;
  border-radius: ${radius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  cursor: ${({ clickable }) => clickable ? 'pointer' : 'default'};
  transition: opacity ${transition.quick};
  flex-shrink: 0;

  background: ${({ status }) =>
    status === 'current' ? colors.primary :
    status === 'complete' ? colors.success :
    status === 'skipped' ? colors.textDisabled :
    status === 'quarterly' ? semanticColors.warningBg :
    colors.surface};

  border: 2px solid ${({ status }) =>
    status === 'current' ? colors.primary :
    status === 'complete' ? colors.success :
    status === 'skipped' ? colors.textDisabled :
    status === 'quarterly' ? colors.warning :
    colors.borderStrong};

  color: ${({ status }) =>
    status === 'current' ? colors.surface :
    status === 'complete' ? colors.surface :
    status === 'skipped' ? colors.surface :
    status === 'quarterly' ? colors.warning :
    colors.textMuted};

  &:hover {
    opacity: ${({ clickable }) => clickable ? 0.85 : 1};
  }
`;

export const StepLabel = styled.div`
  margin-top: 6px;
  text-align: center;
`;

export const LabelLine = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'muted',
})<{ muted?: boolean }>`
  display: block;
  font-size: ${font.size.xxs};
  font-weight: ${({ muted }) => muted ? font.weight.normal : font.weight.medium};
  color: ${({ muted }) => muted ? colors.textMuted : colors.textSecondary};
  line-height: 1.3;
`;

export const ConnectorWrapper = styled.div`
  flex: 1;
  min-width: 8px;
  padding-top: ${BADGE_H + 4 + CIRCLE_SIZE / 2 - 1}px;
  align-self: flex-start;
`;

export const ConnectorLine = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'dashed',
})<{ dashed: boolean }>`
  height: 2px;
  width: 100%;
  background: ${({ dashed }) => dashed
    ? `repeating-linear-gradient(to right, ${colors.border} 0, ${colors.border} 4px, transparent 4px, transparent 8px)`
    : colors.border};
`;

export const Legend = styled.div`
  flex-shrink: 0;
  background: ${semanticColors.surfaceMuted};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
`;

export const LegendTitle = styled.p`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  color: ${colors.textMuted};
  margin-bottom: 2px;
`;

export const LegendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const LegendDot = styled.div.withConfig({
  shouldForwardProp: (prop) => !['fill', 'stroke'].includes(prop),
})<{ fill: string; stroke?: string }>`
  width: 10px;
  height: 10px;
  border-radius: ${radius.full};
  background: ${({ fill }) => fill};
  border: 1.5px solid ${({ stroke, fill }) => stroke ?? fill};
  flex-shrink: 0;
`;

export const LegendLabel = styled.span`
  font-size: ${font.size.xxs};
  color: ${colors.textMuted};
`;

export const LegendLine = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'dashed',
})<{ dashed?: boolean }>`
  width: 18px;
  height: 2px;
  flex-shrink: 0;
  background: ${({ dashed }) => dashed
    ? `repeating-linear-gradient(to right, ${colors.border} 0, ${colors.border} 3px, transparent 3px, transparent 6px)`
    : colors.border};
`;

export const LegendSkipBtn = styled.button`
  flex-shrink: 0;
  align-self: center;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${colors.danger};
  background: ${colors.surface};
  border: 1px solid ${colors.danger};
  border-radius: ${radius.md};
  padding: 6px 12px;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: ${colors.dangerLight}; }
`;
