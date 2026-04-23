import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, spacing, radius } = theme;

export const PieScrollTrack = styled.div`
  display: flex;
  gap: ${spacing[4]};
  overflow-x: auto;
  padding-bottom: ${spacing[2]};
  margin-bottom: ${spacing[6]};
  scrollbar-width: thin;
  scrollbar-color: ${colors.border} transparent;
  &::-webkit-scrollbar { height: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 3px; }
`;

export const PieCardFixed = styled.div`
  flex-shrink: 0;
  width: 240px;
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: 14px;
`;

export const PieCardTitle = styled.p`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${colors.textPrimary};
  margin-bottom: 8px;
  text-align: center;
`;

export const PieLegend = styled.div`
  margin-top: 6px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px 6px;
`;

export const PieLegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
`;

export const PieLegendDot = styled.span.withConfig({
  shouldForwardProp: (p) => p !== 'dotColor',
})<{ dotColor: string }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: ${({ dotColor }) => dotColor};
  flex-shrink: 0;
`;

export const PieLegendLabel = styled.span`
  font-size: 9px;
  color: ${colors.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
