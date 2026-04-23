'use client';

import React from 'react';
import { Grid, Card, Label, Value, Sub, type KpiTone } from './KpiGrid.styles';

interface KpiGridProps {
  cols?: number;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function KpiGrid({ cols = 4, children, className, style }: KpiGridProps) {
  return <Grid cols={cols} className={className} style={style}>{children}</Grid>;
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
