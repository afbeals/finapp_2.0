'use client';

import React from 'react';
import styled from 'styled-components';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid, Legend,
} from 'recharts';
import { Card, CardTitle } from '@/components/ui/Card';
import { formatDollarsWhole } from '@/lib/money';
import { theme } from '@/styles/tokens';

const { colors, spacing } = theme;

// ─── Styled components ────────────────────────────────────────────────────────

const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing[5]};
  margin-bottom: ${spacing[6]};
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`;

// ─── Props ────────────────────────────────────────────────────────────────────

interface TrendDataPoint {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface TrendChartsProps {
  trendData: TrendDataPoint[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TrendCharts({ trendData }: TrendChartsProps) {
  return (
    <ChartsRow>
      <Card padding="md">
        <CardTitle style={{ marginBottom: spacing[3] }}>Income vs Expenses</CardTitle>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={44} />
            <Tooltip formatter={(v) => formatDollarsWhole((Number(v) || 0) * 100)} />
            <Line type="monotone" dataKey="income" stroke={colors.success} strokeWidth={2} dot={{ r: 4 }} name="Income" />
            <Line type="monotone" dataKey="expenses" stroke={colors.danger} strokeWidth={2} dot={{ r: 4 }} name="Expenses" />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card padding="md">
        <CardTitle style={{ marginBottom: spacing[3] }}>Monthly Net Savings</CardTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={trendData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={44} />
            <Tooltip formatter={(v) => formatDollarsWhole((Number(v) || 0) * 100)} />
            <Bar dataKey="net" radius={[4, 4, 0, 0]} name="Net Savings">
              {trendData.map((entry, i) => (
                <Cell key={i} fill={entry.net >= 0 ? colors.success : colors.danger} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </ChartsRow>
  );
}
