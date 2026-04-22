'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styled from 'styled-components';
import { StepShell } from '@/components/review/StepShell';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useReviewStore } from '@/lib/store';
import { useStepNav } from '@/lib/useStepNav';
import { formatDollars } from '@/lib/money';
import { colors, font, spacing } from '@/styles/tokens';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STEP_LABELS: Record<string, string> = {
  expense: 'Expense Entry', monthly: 'Monthly Summary', savings: 'Savings',
  loans: 'Loans', investments: 'Investments', portfolio: 'Portfolio & FIRE',
  vaults: 'Vaults', finalize: 'Finalize',
};

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing[4]};
  margin-bottom: ${spacing[6]};
  @media (max-width: 640px) { grid-template-columns: 1fr; }
`;

const SummaryCard = styled(Card).withConfig({
  shouldForwardProp: (prop) => prop !== 'accent',
})<{ accent?: string }>`
  border-left: 4px solid ${({ accent }) => accent ?? colors.primary};
`;

const Label = styled.p`font-size: ${font.size.sm}; color: ${colors.textMuted}; margin-bottom: 4px;`;
const Value = styled.p`font-size: ${font.size['2xl']}; font-weight: 700; color: ${colors.textPrimary};`;

const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: ${spacing[6]};
`;

const StepRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-radius: 8px;
  background: ${colors.bg};
`;

const CompleteBox = styled.div`
  text-align: center;
  padding: ${spacing[10]};
`;

const CompleteIcon = styled.div`font-size: 56px; margin-bottom: ${spacing[4]};`;

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/reviews/${reviewId}/income`).then((r) => r.json()),
      fetch(`/api/reviews/${reviewId}/expenses`).then((r) => r.json()),
      fetch(`/api/reviews/${reviewId}/savings`).then((r) => r.json()),
      fetch(`/api/reviews/${reviewId}/investments`).then((r) => r.json()),
    ]).then(([inc, exp, sav, inv]) => {
      setIncome((inc.entries ?? []).reduce((s: number, e: { amount: number }) => s + e.amount, 0));
      setExpenses((exp.entries ?? []).reduce((s: number, e: { amount: number }) => s + e.amount, 0));
      setSavings((sav.snapshots ?? []).reduce((s: number, e: { endingBalance: number }) => s + e.endingBalance, 0));
      setPortfolio((inv.snapshots ?? []).reduce((s: number, e: { value: number }) => s + e.value, 0));
    }).finally(() => setLoading(false));
  }, [reviewId]);

  async function handleComplete() {
    setCompleting(true);
    // Mark finalize step complete
    await fetch(`/api/reviews/${reviewId}/steps/finalize`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETE' }),
    });
    // Mark review complete
    const res = await fetch(`/api/reviews/${reviewId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETE', currentStep: 'finalize' }),
    });
    const data = await res.json();
    actions.setActiveReview(data.review);
    setCompleting(false);
    router.push('/dashboard');
  }

  const activeReview = reviewState.activeReview;
  const steps: StepObj[] = activeReview?.steps ?? [];
  const nonFinalSteps = steps.filter((s) => s.stepKey !== 'finalize');
  const hasPending = nonFinalSteps.some((s) => s.status === 'PENDING');
  const hasSkipped = nonFinalSteps.some((s) => s.status === 'SKIPPED');
  const isComplete = activeReview?.status === 'COMPLETE';

  if (loading) return <p style={{ color: colors.textMuted }}>Loading…</p>;

  if (isComplete) {
    const period = activeReview ? `${MONTH_NAMES[activeReview.periodMonth - 1]} ${activeReview.periodYear}` : '';
    return (
      <StepShell title="Finalize" stepName="Finalize" onBack={goBack} onNext={() => router.push('/dashboard')} nextLabel="Back to Dashboard" readOnly>
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
      title="Finalize Review"
      subtitle="Summary and completion."
      stepName="Finalize"
      onBack={goBack}
      onNext={handleComplete}
      nextLabel={completing ? 'Completing…' : 'Complete Review ✓'}
      saving={completing || saving}
      readOnly={readOnly}
    >
      <SummaryGrid>
        <SummaryCard accent={colors.success} padding="md">
          <Label>Total Income</Label>
          <Value style={{ color: '#15803D' }}>{formatDollars(income)}</Value>
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
