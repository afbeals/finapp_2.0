'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styled from 'styled-components';
import { StepShell } from '@/components/review/StepShell';
import { useStepNav } from '@/lib/useStepNav';
import { useReviewStore } from '@/lib/store';
import { formatDollars, formatDollarsWhole, toDollars } from '@/lib/money';
import { fireNumber } from '@/lib/fire';
import { getReviewIncome, getReviewExpenses, getReviewInvestments, getReviewSavings, apiGet } from '@/lib/api';
import { colors, font, spacing, radius } from '@/styles/tokens';
import { LoadingState } from '@/components/shared/LoadingState';
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

const KpiCard = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: ${spacing[4]} ${spacing[5]};
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  align-items: flex-start;
  gap: 14px;
`;
const KpiIcon = styled.span`font-size: 26px; flex-shrink: 0; margin-top: 2px;`;
const KpiBody = styled.div`flex: 1;`;
const KpiLabel = styled.p`
  font-size: ${font.size.xs}; font-weight: ${font.weight.semibold};
  color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px;
`;
const KpiValue = styled.p.withConfig({ shouldForwardProp: (p) => p !== 'tc' })<{ tc?: string }>`
  font-size: ${font.size['2xl']}; font-weight: ${font.weight.bold};
  color: ${({ tc }) => tc ?? colors.textPrimary}; line-height: 1; margin-bottom: 4px;
`;
const KpiSub = styled.p`font-size: ${font.size.xs}; color: ${colors.textMuted};`;

const KpiProgressTrack = styled.div`height: 6px; background: ${colors.border}; border-radius: ${radius.full}; overflow: hidden; margin-top: 8px;`;
const KpiProgressFill = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'pct' })<{ pct: number; color?: string }>`
  height: 100%; width: ${({ pct }) => Math.min(100, pct)}%;
  background: ${({ color }) => color ?? colors.primary};
  border-radius: ${radius.full};
