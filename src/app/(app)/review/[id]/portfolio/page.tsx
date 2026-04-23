'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import styled from 'styled-components';
import { StepShell } from '@/components/review/StepShell';
import { STEP_META } from '@/components/review/stepMetadata';
import { useStepNav } from '@/lib/useStepNav';
import { useReviewStore } from '@/lib/store';
import { formatDollarsWhole, formatDollars } from '@/lib/money';
import { fireNumber } from '@/lib/fire';
import { getReviewIncome, getReviewExpenses, getReviewInvestments, getReviewSavings, getReviewLoans, apiGet } from '@/lib/api';
import { theme } from '@/styles/tokens';

const { colors, semanticColors, spacing } = theme;
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { PanelCard, PanelHead, PanelTitle, PanelSubtitle, PanelBody } from '@/components/ui/Card';
import { KpiCard, KpiIcon, KpiBody, KpiLabel, KpiValue, KpiSub } from '@/components/ui/KpiCard';
import { CircleProgress } from '@/components/ui/CircleProgress';
import { FireWidget } from './FireWidget';
import { WealthProjection } from './WealthProjection';
import { AssetAllocationCard } from './AssetAllocationCard';


// ─── Top KPI banner ───────────────────────────────────────────────────────────

const KpiBanner = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${spacing[4]};
  margin-bottom: ${spacing[6]};
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`;

// ─── Two-column layout ────────────────────────────────────────────────────────

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing[5]};
  margin-bottom: ${spacing[6]};
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;


// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const params = useParams();
  const reviewId = params.id as string;
  const { state: reviewState } = useReviewStore();
  const { goNext, goBack, goSkip, saving } = useStepNav('portfolio');
  const readOnly = reviewState.activeReview?.status === 'COMPLETE' && !reviewState.isEditMode;

  const [totalPortfolio, setTotalPortfolio] = useState(0);
  const [hysa, setHysa] = useState(0);
  const [totalLoanBalance, setTotalLoanBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [ytdIncome, setYtdIncome] = useState(0);
  const [ytdSaved, setYtdSaved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    Promise.all([
      getReviewInvestments(reviewId),
      getReviewIncome(reviewId),
      getReviewExpenses(reviewId),
      getReviewSavings(reviewId),
      getReviewLoans(reviewId),
      apiGet<{ reviews: { periodYear: number; totalIncome: number }[] }>('/api/reviews'),
    ]).then(([inv, inc, exp, sav, loanData, allReviews]) => {
      const taxableValue = (inv.snapshots ?? []).reduce((s, sn) => s + sn.value, 0);
      const retirementValue = (inv.retirementSnapshots ?? []).reduce((s, sn) => s + sn.balance, 0);
      setTotalPortfolio(taxableValue + retirementValue);
      const loanBalances = (loanData.snapshots ?? []).reduce((s, sn) => s + sn.balance, 0);
      setTotalLoanBalance(loanBalances);
      setTotalIncome((inc.entries ?? []).reduce((s, e) => s + e.amount, 0));
      setTotalExpenses((exp.entries ?? []).reduce((s, e) => s + e.amount, 0));

      const savData = sav;
      const currentYear = savData.allReviews?.find((r) => r.id === Number(reviewId))?.periodYear ?? new Date().getFullYear();
      const ytdSnaps = (savData.allSnapshots ?? []).filter((s) => s.review.periodYear === currentYear);
      const hysaTotal = (savData.accounts ?? []).reduce((sum, acc) => {
        const acctSnaps = ytdSnaps.filter((s) => s.accountId === acc.id)
          .sort((a, b) => a.review.periodMonth - b.review.periodMonth);
        if (acctSnaps.length === 0) return sum;
        return sum + acctSnaps[acctSnaps.length - 1].endingBalance;
      }, 0);
      setHysa(hysaTotal);
      setYtdSaved(ytdSnaps.reduce((s, sn) => s + sn.deposits + sn.interest, 0));

      const yr = new Date().getFullYear();
      setYtdIncome((allReviews.reviews ?? [])
        .filter((r) => r.periodYear === yr)
        .reduce((s, r) => s + r.totalIncome, 0));
    }).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, [reviewId]);

  // Net worth = investments + HYSA − outstanding loans
  const netWorth = useMemo(() => totalPortfolio + hysa - totalLoanBalance, [totalPortfolio, hysa, totalLoanBalance]);

  const allocationItems = useMemo(() => [
    { label: 'Investments', value: totalPortfolio, color: colors.primary },
    { label: 'HYSA Savings', value: hysa, color: colors.success },
    { label: 'Yearly Income', value: ytdIncome, color: colors.warning },
  ].filter((a) => a.value > 0), [totalPortfolio, hysa, ytdIncome]);

  // FIRE calc (for banner only)
  const actualYearlyExpenses = totalExpenses * 12;
  const fireTarget = fireNumber(actualYearlyExpenses);
  const fireProgressPct = Math.min(100, (totalPortfolio / Math.max(1, fireTarget)) * 100);

  // YTD savings rate (from current review month)
  const savingsRate = useMemo(
    () => totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
    [totalIncome, totalExpenses],
  );

  // Net worth YTD growth — approximate as ytdSaved
  const ytdNetWorthGrowth = ytdSaved;

  if (loading) return <LoadingState centered />;
  if (loadError) return <ErrorState centered message="Couldn't load portfolio data — please refresh." />;

  return (
    <StepShell
      title={STEP_META.portfolio.title}
      subtitle={STEP_META.portfolio.subtitle}
      stepName="Portfolio"
      onBack={goBack}
      onSkip={goSkip}
      onNext={goNext}
      saving={saving}
      readOnly={readOnly}
    >
      {/* ── Top KPI banner ── */}
      <KpiBanner>
        {/* Net Worth */}
        <KpiCard>
          <KpiIcon>💰</KpiIcon>
          <KpiBody>
            <KpiLabel>Net Worth</KpiLabel>
            <KpiValue tc={netWorth < 0 ? colors.danger : undefined}>{formatDollarsWhole(netWorth)}</KpiValue>
            <KpiSub>↑ {formatDollarsWhole(ytdNetWorthGrowth)} YTD</KpiSub>
            {totalLoanBalance > 0 && (
              <KpiSub style={{ color: colors.danger }}>Liabilities: −{formatDollarsWhole(totalLoanBalance)}</KpiSub>
            )}
            {netWorth < 0 ? (
              <KpiSub style={{ color: colors.danger, marginTop: 4 }}>Liabilities exceed assets by {formatDollars(-netWorth)}</KpiSub>
            ) : (
              <KpiSub style={{ marginTop: 4 }}>{((netWorth / Math.max(1, fireTarget)) * 100).toFixed(1)}% of FIRE target ({formatDollarsWhole(fireTarget)})</KpiSub>
            )}
          </KpiBody>
        </KpiCard>

        {/* FIRE Progress */}
        <KpiCard>
          <KpiIcon>🔥</KpiIcon>
          <KpiBody>
            <KpiLabel>FIRE Progress</KpiLabel>
            <KpiValue tc={colors.warning}>{fireProgressPct.toFixed(1)}%</KpiValue>
            <KpiSub>of {formatDollarsWhole(fireTarget)} goal</KpiSub>
            <div style={{ marginTop: 8 }}><ProgressBar value={fireProgressPct} color={colors.warning} height={6} /></div>
            <KpiSub style={{ marginTop: 4 }}>
              {formatDollarsWhole(totalPortfolio)} / {formatDollarsWhole(fireTarget)}
            </KpiSub>
          </KpiBody>
        </KpiCard>

        {/* Savings Rate */}
        <KpiCard>
          <KpiBody>
            <KpiLabel>Savings Rate</KpiLabel>
            <KpiValue tc={savingsRate < 0 ? colors.danger : colors.success}>{savingsRate.toFixed(1)}%</KpiValue>
            <KpiSub style={{ color: savingsRate < 0 ? semanticColors.dangerText : undefined }}>
              {savingsRate < 0
                ? `${formatDollarsWhole(totalExpenses - totalIncome)} over budget`
                : `${formatDollarsWhole(totalIncome - totalExpenses)} saved of ${formatDollarsWhole(totalIncome)} earned`}
            </KpiSub>
          </KpiBody>
          <CircleProgress
            value={Math.max(0, Math.min(100, savingsRate))}
            color={savingsRate < 0 ? colors.danger : colors.success}
            label={`${savingsRate.toFixed(0)}%`}
          />
        </KpiCard>
      </KpiBanner>

      {/* ── Asset Allocation + FIRE Calculator ── */}
      <TwoCol>
        <AssetAllocationCard allocationItems={allocationItems} netWorth={netWorth} />

        {/* FIRE Calculator */}
        <PanelCard>
          <PanelHead>
            <div>
              <PanelTitle>FIRE Calculator</PanelTitle>
              <PanelSubtitle>Financial Independence, Retire Early (4% Rule)</PanelSubtitle>
            </div>
          </PanelHead>
          <PanelBody>
            <FireWidget totalPortfolioValue={totalPortfolio} actualYearlyExpenses={actualYearlyExpenses} />
          </PanelBody>
        </PanelCard>
      </TwoCol>

      {/* ── Wealth Projections ── */}
      <WealthProjection totalPortfolioValue={totalPortfolio} />
    </StepShell>
  );
}
