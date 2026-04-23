import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, spacing } = theme;

export const MemberRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid ${colors.border};
  &:last-child { border-bottom: none; }
`;

export const MemberInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const ColorDot = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'color',
})<{ color: string }>`
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: ${({ color }) => color};
  flex-shrink: 0;
`;

export const MemberName = styled.span`
  font-size: ${font.size.base};
  font-weight: 600;
  color: ${colors.textPrimary};
`;

export const MemberEmail = styled.span`
  font-size: ${font.size.sm};
  color: ${colors.textMuted};
  margin-left: 8px;
`;
