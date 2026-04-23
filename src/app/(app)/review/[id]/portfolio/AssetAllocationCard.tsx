'use client';

import React, { useMemo } from 'react';
import styled from 'styled-components';
import { PieChart, Pie, Cell } from 'recharts';
import { formatDollarsWhole } from '@/lib/money';
import { theme } from '@/styles/tokens';

const { colors, font, radius } = theme;
import { PanelCard, PanelHead, PanelTitle, PanelSubtitle, PanelBody } from '@/components/ui/Card';

// ─── Styled components ────────────────────────────────────────────────────────

const AllocationRow = styled.div`display: flex; align-items: center; gap: 12px; margin-bottom: 10px; &:last-child { margin-bottom: 0; }`;
const AllocationLabel = styled.span`flex: 1; font-size: ${font.size.sm}; font-weight: ${font.weight.medium}; color: ${colors.textPrimary};`;
const AllocationBar = styled.div.withConfig({ shouldForwardProp: (p) => !['pct','barColor'].includes(p) })<{ pct: number; barColor: string }>`
  flex: 2; height: 6px; background: ${colors.border}; border-radius: ${radius.full}; overflow: hidden;
  &::after { content: ''; display: block; height: 100%; width: ${({ pct }) => pct}%; background: ${({ barColor }) => barColor}; border-radius: ${radius.full}; }
`;
const AllocationValue = styled.span`font-size: ${font.size.sm}; font-weight: ${font.weight.semibold}; color: ${colors.textPrimary}; min-width: 80px; text-align: right;`;
const AllocationPct = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'tc' })<{ tc: string }>`
  font-size: ${font.size.xs}; color: ${({ tc }) => tc}; min-width: 46px; text-align: right;
`;

// ─── Props ────────────────────────────────────────────────────────────────────

interface AllocationItem {
  label: string;
  value: number;
  color: string;
}

interface AssetAllocationCardProps {
  allocationItems: AllocationItem[];
  netWorth: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AssetAllocationCard({ allocationItems, netWorth }: AssetAllocationCardProps) {
  const allocationTotal = allocationItems.reduce((s, a) => s + a.value, 0);
  const pieData = useMemo(
    () => allocationItems.map((a) => ({ name: a.label, value: a.value, fill: a.color })),
    [allocationItems],
  );

  return (
    <PanelCard>
      <PanelHead>
        <div>
          <PanelTitle>Asset Allocation</PanelTitle>
          <PanelSubtitle>Portfolio breakdown by asset type</PanelSubtitle>
        </div>
      </PanelHead>
      <PanelBody>
        {/* Donut centered */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ position: 'relative' }}>
            <PieChart width={180} height={180}>
              <Pie data={pieData.length > 0 ? pieData : [{ name: 'empty', value: 1, fill: colors.border }]} dataKey="value" cx="50%" cy="50%" innerRadius={58} outerRadius={85} paddingAngle={2} label={false}>
                {(pieData.length > 0 ? pieData : [{ fill: colors.border }]).map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
            </PieChart>
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              fontSize: font.size.sm, fontWeight: font.weight.bold, color: colors.textPrimary,
            }}>
              <span>{formatDollarsWhole(allocationTotal > 0 ? allocationTotal : netWorth)}</span>
              <span style={{ fontSize: font.size.micro, color: colors.textMuted, fontWeight: 'normal' }}>Total</span>
            </div>
          </div>
        </div>
        {/* Legend below chart */}
        <div>
          {allocationItems.map((item) => {
            const pct = allocationTotal > 0 ? (item.value / allocationTotal) * 100 : 0;
            return (
              <AllocationRow key={item.label}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                <AllocationLabel>{item.label}</AllocationLabel>
                <div style={{ flex: 2 }}>
                  <AllocationBar pct={pct} barColor={item.color} />
                </div>
                <AllocationValue>{formatDollarsWhole(item.value)}</AllocationValue>
                <AllocationPct tc={item.color}>{pct.toFixed(2)}%</AllocationPct>
              </AllocationRow>
            );
          })}
          {allocationItems.length === 0 && (
            <p style={{ color: colors.textMuted, fontSize: font.size.sm, fontStyle: 'italic', textAlign: 'center' }}>
              No investment or savings data for this review.
            </p>
          )}
        </div>
      </PanelBody>
    </PanelCard>
  );
}
