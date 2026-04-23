import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, radius, spacing } = theme;

export const TypeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing[3]};
  margin-bottom: ${spacing[6]};
`;

export const TypeCard = styled.button.withConfig({
  shouldForwardProp: (prop) => !['selected', 'accent'].includes(prop),
})<{ selected: boolean; accent: string }>`
  padding: ${spacing[4]};
  border-radius: ${radius.lg};
  border: 2px solid ${({ selected, accent }) => selected ? accent : colors.border};
  background: ${({ selected, accent }) => selected ? `${accent}12` : colors.surface};
  cursor: pointer;
  text-align: left;
  transition: border-color 150ms ease, background 150ms ease;

  &:hover {
    border-color: ${({ accent }) => accent};
  }
`;

export const TypeLabel = styled.div`
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${colors.textPrimary};
  margin-bottom: 4px;
`;

export const TypeDesc = styled.div`
  font-size: ${font.size.sm};
  color: ${colors.textMuted};
`;

export const FieldLabel = styled.label`
  display: block;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${colors.textSecondary};
  margin-bottom: ${spacing[2]};
`;

export const SelectRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing[3]};
  margin-bottom: ${spacing[6]};
`;

export const StyledSelect = styled.select`
  width: 100%;
  height: 40px;
  padding: 0 32px 0 12px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748B' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 12px center;
  appearance: none;
  font-size: ${font.size.base};
  color: ${colors.textPrimary};
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px ${colors.primaryLight};
  }

  option:disabled {
    color: ${colors.textDisabled};
  }
`;

export const StepList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: ${spacing[6]};
  padding: ${spacing[4]};
  background: ${colors.bg};
  border-radius: ${radius.md};
`;

export const StepItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${spacing[2]};
  font-size: ${font.size.sm};
  color: ${colors.textSecondary};

  &::before {
    content: '→';
    color: ${colors.textMuted};
    font-size: 11px;
  }
`;

export const ErrorMsg = styled.p`
  font-size: ${font.size.sm};
  color: ${colors.danger};
  margin-bottom: ${spacing[3]};
`;
