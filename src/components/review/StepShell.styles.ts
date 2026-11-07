import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, spacing } = theme;

export const SubNav = styled.div`
  background: ${colors.surface};
  border-bottom: 1px solid ${colors.border};
  padding: 0 ${spacing[6]};

  @media (max-width: 640px) { padding: 0 12px; }
`;

export const SubNavInner = styled.div`
  max-width: 960px;
  margin: 0 auto;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 640px) { height: auto; padding: 12px 0; align-items: stretch; flex-direction: column; gap: 12px; }
`;

export const TitleBlock = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${spacing[3]};

  min-width: 0; flex-wrap: wrap;
  @media (max-width: 640px) { gap: 4px 12px; }
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

  min-width: 0;
  > * { min-width: 0; }
  @media (max-width: 640px) { padding: 20px 12px; }
`;
