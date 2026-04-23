import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, radius } = theme;

export const TrashBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: ${font.size.md};
  color: ${colors.textMuted};
  padding: 2px 4px;
  border-radius: ${radius.sm};
  &:hover { color: ${colors.danger}; background: ${colors.dangerLight}; }
`;
