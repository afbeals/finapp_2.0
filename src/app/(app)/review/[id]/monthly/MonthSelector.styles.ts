import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, spacing, radius, shadow } = theme;

export const MonthSelectorCard = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: 14px 16px;
  margin-bottom: ${spacing[6]};
  box-shadow: ${shadow.xs};
`;

export const MonthSelectorTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

export const MonthSelectorLabel = styled.p`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

export const MonthSelectorActions = styled.div`
  display: flex;
  gap: ${spacing[2]};
`;

export const MonthActionBtn = styled.button.withConfig({
  shouldForwardProp: (p) => p !== 'primary',
})<{ primary?: boolean }>`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  padding: 3px 10px;
  border-radius: ${radius.full};
  cursor: pointer;
  border: 1px solid ${({ primary }) => primary ? colors.primary : colors.border};
  background: ${({ primary }) => primary ? colors.primaryLight : colors.surface};
  color: ${({ primary }) => primary ? colors.primary : colors.textMuted};
  &:hover { opacity: 0.8; }
`;

export const MonthPills = styled.div`
  display: flex;
  gap: ${spacing[2]};
  flex-wrap: wrap;
`;

export const MonthPill = styled.button.withConfig({
  shouldForwardProp: (p) => p !== 'selected',
})<{ selected: boolean }>`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  padding: 5px 12px;
  border-radius: ${radius.full};
  cursor: pointer;
  border: 1px solid ${({ selected }) => selected ? colors.primary : colors.borderStrong};
  background: ${({ selected }) => selected ? colors.primary : colors.surface};
  color: ${({ selected }) => selected ? colors.surface : colors.textMuted};
  transition: all 100ms ease;
  &:hover { opacity: 0.85; }
`;
