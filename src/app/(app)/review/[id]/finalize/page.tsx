'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StepShell } from '@/components/review/StepShell';
import { STEP_META } from '@/components/review/stepMetadata';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useReviewStore } from '@/lib/store';
import { useStepNav } from '@/lib/useStepNav';
import { formatDollars } from '@/lib/money';
import { getReviewIncome, getReviewExpenses, getReviewSavings, getReviewInvestments, apiPatch } from '@/lib/api';
import { theme } from '@/styles/tokens';

const { colors, font, spacing, semanticColors } = theme;
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { MONTH_NAMES_LONG } from '@/lib/fire';
import { SummaryGrid, SummaryCard, Label, Value, StepList, StepRow, CompleteBox, CompleteIcon } from './FinalizePage.styles';

const STEP_LABELS: Record<string, string> = {
  expense: 'Expense Entry', monthly: 'Monthly Summary', savings: 'Savings',
  loans: 'Loans', investments: 'Investments', portfolio: 'Portfolio & FIRE',
  vaults: 'Vaults', finalize: 'Finalize',
};

interface StepObj { stepKey: string; status: string }

export default function FinalizePage() {
  const params = useParams();
  const reviewId = params.id as string;
  const router = useRouter();
  const { state: reviewState, actions } = useReviewStore();
  const { goBack, saving } = useStepNav('finalize');
  const readOnly = reviewState.activeReview?.status === 'COMPLETE' && !reviewState.isEditMode;

  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [savings, setSavings] = useState(0);
  const [portfolio, setPortfolio] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    Promise.all([
      getReviewIncome(reviewId),
      getReviewExpenses(reviewId),
      getReviewSavings(reviewId),
      getReviewInvestments(reviewId),
    ]).then(([inc, exp, sav, inv]) => {
      setIncome((inc.entries ?? []).reduce((s, e) => s + e.amount, 0));
      setExpenses((exp.entries ?? []).reduce((s, e) => s + e.amount, 0));
      setSavings(((sav as unknown as { snapshots: { endingBalance: number }[] }).snapshots ?? []).reduce((s, e) => s + e.endingBalance, 0));
      setPortfolio(Object.values((inv as { snapshots: Record<number, { value: number }> }).snapshots ?? {}).reduce((s, e) => s + e.value, 0));
    }).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, [reviewId]);

  async function handleComplete() {
    setCompleting(true);
    setCompleteError(null);
    try {
      await apiPatch(`/api/reviews/${reviewId}/steps/finalize`, { status: 'COMPLETE' });
    } catch {
      setCompleteError("Couldn't finalize — try again");
      setCompleting(false);
      return;
    }
    try {
      const data = await apiPatch<{ review: typeof reviewState.activeReview }>(`/api/reviews/${reviewId}`, { status: 'COMPLETE', currentStep: 'finalize' });
      actions.setActiveReview(data.review);
      router.push('/dashboard');
    } catch {
      setCompleteError("Couldn't finalize — try again");
    } finally {
      setCompleting(false);
    }
  }

  const activeReview = reviewState.activeReview;
  const steps: StepObj[] = activeReview?.steps ?? [];
  const nonFinalSteps = steps.filter((s) => s.stepKey !== 'finalize');
  const hasPending = nonFinalSteps.some((s) => s.status === 'PENDING');
  const hasSkipped = nonFinalSteps.some((s) => s.status === 'SKIPPED');
  const isComplete = activeReview?.status === 'COMPLETE';

  if (loading) return <LoadingState centered />;
  if (loadError) return <ErrorState centered message="Couldn't load review data — please refresh." />;

  if (isComplete) {
    const period = activeReview ? `${MONTH_NAMES_LONG[activeReview.periodMonth - 1]} ${activeReview.periodYear}` : '';
    return (
      <StepShell title="Finalize" onNext={() => router.push('/dashboard')} nextLabel="Back to Dashboard" readOnly>
        <CompleteBox>
          <CompleteIcon>✅</CompleteIcon>
          <h2 style={{ fontSize: font.size['3xl'], fontWeight: 700, marginBottom: spacing[2] }}>Review Complete</h2>
          <p style={{ color: colors.textMuted, marginBottom: spacing[6] }}>{period} financial review has been finalized.</p>
          <Button size="lg" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </CompleteBox>
      </StepShell>
    );
  }

  return (
    <StepShell
      title={STEP_META.finalize.title}
      subtitle={STEP_META.finalize.subtitle}
      onNext={handleComplete}
      nextLabel={completing ? 'Completing…' : 'Complete Review ✓'}
      saving={completing || saving}
      readOnly={readOnly}
    >
      <SummaryGrid>
        <SummaryCard accent={colors.success} padding="md">
          <Label>Total Income</Label>
          <Value style={{ color: semanticColors.successText }}>{formatDollars(income)}</Value>
        </SummaryCard>
        <SummaryCard accent={colors.danger} padding="md">
          <Label>Total Expenses</Label>
          <Value style={{ color: colors.danger }}>{formatDollars(expenses)}</Value>
        </SummaryCard>
        <SummaryCard accent={colors.primary} padding="md">
          <Label>Net Cash Flow</Label>
          <Value style={{ color: income - expenses >= 0 ? colors.primary : colors.danger }}>
            {income - expenses >= 0 ? '+' : ''}{formatDollars(income - expenses)}
          </Value>
        </SummaryCard>
        <SummaryCard accent={colors.warning} padding="md">
          <Label>Total Savings</Label>
          <Value>{formatDollars(savings)}</Value>
        </SummaryCard>
      </SummaryGrid>

      {completeError && (
        <p style={{ color: colors.danger, marginBottom: spacing[4], fontWeight: font.weight.medium }}>
          ⚠ {completeError}
        </p>
      )}

      <Card padding="md" style={{ marginBottom: spacing[6] }}>
        <CardTitle style={{ marginBottom: spacing[4] }}>Step Completion</CardTitle>
        <StepList>
          {steps.filter((s) => s.stepKey !== 'finalize').map((step) => (
            <StepRow key={step.stepKey}>
              <span style={{ fontWeight: font.weight.medium }}>{STEP_LABELS[step.stepKey] ?? step.stepKey}</span>
              <Badge variant={step.status === 'COMPLETE' ? 'success' : step.status === 'SKIPPED' ? 'default' : 'warning'}>
                {step.status === 'COMPLETE' ? '✓ Complete' : step.status === 'SKIPPED' ? '— Skipped' : '⏳ Pending'}
              </Badge>
            </StepRow>
          ))}
        </StepList>
        {hasPending && (
          <p style={{ fontSize: font.size.sm, color: colors.warning, marginBottom: hasSkipped ? 6 : 0 }}>
            ⚠ Some steps are still pending. You can still complete the review — pending steps will remain as-is.
          </p>
        )}
        {hasSkipped && (
          <p style={{ fontSize: font.size.sm, color: colors.textMuted }}>
            ℹ Some steps were skipped. Skipped steps are not included in this review.
          </p>
        )}
      </Card>
    </StepShell>
  );
}
