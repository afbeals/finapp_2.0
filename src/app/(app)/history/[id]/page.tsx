'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styled from 'styled-components';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EnableEditModal } from '@/components/modals/EnableEditModal';
import { useReviewStore } from '@/lib/store';
import { formatDollars } from '@/lib/money';
import { colors, font, spacing } from '@/styles/tokens';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STEP_LABELS: Record<string, string> = {
  expense: 'Expense Entry', monthly: 'Monthly Summary', savings: 'Savings',
  loans: 'Loans', investments: 'Investments', portfolio: 'Portfolio & FIRE',
  vaults: 'Vaults', finalize: 'Finalize',
};

const Page = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: ${spacing[8]} ${spacing[6]};
`;

const Banner = styled.div<{ $editing: boolean }>`
  background: ${({ $editing }) => $editing ? colors.warningLight : '#F0F9FF'};
  border: 1px solid ${({ $editing }) => $editing ? '#FDE68A' : '#BAE6FD'};
  border-radius: 8px;
  padding: 12px ${spacing[4]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${spacing[6]};
`;

const BannerText = styled.span`
  font-size: ${font.size.sm};
  color: ${colors.textSecondary};
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: ${spacing[6]};
`;

const Title = styled.h1`
  font-size: ${font.size['3xl']};
  font-weight: 700;
  color: ${colors.textPrimary};
  margin-bottom: 4px;
`;

const Subtitle = styled.p`
  font-size: ${font.size.base};
  color: ${colors.textMuted};
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: ${spacing[4]};
  margin-bottom: ${spacing[6]};
`;

const StatCard = styled(Card).withConfig({
  shouldForwardProp: (prop) => prop !== 'accent',
})<{ accent?: string }>`
  border-left: 4px solid ${({ accent }) => accent ?? colors.primary};
`;

const StatLabel = styled.p`font-size: ${font.size.sm}; color: ${colors.textMuted}; margin-bottom: 4px;`;
const StatValue = styled.p`font-size: ${font.size['2xl']}; font-weight: 700; color: ${colors.textPrimary};`;

const StepList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StepRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-radius: 8px;
  background: ${colors.bg};
`;

interface StepObj { stepKey: string; status: string }

interface ReviewData {
  id: number;
  periodYear: number;
  periodMonth: number;
  type: 'MONTHLY' | 'QUARTERLY';
  status: string;
  completedAt: string | null;
  steps: StepObj[];
}

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params.id as string;
  const { state, actions } = useReviewStore();

  const [review, setReview] = useState<ReviewData | null>(null);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [savings, setSavings] = useState(0);
  const [portfolio, setPortfolio] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showEnableEdit, setShowEnableEdit] = useState(false);

  const isEditMode = state.isEditMode;

  useEffect(() => {
    Promise.all([
      fetch(`/api/reviews/${reviewId}`).then((r) => r.json()),
      fetch(`/api/reviews/${reviewId}/income`).then((r) => r.json()),
      fetch(`/api/reviews/${reviewId}/expenses`).then((r) => r.json()),
      fetch(`/api/reviews/${reviewId}/savings`).then((r) => r.json()),
      fetch(`/api/reviews/${reviewId}/investments`).then((r) => r.json()),
    ]).then(([rev, inc, exp, sav, inv]) => {
      setReview(rev.review ?? null);
      actions.setActiveReview(rev.review);
      actions.setIsEditMode(false);
      setIncome((inc.entries ?? []).reduce((s: number, e: { amount: number }) => s + e.amount, 0));
      setExpenses((exp.entries ?? []).reduce((s: number, e: { amount: number }) => s + e.amount, 0));
      setSavings((sav.snapshots ?? []).reduce((s: number, e: { endingBalance: number }) => s + e.endingBalance, 0));
      setPortfolio((inv.snapshots ?? []).reduce((s: number, e: { value: number }) => s + e.value, 0));
    }).finally(() => setLoading(false));
  }, [reviewId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleEnableEdit() {
    actions.setIsEditMode(true);
    router.push(`/review/${reviewId}/expense`);
  }

  if (loading) return <p style={{ color: colors.textMuted, padding: spacing[8] }}>Loading…</p>;
  if (!review) return <p style={{ color: colors.danger, padding: spacing[8] }}>Review not found.</p>;

  const period = `${MONTH_NAMES[review.periodMonth - 1]} ${review.periodYear}`;
  const netFlow = income - expenses;
  const completedDate = review.completedAt ? new Date(review.completedAt).toLocaleDateString() : '—';

  return (
    <Page>
      <Banner $editing={isEditMode}>
        <BannerText>
          {isEditMode
            ? '✏️ You are editing a completed review. Changes are saved automatically.'
            : '👁️ Viewing completed review (read-only).'}
        </BannerText>
        {!isEditMode && (
          <Button size="sm" variant="secondary" onClick={() => setShowEnableEdit(true)}>
            Enable Editing
          </Button>
        )}
      </Banner>

      <Header>
        <div>
          <Title>{period} Financial Review</Title>
          <Subtitle>
            {review.type === 'QUARTERLY' ? 'Quarterly' : 'Monthly'} review · Completed {completedDate}
          </Subtitle>
        </div>
        <Button variant="secondary" onClick={() => router.push('/dashboard')}>
          ← Dashboard
        </Button>
      </Header>

      <SummaryGrid>
        <StatCard accent={colors.success} padding="md">
          <StatLabel>Total Income</StatLabel>
          <StatValue style={{ color: '#15803D' }}>{formatDollars(income)}</StatValue>
        </StatCard>
        <StatCard accent={colors.danger} padding="md">
          <StatLabel>Total Expenses</StatLabel>
          <StatValue style={{ color: colors.danger }}>{formatDollars(expenses)}</StatValue>
        </StatCard>
        <StatCard accent={netFlow >= 0 ? colors.primary : colors.warning} padding="md">
          <StatLabel>Net Cash Flow</StatLabel>
          <StatValue style={{ color: netFlow >= 0 ? colors.primary : colors.danger }}>
            {netFlow >= 0 ? '+' : ''}{formatDollars(netFlow)}
          </StatValue>
        </StatCard>
        <StatCard accent={colors.warning} padding="md">
          <StatLabel>Total Savings</StatLabel>
          <StatValue>{formatDollars(savings)}</StatValue>
        </StatCard>
        {review.type === 'QUARTERLY' && (
          <StatCard accent="#8B5CF6" padding="md">
            <StatLabel>Portfolio Value</StatLabel>
            <StatValue style={{ color: '#7C3AED' }}>{formatDollars(portfolio)}</StatValue>
          </StatCard>
        )}
      </SummaryGrid>

      <Card padding="md">
        <CardTitle style={{ marginBottom: spacing[4] }}>Step Completion</CardTitle>
        <StepList>
          {review.steps.map((step) => (
            <StepRow key={step.stepKey}>
              <span style={{ fontWeight: 600 }}>{STEP_LABELS[step.stepKey] ?? step.stepKey}</span>
              <Badge variant={step.status === 'COMPLETE' ? 'success' : step.status === 'SKIPPED' ? 'default' : 'warning'}>
                {step.status === 'COMPLETE' ? '✓ Complete' : step.status === 'SKIPPED' ? '— Skipped' : '⏳ Pending'}
              </Badge>
            </StepRow>
          ))}
        </StepList>
      </Card>

      <EnableEditModal
        isOpen={showEnableEdit}
        onClose={() => setShowEnableEdit(false)}
        onConfirm={handleEnableEdit}
      />
    </Page>
  );
}
