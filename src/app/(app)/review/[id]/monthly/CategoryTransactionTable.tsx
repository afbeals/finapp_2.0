'use client';

import React from 'react';
import styled from 'styled-components';
import { Card } from '@/components/ui/Card';
import { formatDollars } from '@/lib/money';
import { colors, semanticColors, font, spacing, radius } from '@/styles/tokens';
import type { ExpenseEntry, IncomeEntry } from '@/types/entities';

// ─── Styled components ────────────────────────────────────────────────────────

const CatTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const CatTh = styled.th`
  padding: 8px ${spacing[4]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-align: left;
  border-bottom: 1px solid ${colors.border};
  background: ${colors.bg};
  &:not(:first-child) { text-align: right; }
`;

const CatTd = styled.td`
  padding: 10px ${spacing[4]};
  font-size: ${font.size.sm};
  color: ${colors.textPrimary};
  border-bottom: 1px solid ${colors.border};
  &:not(:first-child) { text-align: right; font-variant-numeric: tabular-nums; }
`;

const CatHeaderRow = styled.tr.withConfig({
  shouldForwardProp: (p) => p !== 'rowBg',
})<{ rowBg: string }>`
  background: ${({ rowBg }) => rowBg};
  cursor: pointer;
  &:hover { filter: brightness(0.97); }
`;

const CatNameCell = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CatColorBar = styled.span.withConfig({
  shouldForwardProp: (p) => p !== 'barColor',
})<{ barColor: string }>`
  display: inline-block;
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: ${({ barColor }) => barColor};
  flex-shrink: 0;
`;

const CatChevron = styled.span.withConfig({
  shouldForwardProp: (p) => p !== 'open',
})<{ open: boolean }>`
  font-size: 10px;
  color: ${colors.textMuted};
  transform: ${({ open }) => open ? 'rotate(90deg)' : 'rotate(0deg)'};
  transition: transform 150ms ease;
  margin-left: 4px;
`;

const LineItemRow = styled.tr`
  background: ${colors.bg};
  &:hover { background: ${colors.bg}; }
`;

const LineItemTd = styled.td`
  padding: 7px ${spacing[4]} 7px ${spacing[12]};
  font-size: ${font.size.xs};
  color: ${colors.textMuted};
  border-bottom: 1px solid ${colors.border};
  &:not(:first-child) { text-align: right; padding-left: ${spacing[4]}; }
`;

const TrendBadge = styled.span.withConfig({
  shouldForwardProp: (p) => p !== 'dir',
})<{ dir: 'up' | 'down' | 'stable' }>`
  display: inline-block;
  font-size: 10px;
  font-weight: ${font.weight.medium};
  padding: 1px 6px;
  border-radius: ${radius.full};
  margin-left: 6px;
  vertical-align: middle;
  background: ${({ dir }) => dir === 'up' ? colors.dangerLight : dir === 'down' ? semanticColors.successBg : colors.bg};
  color: ${({ dir }) => dir === 'up' ? colors.danger : dir === 'down' ? colors.success : colors.textMuted};
  border: 1px solid ${({ dir }) => dir === 'up' ? semanticColors.dangerBorder : dir === 'down' ? semanticColors.successLightBorder : colors.border};
`;

const SummaryTr = styled.tr.withConfig({
  shouldForwardProp: (p) => !['bg', 'textColor'].includes(p),
})<{ bg: string; textColor: string }>`
  background: ${({ bg }) => bg};
  td { color: ${({ textColor }) => textColor}; font-weight: ${font.weight.bold}; }
`;

// ─── Props ────────────────────────────────────────────────────────────────────

interface CategoryGroup {
  category: { id: number; name: string; color: string; icon: string };
  total: number;
  items: ExpenseEntry[];
}

