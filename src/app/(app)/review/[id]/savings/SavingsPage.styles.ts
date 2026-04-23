import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, spacing, radius } = theme;

export const FieldLabel = styled.label`
  display: block;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: ${spacing[1]};
`;

export const FieldInput = styled.input`
  width: 100%;
  padding: ${spacing[2]} ${spacing[3]};
  font-size: ${font.size.sm};
  font-family: inherit;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface};
  color: ${colors.textPrimary};
  margin-bottom: ${spacing[3]};
  outline: none;
  &:focus { border-color: ${colors.primary}; box-shadow: 0 0 0 2px ${colors.primaryLight}; }
`;

export const FieldSelect = styled.select`
  width: 100%;
  padding: ${spacing[2]} ${spacing[3]};
  font-size: ${font.size.sm};
  font-family: inherit;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface};
  color: ${colors.textPrimary};
  margin-bottom: ${spacing[3]};
  outline: none;
  &:focus { border-color: ${colors.primary}; }
`;

export const ModalActions = styled.div`
  display: flex;
  gap: ${spacing[2]};
  justify-content: flex-end;
  margin-top: ${spacing[2]};
`;
