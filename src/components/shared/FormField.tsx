'use client';

import React from 'react';
import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, radius } = theme;

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

export const FieldSelect = styled.select`
  padding: 7px 10px;
  font-size: ${font.size.sm};
  font-family: inherit;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface};
  color: ${colors.textPrimary};
  outline: none;
  cursor: pointer;
  &:focus { border-color: ${colors.primary}; }
  &:disabled { opacity: 0.5; background: ${colors.bg}; }
`;

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, children, className }: FormFieldProps) {
  return (
    <FieldGroup className={className}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </FieldGroup>
  );
}