interface CategoryTransactionTableProps {
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  savingsRate: number;
  categoryTotals: CategoryGroup[];
  expandedCategories: Set<number>;
  setExpandedCategories: React.Dispatch<React.SetStateAction<Set<number>>>;
  incomeExpanded: boolean;
  setIncomeExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  getCategoryTrend: (categoryId: number) => { dir: 'up' | 'down' | 'stable'; pct: number } | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CategoryTransactionTable({
  income,
  expenses,
  totalIncome,
  totalExpenses,
  netFlow,
  savingsRate,
  categoryTotals,
  expandedCategories,
  setExpandedCategories,
  incomeExpanded,
  setIncomeExpanded,
  getCategoryTrend,
}: CategoryTransactionTableProps) {
  function toggleCategory(id: number) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <Card padding="sm">
      <CatTable>
        <thead>
          <tr>
            <CatTh>Category</CatTh>
            <CatTh>Amount</CatTh>
            <CatTh>% of Expenses</CatTh>
          </tr>
        </thead>
        <tbody>
          {/* ── Income row (expandable) ── */}
          <CatHeaderRow rowBg={semanticColors.successBg} onClick={() => setIncomeExpanded((v) => !v)}>
            <CatTd>
              <CatNameCell>
                <CatColorBar barColor={colors.success} />
                💰 Income
                <CatChevron open={incomeExpanded}>▶</CatChevron>
              </CatNameCell>
            </CatTd>
            <CatTd style={{ textAlign: 'right', fontWeight: font.weight.semibold, color: semanticColors.successTextDark }}>
              {formatDollars(totalIncome)}
            </CatTd>
            <CatTd style={{ textAlign: 'right', color: semanticColors.successTextDark }}>—</CatTd>
          </CatHeaderRow>
          {incomeExpanded && income.map((item) => (
            <LineItemRow key={item.id}>
              <LineItemTd>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {item.member && (
                    <span style={{
                      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                      background: item.member.color, flexShrink: 0,
                    }} />
                  )}
                  {item.name}
                  {item.member && (
                    <span style={{ fontSize: '10px', color: colors.textMuted }}>· {item.member.name}</span>
                  )}
                </div>
                {item.notes && (
                  <div style={{ fontSize: '10px', color: colors.textMuted, fontStyle: 'italic', marginTop: 2, paddingLeft: 14 }}>{item.notes}</div>
                )}
              </LineItemTd>
              <LineItemTd style={{ color: semanticColors.successTextDark, fontWeight: 500 }}>{formatDollars(item.amount)}</LineItemTd>
              <LineItemTd style={{ color: colors.textMuted }}>
                {totalIncome > 0 ? `${((item.amount / totalIncome) * 100).toFixed(1)}%` : '—'}
              </LineItemTd>
            </LineItemRow>
          ))}

          {/* ── Expense category rows ── */}
          {categoryTotals.map((c) => {
            const isOpen = expandedCategories.has(c.category.id);
            const rowBg = c.category.color + '12';
            const trend = getCategoryTrend(c.category.id);
            return (
              <React.Fragment key={c.category.id}>
                <CatHeaderRow rowBg={rowBg} onClick={() => toggleCategory(c.category.id)}>
                  <CatTd>
                    <CatNameCell>
                      <CatColorBar barColor={c.category.color} />
                      {c.category.icon} {c.category.name}
                      <CatChevron open={isOpen}>▶</CatChevron>
                    </CatNameCell>
                  </CatTd>
                  <CatTd style={{ textAlign: 'right', fontWeight: font.weight.semibold }}>
                    {formatDollars(c.total)}
                    {trend && (
                      <TrendBadge dir={trend.dir}>
                        {trend.dir === 'up' ? '↑' : trend.dir === 'down' ? '↓' : '→'}{' '}
                        {trend.dir === 'stable' ? 'Stable' : `${trend.pct > 0 ? '+' : ''}${trend.pct}%`}
                      </TrendBadge>
                    )}
                  </CatTd>
                  <CatTd style={{ textAlign: 'right' }}>
                    {totalExpenses > 0 ? `${((c.total / totalExpenses) * 100).toFixed(1)}%` : '—'}
                  </CatTd>
                </CatHeaderRow>

                {isOpen && c.items.map((item) => (
                  <LineItemRow key={item.id}>
                    <LineItemTd>
                      <div>{item.name}</div>
                      {item.notes && (
                        <div style={{ fontSize: '10px', color: colors.textMuted, fontStyle: 'italic', marginTop: 2 }}>{item.notes}</div>
                      )}
                    </LineItemTd>
                    <LineItemTd>{formatDollars(item.amount)}</LineItemTd>
                    <LineItemTd>{totalExpenses > 0 ? `${((item.amount / totalExpenses) * 100).toFixed(1)}%` : '—'}</LineItemTd>
                  </LineItemRow>
                ))}
              </React.Fragment>
            );
          })}
          {categoryTotals.length === 0 && (
            <tr><CatTd colSpan={3} style={{ color: colors.textMuted }}>No expenses recorded.</CatTd></tr>
          )}
        </tbody>
        <tfoot>
          <SummaryTr bg={colors.navbar} textColor={colors.surface}>
            <CatTd>💸 Total Expenses</CatTd>
            <CatTd>{formatDollars(totalExpenses)}</CatTd>
            <CatTd>100%</CatTd>
          </SummaryTr>
          <SummaryTr bg={colors.primaryLight} textColor={netFlow >= 0 ? semanticColors.successTextDark : colors.danger}>
            <CatTd>📈 Net Savings</CatTd>
            <CatTd>{formatDollars(netFlow)}</CatTd>
            <CatTd>{totalIncome > 0 ? `${(savingsRate * 100).toFixed(1)}%` : '—'}</CatTd>
          </SummaryTr>
        </tfoot>
      </CatTable>
    </Card>
  );
}
