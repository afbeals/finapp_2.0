import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, spacing, radius, font } = theme;

export const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${spacing[2]};
  padding: ${spacing[5]} ${spacing[6]} ${spacing[6]};
`;

export const OwnerChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing[2]};
`;

export const OwnerChip = styled.button.withConfig({
  shouldForwardProp: (p) => p !== 'selected' && p !== 'chipColor',
})<{ selected: boolean; chipColor: string }>`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  padding: 6px 12px;
  border-radius: ${radius.full};
  border: 1.5px solid ${({ selected, chipColor }) => (selected ? chipColor : colors.border)};
  background: ${({ selected, chipColor }) => (selected ? chipColor + '22' : colors.surface)};
  color: ${({ selected, chipColor }) => (selected ? chipColor : colors.textPrimary)};
  cursor: pointer;
  &:hover { border-color: ${({ chipColor }) => chipColor}; }
`;

export const Body = styled.div`padding: ${spacing[5]} ${spacing[6]} 0;`;
