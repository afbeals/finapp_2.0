import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, spacing, radius } = theme;

export const ColHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: ${spacing[3]};
  border-bottom: 2px solid ${colors.border};
  margin-bottom: ${spacing[2]};
`;

export const ColTitle = styled.h3`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
`;

export const ScrollList = styled.div`
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 2px; }
`;

export const ItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const InvCatBadge = styled.span.withConfig({
  shouldForwardProp: (p) => p !== 'bg' && p !== 'fg',
})<{ bg: string; fg: string }>`
  display: inline-block;
  padding: 2px 10px;
  border-radius: 99px;
  font-size: ${font.size.xs};
  font-weight: 600;
  background: ${({ bg }) => bg};
  color: ${({ fg }) => fg};
  border: 1px solid ${({ fg }) => fg}33;
`;

export const SelectInput = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  font-size: ${font.size.base};
  color: ${colors.textPrimary};
  background: ${colors.surface};
`;
