import styled from 'styled-components';
import { Input } from '@/components/ui/Input';
import { theme } from '@/styles/tokens';

const { colors, font, radius, spacing } = theme;

export const FieldLabel = styled.label`
  display: block;
  font-size: 10px;
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: ${spacing[1]};
`;

export const FieldInput = styled(Input)`width: 100%; margin-bottom: ${spacing[3]};`;

export const FieldSelect = styled.select`
  width: 100%;
  height: 38px;
  padding: 0 10px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  font-size: ${font.size.sm};
  color: ${colors.textPrimary};
  background: ${colors.surface};
  margin-bottom: ${spacing[3]};
  &:focus { outline: none; border-color: ${colors.primary}; }
`;

export const TotalLine = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: ${colors.bg};
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  margin-bottom: 18px;
`;

export const ModalFooter = styled.div`display: flex; justify-content: flex-end; gap: 10px;`;
