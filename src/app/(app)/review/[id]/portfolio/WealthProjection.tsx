'use client';

import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { formatDollarsWhole, toCents, toDollars, toNumber } from '@/lib/money';
import { MONTH_NAMES_SHORT } from '@/lib/fire';
import { colors, semanticColors, font, spacing, radius } from '@/styles/tokens';
import { PanelCard, PanelHead, PanelTitle, PanelSubtitle } from '@/components/ui/Card';

// ─── Styled components ────────────────────────────────────────────────────────

const ProjectionInputsBar = styled.div`
  background: ${semanticColors.surfaceMuted};
  border-bottom: 1px solid ${colors.border};
  padding: 14px 18px;
  display: flex; gap: ${spacing[4]}; flex-wrap: wrap; align-items: flex-end;
`;
const ProjInputGroup = styled.div`display: flex; flex-direction: column; gap: 4px; min-width: 130px;`;
const ProjLabel = styled.label`font-size: ${font.size.xs}; font-weight: ${font.weight.semibold}; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.04em;`;
const ProjInput = styled.input`
  padding: 6px 10px; font-size: ${font.size.sm}; font-family: inherit;
  border: 1px solid ${colors.border}; border-radius: ${radius.md};
  background: ${colors.surface}; color: ${colors.textPrimary}; outline: none; width: 100%;
  &:focus { border-color: ${colors.primary}; box-shadow: 0 0 0 2px #BFDBFE; }
`;
const EndYearBadge = styled.div`
  padding: 6px 16px; background: ${colors.primary}; color: ${colors.surface};
  border-radius: ${radius.md}; font-size: ${font.size.sm}; font-weight: ${font.weight.bold};
  align-self: flex-end; line-height: 1.5;
`;
const ProjectionChartArea = styled.div`
  display: grid;
  grid-template-columns: 1fr 200px;
  @media (max-width: 800px) { grid-template-columns: 1fr; }
`;
const MonthlyValuesPanel = styled.div`
  border-left: 1px solid ${colors.border};
  overflow-y: auto;
  max-height: 300px;
`;
const MonthlyValuesHeader = styled.div`
  padding: 10px 14px 8px;
  font-size: ${font.size.xs}; font-weight: ${font.weight.bold};
  color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.05em;
  border-bottom: 1px solid ${colors.border};
  position: sticky; top: 0; background: ${colors.surface}; z-index: 1;
`;
const MonthlyValueRow = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'highlight' })<{ highlight?: boolean }>`
  padding: 7px 14px;
  background: ${({ highlight }) => highlight ? semanticColors.infoBg : colors.surface};
  border-bottom: 1px solid ${colors.border};
  display: flex; justify-content: space-between; align-items: center;
  &:last-child { border-bottom: none; }
`;
const MonthRowLabel = styled.span`font-size: ${font.size.xs}; color: ${colors.textMuted};`;
const MonthRowValue = styled.span`font-size: ${font.size.xs}; font-weight: ${font.weight.semibold}; color: ${colors.textPrimary};`;


// ─── Props ────────────────────────────────────────────────────────────────────

