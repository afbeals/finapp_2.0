import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, radius, spacing, semanticColors } = theme;

export const Wrap = styled.div`
  padding: ${spacing[8]};
  text-align: center;
  background: ${colors.dangerLight};
  border: 1px solid ${semanticColors.dangerBorder};
  border-radius: ${radius.lg};
  margin: ${spacing[4]} 0;
`;

export const Title = styled.p`
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${semanticColors.dangerTextDark};
  margin-bottom: ${spacing[2]};
`;

export const Sub = styled.p`
  font-size: ${font.size.sm};
  color: ${semanticColors.dangerText};
  margin-bottom: ${spacing[4]};
`;

export const RetryBtn = styled.button`
  padding: 7px 18px;
  background: ${colors.surface};
  border: 1px solid ${semanticColors.dangerBorder};
  border-radius: ${radius.md};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${semanticColors.dangerTextDark};
  cursor: pointer;
  &:hover { background: ${colors.dangerLight}; }
`;