`;
const CircleWrap = styled.div`position: relative; width: 52px; height: 52px; flex-shrink: 0;`;
const CircleSvg = styled.svg`transform: rotate(-90deg);`;
const CircleLabel = styled.div`
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: ${font.weight.bold}; color: ${colors.success};
`;

// ─── Two-column layout ────────────────────────────────────────────────────────

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing[5]};
  margin-bottom: ${spacing[6]};
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

// ─── Section card (for FIRE Calculator wrapper) ───────────────────────────────

const SectionCard = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
`;
const CardHead = styled.div`
  padding: 14px 18px 10px;
  border-bottom: 1px solid ${colors.border};
  display: flex; align-items: baseline; justify-content: space-between; gap: ${spacing[3]};
`;
const CardTitle = styled.h2`font-size: ${font.size.base}; font-weight: ${font.weight.bold}; color: ${colors.textPrimary};`;
const CardSub = styled.p`font-size: ${font.size.xs}; color: ${colors.textMuted};`;
const CardBody = styled.div`padding: 16px 18px;`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const params = useParams();
  const reviewId = params.id as string;
  const { state: reviewState } = useReviewStore();
  const { goNext, goBack, goSkip, saving } = useStepNav('portfolio');
  const readOnly = reviewState.activeReview?.status === 'COMPLETE' && !reviewState.isEditMode;

  const [totalPortfolio, setTotalPortfolio] = useState(0);
  const [hysa, setHysa] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [ytdIncome, setYtdIncome] = useState(0);
  const [ytdSaved, setYtdSaved] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getReviewInvestments(reviewId),
      getReviewIncome(reviewId),
      getReviewExpenses(reviewId),
      getReviewSavings(reviewId),
      apiGet<{ reviews: { periodYear: number; totalIncome: number }[] }>('/api/reviews'),
    ]).then(([inv, inc, exp, sav, allReviews]) => {
      const snapArr = Object.values((inv as { snapshots: Record<number, { value: number }> }).snapshots ?? {});
      setTotalPortfolio(snapArr.reduce((s, sn) => s + sn.value, 0));
      setTotalIncome((inc.entries ?? []).reduce((s, e) => s + e.amount, 0));
      setTotalExpenses((exp.entries ?? []).reduce((s, e) => s + e.amount, 0));

      const savData = sav as unknown as {
        accounts: { id: number }[];
        allSnapshots: { accountId: number; deposits: number; interest: number; endingBalance: number; review: { id: number; periodYear: number; periodMonth: number } }[];
        allReviews: { id: number; periodYear: number }[];
      };
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
    }).finally(() => setLoading(false));
  }, [reviewId]);

  // Asset allocation: investments + HYSA + yearly income
  const netWorth = totalPortfolio + hysa;
  const allocationItems = [
    { label: 'Investments', value: totalPortfolio, color: colors.primary },
    { label: 'HYSA Savings', value: hysa, color: colors.success },
    { label: 'Yearly Income', value: ytdIncome, color: colors.warning },
  ].filter((a) => a.value > 0);

  // FIRE calc (for banner only)
  const actualYearlyExpenses = totalExpenses * 12;
  const fireExpensesEstimated = 75000 * 100; // default estimated $75k in cents
  const fireTarget = fireNumber(fireExpensesEstimated);
  const fireProgressPct = Math.min(100, (totalPortfolio / Math.max(1, fireTarget)) * 100);

  // YTD savings rate (from current review month)
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Net worth YTD growth — approximate as ytdSaved + investment gains (we only have investments total)
  const ytdNetWorthGrowth = ytdSaved;

  if (loading) return <LoadingState centered />;

  return (
    <StepShell
      title="Portfolio Overview"
      subtitle="Net worth summary and retirement planning"
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
            <KpiValue>{formatDollarsWhole(netWorth)}</KpiValue>
            <KpiSub>↑ {formatDollarsWhole(ytdNetWorthGrowth)} YTD</KpiSub>
            <KpiProgressTrack>
              <KpiProgressFill pct={Math.min(100, (netWorth / Math.max(1, fireTarget)) * 100 * 2)} color={colors.primary} />
            </KpiProgressTrack>
          </KpiBody>
        </KpiCard>

        {/* FIRE Progress */}
        <KpiCard>
          <KpiIcon>🔥</KpiIcon>
          <KpiBody>
            <KpiLabel>FIRE Progress</KpiLabel>
            <KpiValue tc={colors.warning}>{fireProgressPct.toFixed(1)}%</KpiValue>
            <KpiSub>of {formatDollarsWhole(fireTarget)} goal</KpiSub>
            <KpiProgressTrack>
              <KpiProgressFill pct={fireProgressPct} color={colors.warning} />
            </KpiProgressTrack>
            <KpiSub style={{ marginTop: 4 }}>
              {formatDollarsWhole(totalPortfolio)} / {formatDollarsWhole(fireTarget)}
            </KpiSub>
          </KpiBody>
        </KpiCard>

        {/* Savings Rate */}
        <KpiCard>
          <KpiBody>
            <KpiLabel>Savings Rate</KpiLabel>
            <KpiValue tc={colors.success}>{savingsRate.toFixed(1)}%</KpiValue>
            <KpiSub>
              {formatDollarsWhole(totalIncome - totalExpenses)} saved of {formatDollarsWhole(totalIncome)} earned
            </KpiSub>
          </KpiBody>
          <CircleWrap>
            <CircleSvg width={52} height={52} viewBox="0 0 52 52">
              <circle cx="26" cy="26" r="22" fill="none" stroke={colors.border} strokeWidth="5" />
              <circle
                cx="26" cy="26" r="22" fill="none"
                stroke={colors.success} strokeWidth="5"
                strokeDasharray={`${Math.min(100, savingsRate) / 100 * 138.2} 138.2`}
                strokeLinecap="round"
              />
            </CircleSvg>
            <CircleLabel>{savingsRate.toFixed(0)}%</CircleLabel>
          </CircleWrap>
        </KpiCard>
      </KpiBanner>

      {/* ── Asset Allocation + FIRE Calculator ── */}
      <TwoCol>
        <AssetAllocationCard allocationItems={allocationItems} netWorth={netWorth} />

        {/* FIRE Calculator */}
        <SectionCard>
          <CardHead>
            <div>
              <CardTitle>FIRE Calculator</CardTitle>
              <CardSub>Financial Independence, Retire Early (4% Rule)</CardSub>
            </div>
            <span style={{ fontSize: 16, color: colors.textMuted, cursor: 'default' }} title="The FIRE number = 25× your annual expenses. Based on the 4% safe withdrawal rate.">ⓘ</span>
          </CardHead>
          <CardBody>
            <FireWidget totalPortfolioValue={totalPortfolio} actualYearlyExpenses={actualYearlyExpenses} />
          </CardBody>
        </SectionCard>
      </TwoCol>

      {/* ── Wealth Projections ── */}
      <WealthProjection totalPortfolioValue={totalPortfolio} />
    </StepShell>
  );
}