interface WealthProjectionProps {
  totalPortfolioValue: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WealthProjection({ totalPortfolioValue }: WealthProjectionProps) {
  const [projStarting, setProjStarting] = useState('');
  const [projMonthly, setProjMonthly] = useState('0');
  const [projRate, setProjRate] = useState('4.75');
  const [projMonths, setProjMonths] = useState('36');
  const [projData, setProjData] = useState<{ month: string; value: number }[]>([]);
  const [projEndYear, setProjEndYear] = useState(new Date().getFullYear() + 2);

  const computeProjection = useCallback((starting: string, monthly: string, rate: string, months: string) => {
    const startCents = toCents(toNumber(starting));
    const monthlyCents = toCents(toNumber(monthly));
    const annualRate = toNumber(rate) / 100;
    const numMonths = Math.floor(toNumber(months, 12));
    const r = annualRate / 12;
    const rows: { month: string; value: number }[] = [];
    let balance = startCents;
    const now = new Date();
    for (let i = 1; i <= numMonths; i++) {
      balance = Math.round(balance * (1 + r) + monthlyCents);
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      rows.push({ month: `${MONTH_NAMES_SHORT[d.getMonth()]} ${d.getFullYear()}`, value: balance });
    }
    setProjData(rows);
    if (rows.length > 0) {
      const lastDate = new Date(now.getFullYear(), now.getMonth() + numMonths, 1);
      setProjEndYear(lastDate.getFullYear());
    }
  }, []);

  // Init projection starting amount from portfolio total once loaded
  useEffect(() => {
    if (totalPortfolioValue > 0 && projStarting === '') {
      setProjStarting(toDollars(totalPortfolioValue).toFixed(2));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPortfolioValue]);

  // Recompute whenever inputs change
  useEffect(() => {
    if (projStarting !== '') {
      computeProjection(projStarting, projMonthly, projRate, projMonths);
    }
  }, [projStarting, projMonthly, projRate, projMonths, computeProjection]);

  return (
    <PanelCard mb={spacing[6]}>
      <PanelHead>
        <div>
          <PanelTitle>Wealth Projections</PanelTitle>
          <PanelSubtitle>Compound growth calculator</PanelSubtitle>
        </div>
      </PanelHead>

      <ProjectionInputsBar>
        <ProjInputGroup>
          <ProjLabel>Starting Amount</ProjLabel>
          <ProjInput
            type="number" value={projStarting}
            onChange={(e) => setProjStarting(e.target.value)}
          />
        </ProjInputGroup>
        <ProjInputGroup>
          <ProjLabel>Monthly Contribution</ProjLabel>
          <ProjInput
            type="number" value={projMonthly}
            onChange={(e) => setProjMonthly(e.target.value)}
          />
        </ProjInputGroup>
        <ProjInputGroup>
          <ProjLabel>Interest Rate (%)</ProjLabel>
          <ProjInput
            type="number" step="0.01" value={projRate}
            onChange={(e) => setProjRate(e.target.value)}
          />
        </ProjInputGroup>
        <ProjInputGroup>
          <ProjLabel>Timespan (months)</ProjLabel>
          <ProjInput
            type="number" value={projMonths}
            onChange={(e) => setProjMonths(e.target.value)}
          />
        </ProjInputGroup>
        <EndYearBadge>{projEndYear}</EndYearBadge>
      </ProjectionInputsBar>

      <ProjectionChartArea>
        <div style={{ padding: '16px 8px 8px 0' }}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={projData.map((d, i) => ({ ...d, index: i }))} margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => v.split(' ')[0]}
                interval={Math.max(0, Math.floor(projData.length / 8) - 1)}
              />
              <YAxis tickFormatter={(v) => `$${(v / 100000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={48} />
              <Tooltip
                formatter={(v) => formatDollarsWhole(Number(v))}
                labelFormatter={(l) => projData[l as number]?.month ?? l}
              />
              <Line type="monotone" dataKey="value" stroke={colors.primary} strokeWidth={2} dot={false} name="Value" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <MonthlyValuesPanel>
          <MonthlyValuesHeader>Monthly Values</MonthlyValuesHeader>
          {projData.map((row, i) => (
            <MonthlyValueRow key={i} highlight={i === 0}>
              <MonthRowLabel>{row.month}</MonthRowLabel>
              <MonthRowValue>{formatDollarsWhole(row.value)}</MonthRowValue>
            </MonthlyValueRow>
          ))}
          {projData.length === 0 && (
            <MonthlyValueRow>
              <MonthRowLabel style={{ color: colors.textMuted, fontStyle: 'italic' }}>No data yet</MonthRowLabel>
            </MonthlyValueRow>
          )}
        </MonthlyValuesPanel>
      </ProjectionChartArea>
    </PanelCard>
  );
}
