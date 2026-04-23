'use client';

import React from 'react';
import { Label, FormGroup } from '@/components/ui/Input';
import { theme } from '@/styles/tokens';

const { colors, font, spacing } = theme;

interface ColorPickerFieldProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPickerField({ value, onChange }: ColorPickerFieldProps) {
  return (
    <FormGroup>
      <Label>Color</Label>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing[3] }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 48, height: 38, border: 'none', cursor: 'pointer', borderRadius: 6 }}
        />
        <span style={{ fontSize: font.size.sm, color: colors.textMuted }}>{value}</span>
      </div>
    </FormGroup>
  );
}
