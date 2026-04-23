'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import styled from 'styled-components';
import { StepShell } from '@/components/review/StepShell';
import { STEP_META } from '@/components/review/stepMetadata';
import { useStepNav } from '@/lib/useStepNav';
import { useReviewStore } from '@/lib/store';
import { formatDollarsWhole, formatDollars } from '@/lib/money';
import { usePortfolioData } from '@/lib/hooks/usePortfolioData';
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
  const { goNext, saving } = useStepNav('portfolio');
  const readOnly = reviewState.activeReview?.status === 'COMPLETE' && !reviewState.isEditMode;

  const d = usePortfolioData(reviewId);

  if (d.loading) return <LoadingState centered />;
  if (d.loadError) return <ErrorState centered message="Couldn't load portfolio data — please refresh." />;

  return (
    <StepShell
      title={STEP_META.portfolio.title}
      subtitle={STEP_META.portfolio.subtitle}
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
            <KpiValue tc={d.netWorth < 0 ? colors.danger : undefined}>{formatDollarsWhole(d.netWorth)}</KpiValue>
            <KpiSub>↑ {formatDollarsWhole(d.ytdNetWorthGrowth)} YTD</KpiSub>
            {d.totalLoanBalance > 0 && (
              <KpiSub style={{ color: colors.danger }}>Liabilities: −{formatDollarsWhole(d.totalLoanBalance)}</KpiSub>
            )}
            {d.netWorth < 0 ? (
              <KpiSub style={{ color: colors.danger, marginTop: 4 }}>Liabilities exceed assets by {formatDollars(-d.netWorth)}</KpiSub>
            ) : (
              <KpiSub style={{ marginTop: 4 }}>{((d.netWorth / Math.max(1, d.fireTarget)) * 100).toFixed(1)}% of FIRE target ({formatDollarsWhole(d.fireTarget)})</KpiSub>
            )}
          </KpiBody>
        </KpiCard>

        {/* FIRE Progress */}
        <KpiCard>
          <KpiIcon>🔥</KpiIcon>
          <KpiBody>
            <KpiLabel>FIRE Progress</KpiLabel>
            <KpiValue tc={colors.warning}>{d.fireProgressPct.toFixed(1)}%</KpiValue>
            <KpiSub>of {formatDollarsWhole(d.fireTarget)} goal</KpiSub>
            <div style={{ marginTop: 8 }}><ProgressBar value={d.fireProgressPct} color={colors.warning} height={6} /></div>
            <KpiSub style={{ marginTop: 4 }}>
              {formatDollarsWhole(d.totalPortfolio)} / {formatDollarsWhole(d.fireTarget)}
            </KpiSub>
          </KpiBody>
        </KpiCard>

        {/* Savings Rate */}
        <KpiCard>
          <KpiBody>
            <KpiLabel>Savings Rate</KpiLabel>
            <KpiValue tc={d.savingsRate < 0 ? colors.danger : colors.success}>{d.savingsRate.toFixed(1)}%</KpiValue>
            <KpiSub style={{ color: d.savingsRate < 0 ? semanticColors.dangerText : undefined }}>
              {d.savingsRate < 0
                ? `${formatDollarsWhole(d.totalExpenses - d.totalIncome)} over budget`
                : `${formatDollarsWhole(d.totalIncome - d.totalExpenses)} saved of ${formatDollarsWhole(d.totalIncome)} earned`}
            </KpiSub>
          </KpiBody>
          <CircleProgress
            value={Math.max(0, Math.min(100, d.savingsRate))}
            color={d.savingsRate < 0 ? colors.danger : colors.success}
            label={`${d.savingsRate.toFixed(0)}%`}
          />
        </KpiCard>
      </KpiBanner>

      {/* ── Asset Allocation + FIRE Calculator ── */}
      <TwoCol>
        <AssetAllocationCard allocationItems={d.allocationItems} netWorth={d.netWorth} />

        {/* FIRE Calculator */}
        <PanelCard>
          <PanelHead>
            <div>
              <PanelTitle>FIRE Calculator</PanelTitle>
              <PanelSubtitle>Financial Independence, Retire Early (4% Rule)</PanelSubtitle>
            </div>
          </PanelHead>
          <PanelBody>
            <FireWidget totalPortfolioValue={d.totalPortfolio} actualYearlyExpenses={d.actualYearlyExpenses} />
          </PanelBody>
        </PanelCard>
      </TwoCol>

      {/* ── Wealth Projections ── */}
      <WealthProjection totalPortfolioValue={d.totalPortfolio} />
    </StepShell>
  );
}
