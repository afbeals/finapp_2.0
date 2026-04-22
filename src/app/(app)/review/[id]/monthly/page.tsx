'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StepShell } from '@/components/review/StepShell';
import { useStepNav } from '@/lib/useStepNav';
import { useReviewStore } from '@/lib/store';
import { formatDollarsWhole } from '@/lib/money';
import { MONTH_NAMES_SHORT } from '@/lib/fire';
import { getReviewIncome, getReviewExpenses, getExpenseCategories, apiGet } from '@/lib/api';
import { LoadingState } from '@/components/shared/LoadingState';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { KpiGrid, KpiCard } from '@/components/shared/KpiGrid';
import type { ExpenseCategory, ExpenseEntry, IncomeEntry } from '@/types/entities';
import { TrendCharts } from './TrendCharts';
import { MonthSelector } from './MonthSelector';
import { ExpenseBreakdownScroll } from './ExpenseBreakdownScroll';
import { CategoryTransactionTable } from './CategoryTransactionTable';


type Category = ExpenseCategory;

interface ReviewSummary {
  id: number;
  periodYear: number;
  periodMonth: number;
  totalIncome: number;
  totalExpenses: number;
}
interface CategoryHistoryRow { id: number; periodYear: number; periodMonth: number; totals: Record<number, number> }

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
      <TrendCharts trendData={trendData} />

      {/* ── Month selector ── */}
      <MonthSelector
        allReviews={allReviews}
        selectedMonths={selectedMonths}
        currentYear={currentYear}
        toggleMonth={toggleMonth}
        onSelectAll={() => setSelectedMonths(allReviews.map((r) => r.id))}
        onClear={() => setSelectedMonths([])}
      />

      {/* ── Pie charts — horizontal scroll ── */}
      {selectedReviews.length > 0 && (
        <>
          <SectionHeader title="Expense Breakdown by Month" />
          <ExpenseBreakdownScroll
            selectedReviews={selectedReviews}
            categoryHistory={categoryHistory}
            allCategories={allCategories}
            categoryTotals={categoryTotals}
            currentYear={currentYear}
          />
        </>
      )}

      {/* ── Expandable category breakdown ── */}
      <SectionHeader title="Transactions by Category" />
      <CategoryTransactionTable
        income={income}
        expenses={expenses}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        netFlow={netFlow}
        savingsRate={savingsRate}
        categoryTotals={categoryTotals}
        expandedCategories={expandedCategories}
        setExpandedCategories={setExpandedCategories}
        incomeExpanded={incomeExpanded}
        setIncomeExpanded={setIncomeExpanded}
        getCategoryTrend={getCategoryTrend}
      />
    </StepShell>
  );
}
