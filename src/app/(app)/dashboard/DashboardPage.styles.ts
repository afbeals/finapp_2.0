import styled from 'styled-components';
import { theme } from '@/styles/tokens';
import { Card } from '@/components/ui/Card';
import { Tr } from '@/components/ui/Table';

const { colors, font, radius, spacing, shadow } = theme;

export const Page = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: ${spacing[8]} ${spacing[6]};
`;

export const WelcomeBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: ${spacing[4]} ${spacing[5]};
  margin-bottom: ${spacing[6]};
  box-shadow: ${shadow.sm};
`;

export const WelcomeText = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[3]};
`;

export const WelcomeGreeting = styled.h1`
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
`;

export const CardRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing[6]};
  margin-bottom: ${spacing[8]};
  @media (max-width: 680px) { grid-template-columns: 1fr; }
`;

export const ActiveCard = styled(Card)`
  border-left: 4px solid ${colors.primary};
`;

export const ActiveBadgeRow = styled.div`
  display: flex;
  gap: ${spacing[2]};
  margin-bottom: ${spacing[3]};
`;

export const ReviewTitle = styled.h2`
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.semibold};
  color: ${colors.textPrimary};
  margin-bottom: ${spacing[1]};
`;

export const ReviewMeta = styled.p`
  font-size: ${font.size.sm};
  color: ${colors.textMuted};
  margin-bottom: ${spacing[4]};
`;

export const PrevCard = styled(Card)`
  border-left: 4px solid ${colors.textMuted};
  display: flex;
  flex-direction: column;
`;

export const PrevCardLabel = styled.p`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: ${spacing[2]};
`;

export const PrevSelect = styled.select`
  width: 100%;
  height: 42px;
  padding: 0 32px 0 12px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748B' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 12px center;
  color: ${colors.textPrimary};
  font-size: ${font.size.base};
  font-family: inherit;
  appearance: none;
  cursor: pointer;
  outline: none;
  margin-bottom: ${spacing[4]};
  &:focus { border-color: ${colors.primary}; }
`;

export const EmptyCard = styled(Card)`
  text-align: center;
  padding: ${spacing[10]};
  border: 2px dashed ${colors.border};
  background: transparent;
  box-shadow: none;
`;

export const EmptyIcon = styled.div`font-size: 36px; margin-bottom: ${spacing[3]};`;
export const EmptyTitle = styled.h2`font-size: ${font.size.xl}; font-weight: ${font.weight.semibold}; color: ${colors.textPrimary}; margin-bottom: ${spacing[2]};`;
export const EmptySubtitle = styled.p`font-size: ${font.size.sm}; color: ${colors.textMuted}; margin-bottom: ${spacing[5]};`;

export const SectionTitle = styled.h2`
  font-size: ${font.size.xl};
  font-weight: ${font.weight.semibold};
  color: ${colors.textPrimary};
  margin-bottom: ${spacing[4]};
`;

export const ClickableRow = styled(Tr)`cursor: pointer;`;

export const NetChange = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'positive',
})<{ positive: boolean }>`
  font-weight: ${font.weight.semibold};
  color: ${({ positive }) => positive ? colors.success : colors.danger};
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;
