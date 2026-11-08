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

  @media (max-width: 640px) { display: grid; grid-template-columns: 20px minmax(0, 1fr) auto; gap: 6px; padding: 10px 0; > span:nth-last-child(2) { grid-column: 2; justify-self: start; } > span:last-child { grid-column: 3; grid-row: 1 / 3; } }
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

  min-width: 0; overflow-wrap: anywhere;
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
