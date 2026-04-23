import styled, { keyframes } from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, radius } = theme;

export const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`;

export const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 24px 0;
`;

export const CenteredWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  color: ${colors.textMuted};
  font-size: 14px;
`;

export const Bar = styled.div.withConfig({ shouldForwardProp: (p) => !['w', 'h'].includes(p) })<{ w?: string; h?: number }>`
  height: ${({ h }) => h ?? 18}px;
  width: ${({ w }) => w ?? '100%'};
  background: ${colors.border};
  border-radius: ${radius.md};
  animation: ${pulse} 1.4s ease-in-out infinite;
`;
