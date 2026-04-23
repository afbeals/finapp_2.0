import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, spacing } = theme;

export const SubNav = styled.div`
  background: ${colors.surface};
  border-bottom: 1px solid ${colors.border};
  padding: 0 ${spacing[6]};
`;

export const SubNavInner = styled.div`
  max-width: 960px;
  margin: 0 auto;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const TitleBlock = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${spacing[3]};
`;

export const StepTitle = styled.h1`
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
`;

export const StepSubtitle = styled.p`
  font-size: ${font.size.sm};
  color: ${colors.textMuted};
`;

export const Content = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: ${spacing[8]} ${spacing[6]};
`;
