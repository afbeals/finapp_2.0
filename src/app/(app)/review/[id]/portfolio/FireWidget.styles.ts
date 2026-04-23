import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, semanticColors, font, spacing, radius } = theme;

export const FireGrid = styled.div`display: grid; grid-template-columns: 1fr 1px 1fr; gap: 0;`;
export const Divider = styled.div`background: ${colors.border}; align-self: stretch;`;
export const FireLeft = styled.div`padding: 0 18px 0 0;`;
export const FireRight = styled.div`padding: 0 0 0 18px;`;

export const ToggleGroup = styled.div`
  display: flex; background: ${colors.bg}; border-radius: ${radius.md}; padding: 3px; margin-bottom: 14px;
`;
export const ToggleBtn = styled.button.withConfig({ shouldForwardProp: (p) => p !== 'active' })<{ active: boolean }>`
  flex: 1; padding: 6px; font-size: ${font.size.xs}; font-weight: ${font.weight.semibold};
  border: none; border-radius: ${radius.sm}; cursor: pointer; transition: all 120ms;
  background: ${({ active }) => active ? colors.surface : 'transparent'};
  color: ${({ active }) => active ? colors.textPrimary : colors.textMuted};
  box-shadow: ${({ active }) => active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};
`;

export const FireInputGroup = styled.div`margin-bottom: 12px;`;
export const FireLabel = styled.label`display: block; font-size: ${font.size.xs}; font-weight: ${font.weight.semibold}; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;`;
export const FireInput = styled.input`
  width: 100%; padding: 8px 10px; font-size: ${font.size.sm}; font-family: inherit;
  border: 1.5px solid ${colors.primary}; border-radius: ${radius.md};
  background: ${colors.surface}; color: ${colors.textPrimary}; outline: none;
  &:disabled { border-color: ${colors.border}; color: ${colors.textMuted}; background: ${colors.bg}; }
  &:focus { box-shadow: 0 0 0 3px ${colors.primaryLight}; }
`;

export const FireResultsTitle = styled.p`font-size: ${font.size.xs}; font-weight: ${font.weight.bold}; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 14px;`;
export const FireTarget = styled.div`margin-bottom: 12px;`;
export const FireTargetLabel = styled.p`font-size: ${font.size.xs}; color: ${colors.textMuted}; margin-bottom: 2px;`;
export const FireTargetValue = styled.p`font-size: ${font.size['2xl']}; font-weight: ${font.weight.bold}; color: ${colors.warning};`;

export const ProgressBox = styled.div`
  background: ${semanticColors.successBg}; border: 1px solid ${colors.successLight}; border-radius: ${radius.md};
  padding: 10px 12px; margin-bottom: 12px;
`;
export const ProgressBoxValue = styled.p`font-size: ${font.size.lg}; font-weight: ${font.weight.bold}; color: ${colors.textPrimary}; margin-bottom: 3px;`;
export const ProgressBoxSub = styled.p`font-size: ${font.size.xs}; color: ${colors.success};`;

export const YearsToFireBox = styled.div`
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border: 1px solid ${colors.border}; border-radius: ${radius.md};
`;
export const YearsIcon = styled.span`font-size: 20px;`;
export const YearsValue = styled.p`font-size: ${font.size['2xl']}; font-weight: ${font.weight.bold}; color: ${semanticColors.successTextDark};`;
export const YearsSub = styled.p`font-size: ${font.size.xs}; color: ${semanticColors.successBright};`;
