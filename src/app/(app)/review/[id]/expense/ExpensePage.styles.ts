import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, spacing, radius } = theme;

export const GroupSeparator = styled.div`
  height: 1px;
  background: ${colors.border};
  margin: ${spacing[4]} 0;
  opacity: 0.6;
`;

export const SummaryBar = styled.div.withConfig({
  shouldForwardProp: (prop) => !['bg', 'borderColor'].includes(prop),
})<{ bg: string; borderColor: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px ${spacing[5]};
  background: ${({ bg }) => bg};
  border: 1.5px solid ${({ borderColor }) => borderColor};
  border-radius: ${radius.lg};
  margin-bottom: ${spacing[2]};
`;

export const SummaryLabel = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'textColor',
})<{ textColor: string }>`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${({ textColor }) => textColor};
  display: flex;
  align-items: center;
  gap: ${spacing[2]};
`;

export const SummaryValue = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'textColor',
})<{ textColor: string }>`
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  color: ${({ textColor }) => textColor};
`;
