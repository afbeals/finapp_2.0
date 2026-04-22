'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import styled from 'styled-components';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, CartesianGrid, Legend,
} from 'recharts';
import { StepShell } from '@/components/review/StepShell';
import { Card, CardTitle } from '@/components/ui/Card';
import { useStepNav } from '@/lib/useStepNav';
import { useReviewStore } from '@/lib/store';
import { formatDollars, formatDollarsWhole } from '@/lib/money';
import { MONTH_NAMES_SHORT } from '@/lib/fire';
import { getReviewIncome, getReviewExpenses, getExpenseCategories, apiGet } from '@/lib/api';
import { colors, semanticColors, font, spacing, radius } from '@/styles/tokens';
import { LoadingState } from '@/components/shared/LoadingState';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { KpiGrid, KpiCard } from '@/components/shared/KpiGrid';
import type { ExpenseCategory, ExpenseEntry, IncomeEntry } from '@/types/entities';


type Category = ExpenseCategory;

interface ReviewSummary {
  id: number;
  periodYear: number;
  periodMonth: number;
  totalIncome: number;
  totalExpenses: number;
}
interface CategoryHistoryRow { id: number; periodYear: number; periodMonth: number; totals: Record<number, number> }

// (KpiGrid/KpiCard and SectionHeader imported from shared)

// ─── Charts row ───────────────────────────────────────────────────────────────

const ChartsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing[5]};
  margin-bottom: ${spacing[6]};
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`;

// ─── Month selector ───────────────────────────────────────────────────────────

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

// ─── Horizontal scroll pie charts ────────────────────────────────────────────

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

// ─── Expandable category table ────────────────────────────────────────────────

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
  padding: 7px ${spacing[4]} 7px 48px;
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function MonthlySummaryPage() {
  const params = useParams();
  const reviewId = params.id as string;
  const { state: reviewState } = useReviewStore();
  const { goNext, goBack, goSkip, saving } = useStepNav('monthly');
  const readOnly = reviewState.activeReview?.status === 'COMPLETE' && !reviewState.isEditMode;

  const [income, setIncome] = useState<IncomeEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allReviews, setAllReviews] = useState<ReviewSummary[]>([]);
  const [categoryHistory, setCategoryHistory] = useState<CategoryHistoryRow[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [incomeExpanded, setIncomeExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getReviewIncome(reviewId),
      getReviewExpenses(reviewId),
      apiGet<{ reviews: ReviewSummary[] }>('/api/reviews'),
      apiGet<{ byReview: CategoryHistoryRow[] }>('/api/reviews/category-totals'),
      getExpenseCategories(),
    ]).then(([inc, exp, allData, catData, catConfig]) => {
      setIncome(inc.entries ?? []);
      setExpenses(exp.entries ?? []);
      setAllCategories(catConfig.categories ?? []);
      const reviews: ReviewSummary[] = (allData.reviews ?? [])
        .filter((r: ReviewSummary) => r.totalIncome > 0 || r.totalExpenses > 0)
        .sort((a: ReviewSummary, b: ReviewSummary) =>
          a.periodYear !== b.periodYear ? a.periodYear - b.periodYear : a.periodMonth - b.periodMonth
        );
      setAllReviews(reviews);
      setSelectedMonths(reviews.map((r) => r.id));
      setCategoryHistory(catData.byReview ?? []);
    }).finally(() => setLoading(false));
  }, [reviewId]);

  function getCategoryTrend(categoryId: number): { dir: 'up' | 'down' | 'stable'; pct: number } | null {
    const currentReviewId = Number(reviewId);
    const sorted = [...categoryHistory].sort((a, b) =>
      a.periodYear !== b.periodYear ? a.periodYear - b.periodYear : a.periodMonth - b.periodMonth
    );
    const currentIdx = sorted.findIndex((r) => r.id === currentReviewId);
    if (currentIdx < 1) return null;
    const prev = sorted[currentIdx - 1].totals[categoryId] ?? 0;
    const curr = sorted[currentIdx].totals[categoryId] ?? 0;
    if (prev === 0 || curr === 0) return null;
    const pct = Math.round(((curr - prev) / prev) * 100);
    if (Math.abs(pct) < 2) return { dir: 'stable', pct: 0 };
    return { dir: pct > 0 ? 'up' : 'down', pct };
  }

  const totalIncome = income.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netFlow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? netFlow / totalIncome : 0;

  const completedReviews = allReviews.filter((r) => r.totalIncome > 0 || r.totalExpenses > 0);
  const monthsCount = completedReviews.length || 1;
  const totalIncomeAll = completedReviews.reduce((s, r) => s + r.totalIncome, 0);
  const totalExpensesAll = completedReviews.reduce((s, r) => s + r.totalExpenses, 0);
  const avgExpenses = totalExpensesAll / monthsCount;
  const avgNet = (totalIncomeAll - totalExpensesAll) / monthsCount;
  const annualPace = avgNet * 12;

  const trendData = completedReviews.map((r) => ({
    month: MONTH_NAMES_SHORT[r.periodMonth - 1],
    income: r.totalIncome / 100,
    expenses: r.totalExpenses / 100,
    net: (r.totalIncome - r.totalExpenses) / 100,
  }));

  // Group expenses by category, keeping line items
  const byCategory = expenses.reduce<Record<number, { category: Category; total: number; items: ExpenseEntry[] }>>((acc, e) => {
    const cid = e.category.id;
    if (!acc[cid]) acc[cid] = { category: e.category, total: 0, items: [] };
    acc[cid].total += e.amount;
    acc[cid].items.push(e);
    return acc;
  }, {});
  const categoryTotals = Object.values(byCategory).sort((a, b) => b.total - a.total);

  const selectedReviews = allReviews.filter((r) => selectedMonths.includes(r.id));

  function toggleMonth(id: number) {
    setSelectedMonths((prev) => prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]);
  }

  function toggleCategory(id: number) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (loading) return <LoadingState centered />;

  const currentYear = reviewState.activeReview?.periodYear ?? new Date().getFullYear();

  return (
    <StepShell
      title="Monthly Summary"
      subtitle="Review spending patterns • Select months to compare"
      stepName="Monthly Summary"
      onBack={goBack}
      onSkip={goSkip}
      onNext={goNext}
      saving={saving}
      readOnly={readOnly}
    >
      {/* ── Yearly KPI cards ── */}
      <SectionHeader title={`${currentYear} Yearly Summary`} />

      <KpiGrid cols={4}>
        <KpiCard
          tone="success"
          label="Total Income"
          value={formatDollarsWhole(totalIncomeAll)}
          sub={`▲ ${monthsCount} month${monthsCount !== 1 ? 's' : ''} data`}
        />
        <KpiCard
          tone="danger"
          label="Total Expenses"
          value={formatDollarsWhole(totalExpensesAll)}
          sub={`~${formatDollarsWhole(avgExpenses)}/mo avg`}
        />
        <KpiCard
          tone="primary"
          label="Net Savings"
          value={formatDollarsWhole(totalIncomeAll - totalExpensesAll)}
          sub={totalIncomeAll > 0 ? `✓ ${((1 - totalExpensesAll / totalIncomeAll) * 100).toFixed(0)}% savings rate` : '—'}
        />
        <KpiCard
          label="Avg Net / Month"
          value={`${formatDollarsWhole(avgNet)}/mo`}
          sub={`→ ${formatDollarsWhole(annualPace)}/yr pace`}
        />
      </KpiGrid>

      {/* ── Trend charts ── */}
      <SectionHeader title="Yearly Trends" />

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

      {/* ── Month selector ── */}
      <MonthSelectorCard>
        <MonthSelectorTop>
          <MonthSelectorLabel>Select Months to Compare</MonthSelectorLabel>
          <MonthSelectorActions>
            <MonthActionBtn primary onClick={() => setSelectedMonths(allReviews.map((r) => r.id))}>
              Select All
            </MonthActionBtn>
            <MonthActionBtn onClick={() => setSelectedMonths([])}>
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

      {/* ── Pie charts — horizontal scroll ── */}
      {selectedReviews.length > 0 && (
        <>
          <SectionHeader title="Expense Breakdown by Month" />
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
        </>
      )}

      {/* ── Expandable category breakdown ── */}
      <SectionHeader title="Transactions by Category" />

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
    </StepShell>
  );
}
