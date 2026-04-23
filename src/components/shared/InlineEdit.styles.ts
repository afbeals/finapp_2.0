import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, radius } = theme;

export const EditInput = styled.input.withConfig({ shouldForwardProp: (p) => !['align'].includes(p) })<{ align?: string }>`
  font-size: ${font.size.sm};
  font-family: inherit;
  text-align: ${({ align }) => align ?? 'right'};
  border: 1.5px solid ${colors.primary};
  border-radius: ${radius.sm};
  padding: 2px 6px;
  background: ${colors.surface};
  color: ${colors.textPrimary};
  outline: none;
  &:focus { box-shadow: 0 0 0 2px ${colors.primaryLight}; }
`;

export const DisplaySpan = styled.span`
  cursor: text;
  border-radius: ${radius.sm};
  padding: 2px 5px;
  display: inline-block;
  &:hover .pencil { opacity: 0.7; }
`;

export const Pencil = styled.span`
  font-size: 10px;
  color: ${colors.textMuted};
  opacity: 0.3;
  margin-left: 3px;
  transition: opacity 0.1s;
`;
