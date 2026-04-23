import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, spacing } = theme;

export const Wrap = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[3]};
  margin: ${spacing[6]} 0 ${spacing[3]};
`;

export const Title = styled.h2`
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
  white-space: nowrap;
`;

export const Line = styled.div`
  flex: 1;
  height: 1px;
  background: ${colors.border};
`;

export const Actions = styled.div`display: flex; align-items: center; gap: ${spacing[2]};`;
