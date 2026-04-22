'use client';

import styled, { css } from 'styled-components';
import { colors, radius, font, spacing, transition } from '@/styles/tokens';

interface InputProps {
  hasError?: boolean;
}

export const Input = styled.input<InputProps>`
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border: 1px solid ${({ hasError }) => hasError ? colors.danger : colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface};
  color: ${colors.textPrimary};
  font-size: ${font.size.base};
  font-family: inherit;
  transition: border-color ${transition.fast}, box-shadow ${transition.fast};
  outline: none;

  &::placeholder {
    color: ${colors.textDisabled};
  }

  &:focus {
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px ${colors.primaryLight};
  }

  &:disabled {
    background: ${colors.bg};
    color: ${colors.textMuted};
    cursor: not-allowed;
  }

  ${({ hasError }) => hasError && css`
    &:focus {
      border-color: ${colors.danger};
      box-shadow: 0 0 0 3px ${colors.dangerLight};
    }
  `}
`;

export const Label = styled.label`
  display: block;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${colors.textSecondary};
  margin-bottom: 6px;
`;

export const FieldError = styled.p`
  font-size: ${font.size.sm};
  color: ${colors.danger};
  margin-top: ${spacing[1]};
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: ${spacing[4]};
`;

export const Select = styled.select<InputProps>`
  width: 100%;
  height: 38px;
  padding: 0 32px 0 12px;
  border: 1px solid ${({ hasError }) => hasError ? colors.danger : colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748B' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 12px center;
  color: ${colors.textPrimary};
  font-size: ${font.size.base};
  font-family: inherit;
  appearance: none;
  cursor: pointer;
  outline: none;
  transition: border-color ${transition.fast};

  &:focus {
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px ${colors.primaryLight};
  }
`;

export const Textarea = styled.textarea<InputProps>`
  width: 100%;
  min-height: 80px;
  padding: 10px 12px;
  border: 1px solid ${({ hasError }) => hasError ? colors.danger : colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface};
  color: ${colors.textPrimary};
  font-size: ${font.size.base};
  font-family: inherit;
  resize: vertical;
  outline: none;
  transition: border-color ${transition.fast};

  &:focus {
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px ${colors.primaryLight};
  }
`;
