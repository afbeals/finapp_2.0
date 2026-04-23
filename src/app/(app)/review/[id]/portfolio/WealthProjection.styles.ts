import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, semanticColors, font, spacing, radius } = theme;

export const ProjectionInputsBar = styled.div`
  background: ${semanticColors.surfaceMuted};
  border-bottom: 1px solid ${colors.border};
  padding: 14px 18px;
  display: flex; gap: ${spacing[4]}; flex-wrap: wrap; align-items: flex-end;
`;
export const ProjInputGroup = styled.div`display: flex; flex-direction: column; gap: 4px; min-width: 130px;`;
export const ProjLabel = styled.label`font-size: ${font.size.xs}; font-weight: ${font.weight.semibold}; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.04em;`;
export const ProjInput = styled.input`
  padding: 6px 10px; font-size: ${font.size.sm}; font-family: inherit;
  border: 1px solid ${colors.border}; border-radius: ${radius.md};
  background: ${colors.surface}; color: ${colors.textPrimary}; outline: none; width: 100%;
  &:focus { border-color: ${colors.primary}; box-shadow: 0 0 0 2px #BFDBFE; }
`;
export const EndYearBadge = styled.div`
  padding: 6px 16px; background: ${colors.primary}; color: ${colors.surface};
  border-radius: ${radius.md}; font-size: ${font.size.sm}; font-weight: ${font.weight.bold};
  align-self: flex-end; line-height: 1.5;
`;
export const ProjectionChartArea = styled.div`
  display: grid;
  grid-template-columns: 1fr 200px;
  @media (max-width: 800px) { grid-template-columns: 1fr; }
`;
export const MonthlyValuesPanel = styled.div`
  border-left: 1px solid ${colors.border};
  overflow-y: auto;
  max-height: 300px;
`;
export const MonthlyValuesHeader = styled.div`
  padding: 10px 14px 8px;
  font-size: ${font.size.xs}; font-weight: ${font.weight.bold};
  color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.05em;
  border-bottom: 1px solid ${colors.border};
  position: sticky; top: 0; background: ${colors.surface}; z-index: 1;
`;
export const MonthlyValueRow = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'highlight' })<{ highlight?: boolean }>`
  padding: 7px 14px;
  background: ${({ highlight }) => highlight ? semanticColors.infoBg : colors.surface};
  border-bottom: 1px solid ${colors.border};
  display: flex; justify-content: space-between; align-items: center;
  &:last-child { border-bottom: none; }
`;
export const MonthRowLabel = styled.span`font-size: ${font.size.xs}; color: ${colors.textMuted};`;
export const MonthRowValue = styled.span`font-size: ${font.size.xs}; font-weight: ${font.weight.semibold}; color: ${colors.textPrimary};`;
