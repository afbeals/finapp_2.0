'use client';

import React from 'react';
import styled from 'styled-components';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatDollarsWhole } from '@/lib/money';
import { MONTH_NAMES_SHORT } from '@/lib/fire';
import { theme } from '@/styles/tokens';

const { colors, font, spacing, radius } = theme;
import type { ExpenseCategory } from '@/types/entities';

// ─── Styled components ────────────────────────────────────────────────────────

const PieScrollTrack = styled.div`
  display: flex;
  gap: ${spacing[4]};
  overflow-x: auto;
  padding-bottom: ${spacing[2]};
  margin-bottom: ${spacing[6]};
  scrollbar-width: thin;
  scrollbar-color: ${colors.border} transparent;
  &::-webkit-scrollbar { height: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 3px; }
`;

const PieCardFixed = styled.div`
  flex-shrink: 0;
  width: 240px;
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: 14px;
`;

const PieCardTitle = styled.p`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${colors.textPrimary};
  margin-bottom: 8px;
  text-align: center;
`;

const PieLegend = styled.div`
  margin-top: 6px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px 6px;
`;

const PieLegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
`;

const PieLegendDot = styled.span.withConfig({
  shouldForwardProp: (p) => p !== 'dotColor',
})<{ dotColor: string }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: ${({ dotColor }) => dotColor};
  flex-shrink: 0;
`;

const PieLegendLabel = styled.span`
  font-size: 9px;
  color: ${colors.textMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReviewSummary {
  id: number;
  periodYear: number;
  periodMonth: number;
  totalIncome: number;
  totalExpenses: number;
}

interface CategoryHistoryRow {
  id: number;
  periodYear: number;
  periodMonth: number;
  totals: Record<number, number>;
}

interface ExpenseCategoryGroup {
  category: ExpenseCategory;
  total: number;
}

interface ExpenseBreakdownScrollProps {
  selectedReviews: ReviewSummary[];
  categoryHistory: CategoryHistoryRow[];
  allCategories: ExpenseCategory[];
  categoryTotals: ExpenseCategoryGroup[];
  currentYear: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExpenseBreakdownScroll({
  selectedReviews,
  categoryHistory,
  allCategories,
  categoryTotals,
  currentYear,
}: ExpenseBreakdownScrollProps) {
  return (
    <PieScrollTrack>
      {selectedReviews.map((r) => {
        const histRow = categoryHistory.find((ch) => ch.id === r.id);
        const catSource = allCategories.length > 0 ? allCategories : categoryTotals.map((c) => c.category);
        const pieData = catSource
          .map((cat) => ({
            name: cat.name,
            value: (histRow?.totals[cat.id] ?? 0) / 100,
            fill: cat.color,
          }))
          .filter((d) => d.value > 0);
        return (
          <PieCardFixed key={r.id}>
            <PieCardTitle>{MONTH_NAMES_SHORT[r.periodMonth - 1]}{r.periodYear !== currentYear ? ` ${r.periodYear}` : ''}</PieCardTitle>
            <PieChart width={212} height={150}>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={65} label={false}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip formatter={(v) => formatDollarsWhole((Number(v) || 0) * 100)} />
            </PieChart>
            <PieLegend>
              {pieData.map((entry, i) => (
                <PieLegendItem key={i} title={entry.name}>
                  <PieLegendDot dotColor={entry.fill} />
                  <PieLegendLabel>{entry.name}</PieLegendLabel>
                </PieLegendItem>
              ))}
            </PieLegend>
          </PieCardFixed>
        );
      })}
    </PieScrollTrack>
  );
}
