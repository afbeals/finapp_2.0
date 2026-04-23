'use client';

import React from 'react';
import { MONTH_NAMES_SHORT } from '@/lib/fire';
import { theme } from '@/styles/tokens';

const { colors, font } = theme;
import {
  MonthSelectorCard, MonthSelectorTop, MonthSelectorLabel, MonthSelectorActions,
  MonthActionBtn, MonthPills, MonthPill,
} from './MonthSelector.styles';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReviewSummary {
  id: number;
  periodYear: number;
  periodMonth: number;
  totalIncome: number;
  totalExpenses: number;
}

interface MonthSelectorProps {
  allReviews: ReviewSummary[];
  selectedMonths: number[];
  currentYear: number;
  toggleMonth: (id: number) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MonthSelector({
  allReviews,
  selectedMonths,
  currentYear,
  toggleMonth,
  onSelectAll,
  onClear,
}: MonthSelectorProps) {
  return (
    <MonthSelectorCard>
      <MonthSelectorTop>
        <MonthSelectorLabel>Select Months to Compare</MonthSelectorLabel>
        <MonthSelectorActions>
          <MonthActionBtn primary onClick={onSelectAll}>
            Select All
          </MonthActionBtn>
          <MonthActionBtn onClick={onClear}>
            Clear
          </MonthActionBtn>
        </MonthSelectorActions>
      </MonthSelectorTop>
      <MonthPills>
        {allReviews.map((r) => (
          <MonthPill
            key={r.id}
            selected={selectedMonths.includes(r.id)}
            onClick={() => toggleMonth(r.id)}
          >
            {selectedMonths.includes(r.id) ? '✓ ' : ''}{MONTH_NAMES_SHORT[r.periodMonth - 1]}{r.periodYear !== currentYear ? ` ${r.periodYear}` : ''}
          </MonthPill>
        ))}
        {allReviews.length === 0 && (
          <span style={{ fontSize: font.size.sm, color: colors.textMuted }}>No completed reviews yet.</span>
        )}
      </MonthPills>
    </MonthSelectorCard>
  );
}
