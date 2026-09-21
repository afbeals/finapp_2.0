'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { StepShell } from '@/components/review/StepShell';
import { STEP_META } from '@/components/review/stepMetadata';
import { useStepNav } from '@/lib/useStepNav';
import { useReviewStore, useSessionStore } from '@/lib/store';
import { formatDollars, toCents } from '@/lib/money';
import {
  getReviewExpenses, getReviewIncome, getExpenseCategories,
  deleteIncomeEntry, deleteExpenseEntry, apiPatch,
} from '@/lib/api';
import { theme } from '@/styles/tokens';

const { colors, semanticColors, font, spacing } = theme;
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Button } from '@/components/ui/Button';
import { IncomeAccordion } from './IncomeAccordion';
import { CategoryAccordion } from './CategoryAccordion';
import { CopyFromPreviousMonthModal } from './CopyFromPreviousMonthModal';
import type { ExpenseCategory as Category, ExpenseEntry, IncomeEntry } from '@/types/entities';
import { GroupSeparator, SummaryBar, SummaryLabel, SummaryValue } from './ExpensePage.styles';

export default function ExpensePage() {
  const params = useParams();
  const reviewId = params.id as string;
  const { state: reviewState } = useReviewStore();
  const { state: sessionState } = useSessionStore();
  const { goNext, saving } = useStepNav('expense');
  const readOnly = reviewState.activeReview?.status === 'COMPLETE' && !reviewState.isEditMode;
  const currentMemberId = sessionState.memberId;
  const currentMember = sessionState.members.find((m) => m.id === currentMemberId);

  const [income, setIncome] = useState<IncomeEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);

  useEffect(() => {
    Promise.all([
      getReviewIncome(reviewId),
      getReviewExpenses(reviewId),
      getExpenseCategories(),
    ]).then(([incData, expData, catData]) => {
      setIncome(incData.entries ?? []);
      setExpenses(expData.entries ?? []);
      setCategories(catData.categories ?? []);
    }).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, [reviewId]);

  const handleUpdateIncome = useCallback(async (id: number, field: 'name' | 'notes' | 'amount', value: string) => {
    const payload = field === 'amount' ? { amount: toCents(parseFloat(value)) } : { [field]: value };
    const data = await apiPatch<{ entry: IncomeEntry }>(`/api/reviews/${reviewId}/income/${id}`, payload);
    setIncome((prev) => prev.map((e) => e.id === id ? { ...e, ...data.entry } : e));
  }, [reviewId]);

  const handleUpdateExpense = useCallback(async (id: number, field: 'name' | 'notes' | 'amount', value: string) => {
    const payload = field === 'amount' ? { amount: toCents(parseFloat(value)) } : { [field]: value };
    const data = await apiPatch<{ entry: ExpenseEntry }>(`/api/reviews/${reviewId}/expenses/${id}`, payload);
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, ...data.entry } : e));
  }, [reviewId]);

  const handleDeleteIncome = useCallback(async (id: number) => {
    try {
      await deleteIncomeEntry(reviewId, id);
      setIncome((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // deletion failed — leave entry in place
    }
  }, [reviewId]);

  const handleDeleteExpense = useCallback(async (id: number) => {
    try {
      await deleteExpenseEntry(reviewId, id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // deletion failed — leave entry in place
    }
  }, [reviewId]);

  const totalIncome = useMemo(() => income.reduce((s, e) => s + e.amount, 0), [income]);
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const netSavings = useMemo(() => totalIncome - totalExpenses, [totalIncome, totalExpenses]);

  if (loading) return <LoadingState centered />;
  if (loadError) return <ErrorState centered message="Couldn't load expense data — please refresh." />;

  return (
    <StepShell
      title={STEP_META.expense.title}
      subtitle={STEP_META.expense.subtitle}
      onNext={goNext}
      saving={saving}
      readOnly={readOnly}
      extraActions={!readOnly && (
        <Button variant="secondary" size="sm" onClick={() => setShowCopyModal(true)}>
          📋 Copy from Previous Month
        </Button>
      )}
    >
      {showCopyModal && reviewState.activeReview && (
        <CopyFromPreviousMonthModal
          reviewId={reviewId}
          periodYear={reviewState.activeReview.periodYear}
          periodMonth={reviewState.activeReview.periodMonth}
          currentMemberId={currentMemberId}
          onClose={() => setShowCopyModal(false)}
          onCopied={({ income: newIncome, expenses: newExpenses }) => {
            setIncome((prev) => [...prev, ...newIncome]);
            setExpenses((prev) => [...prev, ...newExpenses]);
          }}
        />
      )}

      <IncomeAccordion
        entries={income}
        members={sessionState.members}
        reviewId={reviewId}
        readOnly={readOnly}
        currentMemberId={currentMemberId}
        onAdd={(e) => setIncome((prev) => [...prev, e])}
        onDelete={handleDeleteIncome}
        onUpdate={handleUpdateIncome}
      />

      <GroupSeparator />

      {categories.map((cat) => (
        <CategoryAccordion
          key={cat.id}
          category={cat}
          entries={expenses.filter((e) => e.category.id === cat.id)}
          reviewId={reviewId}
          readOnly={readOnly}
          currentMemberId={currentMemberId}
          currentMember={currentMember}
          onAdd={(e) => setExpenses((prev) => [...prev, e])}
          onDelete={handleDeleteExpense}
          onUpdate={handleUpdateExpense}
        />
      ))}

      <div style={{ marginTop: spacing[6] }}>
        <SummaryBar bg={colors.navbar} borderColor={colors.navbar}>
          <SummaryLabel textColor={colors.surface}>💸 TOTAL EXPENSES</SummaryLabel>
          <SummaryValue textColor={colors.surface}>{formatDollars(totalExpenses)}</SummaryValue>
        </SummaryBar>
        <SummaryBar bg={semanticColors.successBg} borderColor={colors.success}>
          <SummaryLabel textColor={semanticColors.successTextDark}>💰 INCOME SUMMARY</SummaryLabel>
          <SummaryValue textColor={semanticColors.successTextDark}>{formatDollars(totalIncome)}</SummaryValue>
        </SummaryBar>
        <SummaryBar bg={colors.primaryLight} borderColor={colors.primary}>
          <SummaryLabel textColor={semanticColors.primaryTextDark}>📈 NET SAVINGS</SummaryLabel>
          <SummaryValue textColor={netSavings >= 0 ? semanticColors.successTextDark : colors.danger}>{formatDollars(netSavings)}</SummaryValue>
        </SummaryBar>
      </div>
    </StepShell>
  );
}
