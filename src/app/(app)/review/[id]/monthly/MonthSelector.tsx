'use client';

import React from 'react';
import styled from 'styled-components';
import { MONTH_NAMES_SHORT } from '@/lib/fire';
import { theme } from '@/styles/tokens';

const { colors, font, spacing, radius } = theme;

// ─── Styled components ────────────────────────────────────────────────────────

const MonthSelectorCard = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: 14px 16px;
  margin-bottom: ${spacing[6]};
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`;

const MonthSelectorTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const MonthSelectorLabel = styled.p`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const MonthSelectorActions = styled.div`
  display: flex;
  gap: ${spacing[2]};
`;

const MonthActionBtn = styled.button.withConfig({
  shouldForwardProp: (p) => p !== 'primary',
})<{ primary?: boolean }>`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  padding: 3px 10px;
  border-radius: ${radius.full};
  cursor: pointer;
  border: 1px solid ${({ primary }) => primary ? colors.primary : colors.border};
  background: ${({ primary }) => primary ? colors.primaryLight : colors.surface};
  color: ${({ primary }) => primary ? colors.primary : colors.textMuted};
  &:hover { opacity: 0.8; }
`;

const MonthPills = styled.div`
  display: flex;
  gap: ${spacing[2]};
  flex-wrap: wrap;
`;

const MonthPill = styled.button.withConfig({
  shouldForwardProp: (p) => p !== 'selected',
})<{ selected: boolean }>`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  padding: 5px 12px;
  border-radius: ${radius.full};
  cursor: pointer;
  border: 1px solid ${({ selected }) => selected ? colors.primary : colors.borderStrong};
  background: ${({ selected }) => selected ? colors.primary : colors.surface};
  color: ${({ selected }) => selected ? colors.surface : colors.textMuted};
  transition: all 100ms ease;
  &:hover { opacity: 0.85; }
`;

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
