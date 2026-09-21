import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, radius, spacing } = theme;

export const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${spacing[2]} 0;
  margin-top: ${spacing[3]};
  border-bottom: 1px solid ${colors.border};
`;

export const SectionLabel = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
`;

export const SelectAllBtn = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${colors.primary};
  padding: 2px 6px;
  &:hover { text-decoration: underline; }
`;

export const EntryRow = styled.label`
  display: flex;
  align-items: center;
  gap: ${spacing[2]};
  padding: 6px 4px;
  cursor: pointer;
  border-radius: ${radius.sm};
  &:hover { background: ${colors.bg}; }
`;

export const EntryCheckbox = styled.input`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  cursor: pointer;
`;

export const EntryName = styled.span`
  flex: 1;
  font-size: ${font.size.sm};
  color: ${colors.textPrimary};
`;

export const EntryAmount = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${colors.textMuted};
`;

export const EmptyMessage = styled.p`
  font-size: ${font.size.sm};
  color: ${colors.textMuted};
  text-align: center;
  padding: ${spacing[4]} 0;
`;
