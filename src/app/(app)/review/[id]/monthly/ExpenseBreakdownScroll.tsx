'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatDollarsWhole } from '@/lib/money';
import { MONTH_NAMES_SHORT } from '@/lib/fire';
import type { ExpenseCategory } from '@/types/entities';
import {
  PieScrollTrack, PieCardFixed, PieCardTitle, PieLegend, PieLegendItem, PieLegendDot, PieLegendLabel,
} from './ExpenseBreakdownScroll.styles';

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
