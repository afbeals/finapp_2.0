import styled from 'styled-components';
import { theme } from '@/styles/tokens';
import { Card } from '@/components/ui/Card';

const { colors, font, spacing, radius } = theme;

export const Page = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: ${spacing[8]} ${spacing[6]};
`;

export const PageTitle = styled.h1`
  font-size: ${font.size['3xl']};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
  margin-bottom: ${spacing[8]};
`;

export const Section = styled(Card)`
  margin-bottom: ${spacing[6]};
`;

export const ExportBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing[4]};
`;

export const SubText = styled.p`
  font-size: ${font.size.sm};
  color: ${colors.textMuted};
  margin-top: 2px;
`;
