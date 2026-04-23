import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, spacing, semanticColors } = theme;

export const Banner = styled.div<{ $editing: boolean }>`
  background: ${({ $editing }) => $editing ? colors.warningLight : semanticColors.infoBg};
  border-bottom: 1px solid ${({ $editing }) => $editing ? semanticColors.warningBorderStrong : semanticColors.infoBorder};
  padding: 10px ${spacing[6]};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const Inner = styled.div`
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const Text = styled.span`
  font-size: ${font.size.sm};
  color: ${colors.textSecondary};
`;
