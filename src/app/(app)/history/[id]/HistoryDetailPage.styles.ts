import styled from 'styled-components';
import { theme } from '@/styles/tokens';
import { Card } from '@/components/ui/Card';

const { colors, font, radius, spacing, semanticColors } = theme;

export const Page = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: ${spacing[8]} ${spacing[6]};
`;

export const Banner = styled.div<{ $editing: boolean }>`
  background: ${({ $editing }) => $editing ? colors.warningLight : semanticColors.infoBg};
  border: 1px solid ${({ $editing }) => $editing ? semanticColors.warningBorderStrong : semanticColors.infoBorder};
  border-radius: ${radius.md};
  padding: 12px ${spacing[4]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing[6]};
`;

export const BannerText = styled.span`
  font-size: ${font.size.sm};
  color: ${colors.textSecondary};
`;

export const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: ${spacing[6]};
`;

export const Title = styled.h1`
  font-size: ${font.size['3xl']};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
  margin-bottom: 4px;
`;

export const Subtitle = styled.p`
  font-size: ${font.size.base};
  color: ${colors.textMuted};
`;

export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${spacing[4]};
  margin-bottom: ${spacing[6]};
`;

export const StatCard = styled(Card).withConfig({
  shouldForwardProp: (prop) => prop !== 'accent',
})<{ accent?: string }>`
  border-left: 4px solid ${({ accent }) => accent ?? colors.primary};
`;

export const StatLabel = styled.p`font-size: ${font.size.sm}; color: ${colors.textMuted}; margin-bottom: 4px;`;
export const StatValue = styled.p.withConfig({ shouldForwardProp: (p) => p !== 'textColor' })<{ textColor?: string }>`
  font-size: ${font.size['2xl']}; font-weight: ${font.weight.bold};
  color: ${({ textColor }) => textColor ?? colors.textPrimary};
`;

export const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const StepRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px ${spacing[4]};
  border-radius: ${radius.md};
  background: ${colors.bg};
`;

export const StepLabel = styled.span`font-weight: ${font.weight.semibold};`;
