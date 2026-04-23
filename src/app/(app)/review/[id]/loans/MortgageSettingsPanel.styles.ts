import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, spacing, radius } = theme;

export const Panel = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: ${spacing[4]} ${spacing[5]};
  margin-bottom: ${spacing[4]};
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

export const PanelTitle = styled.p`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${colors.textPrimary};
  margin-bottom: ${spacing[3]};
`;

export const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: ${spacing[3]};
  margin-bottom: ${spacing[3]};
`;

export const FieldGroup = styled.div`display: flex; flex-direction: column; gap: 4px;`;

export const FieldLabel = styled.label`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const FieldInput = styled.input`
  padding: 7px 10px;
  font-size: ${font.size.sm};
  font-family: inherit;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface};
  color: ${colors.textPrimary};
  outline: none;
  text-align: right;
  &:focus { border-color: ${colors.primary}; box-shadow: 0 0 0 2px ${colors.primaryLight}; }
  &:disabled { opacity: 0.5; background: ${colors.bg}; }
`;

export const Divider = styled.div`
  height: 1px;
  background: ${colors.border};
  margin: ${spacing[3]} 0;
`;

export const HelperText = styled.p`
  font-size: ${font.size.xs};
  color: ${colors.textMuted};
  margin-top: ${spacing[1]};
`;

export const SavingDot = styled.span`
  font-size: ${font.size.xs};
  color: ${colors.textMuted};
  font-style: italic;
`;
