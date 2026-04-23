import styled from 'styled-components';
import { theme } from '@/styles/tokens';
import { Card } from '@/components/ui/Card';

const { colors, font, radius, spacing } = theme;

export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing[4]};
  margin-bottom: ${spacing[6]};
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

export const SummaryCard = styled(Card).withConfig({
  shouldForwardProp: (prop) => prop !== 'accent',
})<{ accent?: string }>`
  border-left: 4px solid ${({ accent }) => accent ?? colors.primary};
`;

export const Label = styled.p`font-size: ${font.size.sm}; color: ${colors.textMuted}; margin-bottom: ${spacing[1]};`;
export const Value = styled.p`font-size: ${font.size['2xl']}; font-weight: 700; color: ${colors.textPrimary};`;

export const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: ${spacing[6]};
`;

export const StepRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px ${spacing[4]};
  border-radius: ${radius.md};
  background: ${colors.bg};
`;

export const CompleteBox = styled.div`
  text-align: center;
  padding: ${spacing[10]};
`;

export const CompleteIcon = styled.div`font-size: 56px; margin-bottom: ${spacing[4]};`;
