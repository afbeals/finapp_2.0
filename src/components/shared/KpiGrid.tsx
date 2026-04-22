'use client';

import React from 'react';
import styled, { css } from 'styled-components';
import { colors, font, radius, spacing, semanticColors } from '@/styles/tokens';

type KpiTone = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple';

const TONE_STYLES: Record<KpiTone, ReturnType<typeof css>> = {
  default:  css`background: ${colors.surface}; border-color: ${colors.border};`,
  primary:  css`background: ${semanticColors.primaryBg}; border-color: ${colors.primary};`,
  success:  css`background: ${semanticColors.successBg}; border-color: ${semanticColors.successBorder};`,
  warning:  css`background: ${semanticColors.warningBg}; border-color: ${semanticColors.warningBorder};`,
  danger:   css`background: ${semanticColors.dangerBg}; border-color: ${semanticColors.dangerBorder};`,
  purple:   css`background: ${semanticColors.purpleBg}; border-color: ${semanticColors.purpleBorder};`,
};

const TONE_VALUE_COLOR: Record<KpiTone, string> = {
  default: colors.textPrimary,
  primary: colors.primary,
  success: semanticColors.successText,
  warning: colors.warning,
  danger:  colors.danger,
  purple:  semanticColors.purpleText,
};

const Grid = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'cols' })<{ cols: number }>`
  display: grid;
  grid-template-columns: repeat(${({ cols }) => cols}, 1fr);
  gap: ${spacing[3]};
  margin-bottom: ${spacing[4]};
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
  @media (max-width: 500px) { grid-template-columns: 1fr; }
`;

const Card = styled.div.withConfig({ shouldForwardProp: (p) => !['tone', 'span2'].includes(p) })<{ tone: KpiTone; span2?: boolean }>`
  border: 1px solid;
  border-radius: ${radius.md};
  padding: 12px 14px;
  ${({ tone }) => TONE_STYLES[tone]}
  ${({ span2 }) => span2 && 'grid-column: span 2;'}
`;

const Label = styled.p`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
`;

const Value = styled.p.withConfig({ shouldForwardProp: (p) => !['tone', 'large'].includes(p) })<{ tone: KpiTone; large?: boolean }>`
  font-size: ${({ large }) => large ? font.size['3xl'] : font.size.xl};
  font-weight: ${font.weight.bold};
  color: ${({ tone }) => TONE_VALUE_COLOR[tone]};
  line-height: 1;
`;

const Sub = styled.p`
  font-size: ${font.size.xs};
  color: ${colors.textMuted};
  margin-top: 3px;
`;

// ─── Public API ───────────────────────────────────────────────────────────────

interface KpiGridProps {
  cols?: number;
  children: React.ReactNode;
  className?: string;
}

export function KpiGrid({ cols = 4, children, className }: KpiGridProps) {
  return <Grid cols={cols} className={className}>{children}</Grid>;
}

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone?: KpiTone;
  span2?: boolean;
  largeValue?: boolean;
  className?: string;
}

export function KpiCard({ label, value, sub, tone = 'default', span2, largeValue, className }: KpiCardProps) {
  return (
    <Card tone={tone} span2={span2} className={className}>
      <Label>{label}</Label>
      <Value tone={tone} large={largeValue}>{value}</Value>
      {sub && <Sub>{sub}</Sub>}
    </Card>
  );
}
