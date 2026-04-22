'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styled from 'styled-components';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EnableEditModal } from '@/components/modals/EnableEditModal';
import { useReviewStore } from '@/lib/store';
import { formatDollars } from '@/lib/money';
import { colors, font, spacing, semanticColors } from '@/styles/tokens';
import { LoadingState } from '@/components/shared/LoadingState';
import { apiGet, getReviewIncome, getReviewExpenses, getReviewSavings, getReviewInvestments } from '@/lib/api';
import { MONTH_NAMES_LONG } from '@/lib/fire';

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
  background: ${({ $editing }) => $editing ? colors.warningLight : semanticColors.infoBg};
  border: 1px solid ${({ $editing }) => $editing ? semanticColors.warningBorderStrong : semanticColors.infoBorder};
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
const StatValue = styled.p.withConfig({ shouldForwardProp: (p) => p !== 'textColor' })<{ textColor?: string }>`
  font-size: ${font.size['2xl']}; font-weight: 700;
  color: ${({ textColor }) => textColor ?? colors.textPrimary};
`;

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

const StepLabel = styled.span`font-weight: ${font.weight.semibold};`;

interface StepObj { stepKey: string; status: string }

interface ReviewData {
  id: number;
  periodYear: number;
  periodMonth: number;
  type: 'MONTHLY' | 'QUARTERLY';
  status: string;
  completedAt: string | null;
  currentStep: string;
  lockedForEdit: boolean;
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
      apiGet<{ review: ReviewData }>(`/api/reviews/${reviewId}`),
      getReviewIncome(reviewId),
      getReviewExpenses(reviewId),
      getReviewSavings(reviewId),
      getReviewInvestments(reviewId),
    ]).then(([rev, inc, exp, sav, inv]) => {
      setReview(rev.review ?? null);
      actions.setActiveReview(rev.review ?? null);
      actions.setIsEditMode(false);
      setIncome((inc.entries ?? []).reduce((s, e) => s + e.amount, 0));
      setExpenses((exp.entries ?? []).reduce((s, e) => s + e.amount, 0));
      setSavings(((sav as unknown as { snapshots: { endingBalance: number }[] }).snapshots ?? []).reduce((s, e) => s + e.endingBalance, 0));
      setPortfolio(Object.values((inv as { snapshots: Record<number, { value: number }> }).snapshots ?? {}).reduce((s, e) => s + e.value, 0));
    }).finally(() => setLoading(false));
  }, [reviewId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleEnableEdit() {
    actions.setIsEditMode(true);
    router.push(`/review/${reviewId}/expense`);
  }

  if (loading) return <LoadingState centered />;
  if (!review) return <p style={{ color: colors.danger, padding: spacing[8] }}>Review not found.</p>;

  const period = `${MONTH_NAMES_LONG[review.periodMonth - 1]} ${review.periodYear}`;
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
          <StatValue textColor={semanticColors.successText}>{formatDollars(income)}</StatValue>
        </StatCard>
        <StatCard accent={colors.danger} padding="md">
          <StatLabel>Total Expenses</StatLabel>
          <StatValue textColor={colors.danger}>{formatDollars(expenses)}</StatValue>
        </StatCard>
        <StatCard accent={netFlow >= 0 ? colors.primary : colors.warning} padding="md">
          <StatLabel>Net Cash Flow</StatLabel>
          <StatValue textColor={netFlow >= 0 ? colors.primary : colors.danger}>
            {netFlow >= 0 ? '+' : ''}{formatDollars(netFlow)}
          </StatValue>
        </StatCard>
        <StatCard accent={colors.warning} padding="md">
          <StatLabel>Total Savings</StatLabel>
          <StatValue>{formatDollars(savings)}</StatValue>
        </StatCard>
        {review.type === 'QUARTERLY' && (
          <StatCard accent={semanticColors.purpleMedium} padding="md">
            <StatLabel>Portfolio Value</StatLabel>
            <StatValue textColor={semanticColors.purpleText}>{formatDollars(portfolio)}</StatValue>
          </StatCard>
        )}
      </SummaryGrid>

      <Card padding="md">
        <CardTitle style={{ marginBottom: spacing[4] }}>Step Completion</CardTitle>
        <StepList>
          {review.steps.map((step) => (
            <StepRow key={step.stepKey}>
              <StepLabel>{STEP_LABELS[step.stepKey] ?? step.stepKey}</StepLabel>
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
