'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import styled from 'styled-components';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid, PieChart, Pie, Cell,
} from 'recharts';
import { StepShell } from '@/components/review/StepShell';
import { useStepNav } from '@/lib/useStepNav';
import { useReviewStore } from '@/lib/store';
import { formatDollars, formatDollarsWhole, toCents, toDollars } from '@/lib/money';
import { buildProjection, fireNumber, yearsToFire, futureValue, MONTH_NAMES_SHORT } from '@/lib/fire';
import { getReviewIncome, getReviewExpenses, getReviewInvestments, getReviewSavings, apiGet } from '@/lib/api';
import { colors, semanticColors, font, spacing, radius } from '@/styles/tokens';
import { LoadingState } from '@/components/shared/LoadingState';


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

// ─── Section card ─────────────────────────────────────────────────────────────

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

// ─── Asset allocation ─────────────────────────────────────────────────────────

const AllocationRow = styled.div`display: flex; align-items: center; gap: 12px; margin-bottom: 10px; &:last-child { margin-bottom: 0; }`;
const AllocationLabel = styled.span`flex: 1; font-size: ${font.size.sm}; font-weight: ${font.weight.medium}; color: ${colors.textPrimary};`;
const AllocationBar = styled.div.withConfig({ shouldForwardProp: (p) => !['pct','barColor'].includes(p) })<{ pct: number; barColor: string }>`
  flex: 2; height: 6px; background: ${colors.border}; border-radius: ${radius.full}; overflow: hidden;
  &::after { content: ''; display: block; height: 100%; width: ${({ pct }) => pct}%; background: ${({ barColor }) => barColor}; border-radius: ${radius.full}; }
`;
const AllocationValue = styled.span`font-size: ${font.size.sm}; font-weight: ${font.weight.semibold}; color: ${colors.textPrimary}; min-width: 80px; text-align: right;`;
const AllocationPct = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'tc' })<{ tc: string }>`
  font-size: ${font.size.xs}; color: ${({ tc }) => tc}; min-width: 46px; text-align: right;
`;

// ─── FIRE Calculator ──────────────────────────────────────────────────────────

const FireGrid = styled.div`display: grid; grid-template-columns: 1fr 1px 1fr; gap: 0;`;
const Divider = styled.div`background: ${colors.border}; align-self: stretch;`;
const FireLeft = styled.div`padding: 0 18px 0 0;`;
const FireRight = styled.div`padding: 0 0 0 18px;`;

const ToggleGroup = styled.div`
  display: flex; background: ${colors.bg}; border-radius: ${radius.md}; padding: 3px; margin-bottom: 14px;
`;
const ToggleBtn = styled.button.withConfig({ shouldForwardProp: (p) => p !== 'active' })<{ active: boolean }>`
  flex: 1; padding: 6px; font-size: ${font.size.xs}; font-weight: ${font.weight.semibold};
  border: none; border-radius: ${radius.sm}; cursor: pointer; transition: all 120ms;
  background: ${({ active }) => active ? colors.surface : 'transparent'};
  color: ${({ active }) => active ? colors.textPrimary : colors.textMuted};
  box-shadow: ${({ active }) => active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};
`;

const FireInputGroup = styled.div`margin-bottom: 12px;`;
const FireLabel = styled.label`display: block; font-size: ${font.size.xs}; font-weight: ${font.weight.semibold}; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;`;
const FireInput = styled.input`
  width: 100%; padding: 8px 10px; font-size: ${font.size.sm}; font-family: inherit;
  border: 1.5px solid ${colors.primary}; border-radius: ${radius.md};
  background: ${colors.surface}; color: ${colors.textPrimary}; outline: none;
  &:disabled { border-color: ${colors.border}; color: ${colors.textMuted}; background: ${colors.bg}; }
  &:focus { box-shadow: 0 0 0 3px ${colors.primaryLight}; }
`;

const FireResultsTitle = styled.p`font-size: ${font.size.xs}; font-weight: ${font.weight.bold}; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 14px;`;
const FireTarget = styled.div`margin-bottom: 12px;`;
const FireTargetLabel = styled.p`font-size: ${font.size.xs}; color: ${colors.textMuted}; margin-bottom: 2px;`;
const FireTargetValue = styled.p`font-size: ${font.size['2xl']}; font-weight: ${font.weight.bold}; color: ${colors.warning};`;

const ProgressBox = styled.div`
  background: ${semanticColors.successBg}; border: 1px solid ${colors.successLight}; border-radius: ${radius.md};
  padding: 10px 12px; margin-bottom: 12px;
`;
const ProgressBoxValue = styled.p`font-size: ${font.size.lg}; font-weight: ${font.weight.bold}; color: ${colors.textPrimary}; margin-bottom: 3px;`;
const ProgressBoxSub = styled.p`font-size: ${font.size.xs}; color: ${colors.success};`;

const YearsToFireBox = styled.div`
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border: 1px solid ${colors.border}; border-radius: ${radius.md};
`;
const YearsIcon = styled.span`font-size: 20px;`;
const YearsValue = styled.p`font-size: ${font.size['2xl']}; font-weight: ${font.weight.bold}; color: ${semanticColors.successTextDark};`;
const YearsSub = styled.p`font-size: ${font.size.xs}; color: ${semanticColors.successBright};`;

// ─── Wealth Projections ───────────────────────────────────────────────────────

const ProjectionWrap = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  margin-bottom: ${spacing[6]};
`;
const ProjectionHead = styled.div`
  padding: 14px 18px;
  border-bottom: 1px solid ${colors.border};
  display: flex; align-items: center; justify-content: space-between;
`;
const ProjectionInputsBar = styled.div`
  background: ${semanticColors.surfaceMuted};
  border-bottom: 1px solid ${colors.border};
  padding: 14px 18px;
  display: flex; gap: ${spacing[4]}; flex-wrap: wrap; align-items: flex-end;
`;
const ProjInputGroup = styled.div`display: flex; flex-direction: column; gap: 4px; min-width: 130px;`;
const ProjLabel = styled.label`font-size: ${font.size.xs}; font-weight: ${font.weight.semibold}; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.04em;`;
const ProjInput = styled.input`
  padding: 6px 10px; font-size: ${font.size.sm}; font-family: inherit;
  border: 1px solid ${colors.border}; border-radius: ${radius.md};
  background: ${colors.surface}; color: ${colors.textPrimary}; outline: none; width: 100%;
  &:focus { border-color: ${colors.primary}; box-shadow: 0 0 0 2px #BFDBFE; }
`;
const EndYearBadge = styled.div`
  padding: 6px 16px; background: ${colors.primary}; color: ${colors.surface};
  border-radius: ${radius.md}; font-size: ${font.size.sm}; font-weight: ${font.weight.bold};
  align-self: flex-end; line-height: 1.5;
`;
const RecalcBtn = styled.button`
  padding: 8px 22px; background: ${colors.navbar}; color: ${colors.surface};
  border: none; border-radius: ${radius.md}; font-size: ${font.size.sm};
  font-weight: ${font.weight.bold}; cursor: pointer; align-self: flex-end;
  &:hover { background: ${semanticColors.navyHover}; }
`;
const ProjectionChartArea = styled.div`
  display: grid;
  grid-template-columns: 1fr 200px;
  @media (max-width: 800px) { grid-template-columns: 1fr; }
`;
const MonthlyValuesPanel = styled.div`
  border-left: 1px solid ${colors.border};
  overflow-y: auto;
  max-height: 300px;
`;
const MonthlyValuesHeader = styled.div`
  padding: 10px 14px 8px;
  font-size: ${font.size.xs}; font-weight: ${font.weight.bold};
  color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.05em;
  border-bottom: 1px solid ${colors.border};
  position: sticky; top: 0; background: ${colors.surface}; z-index: 1;
`;
const MonthlyValueRow = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'highlight' })<{ highlight?: boolean }>`
  padding: 7px 14px;
  background: ${({ highlight }) => highlight ? semanticColors.infoBg : colors.surface};
  border-bottom: 1px solid ${colors.border};
  display: flex; justify-content: space-between; align-items: center;
  &:last-child { border-bottom: none; }
`;
const MonthRowLabel = styled.span`font-size: ${font.size.xs}; color: ${colors.textMuted};`;
const MonthRowValue = styled.span`font-size: ${font.size.xs}; font-weight: ${font.weight.semibold}; color: ${colors.textPrimary};`;

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

  // FIRE calculator
  const [useActual, setUseActual] = useState(false);
  const [estimatedExpenses, setEstimatedExpenses] = useState('75000');
  const [fireMonthlyContrib, setFireMonthlyContrib] = useState('3000');
  const [fireAnnualReturn, setFireAnnualReturn] = useState('7');

  // Wealth projection
  const [projStarting, setProjStarting] = useState('');
  const [projMonthly, setProjMonthly] = useState('0');
  const [projRate, setProjRate] = useState('4.75');
  const [projMonths, setProjMonths] = useState('36');
  const [projData, setProjData] = useState<{ month: string; value: number }[]>([]);
  const [projEndYear, setProjEndYear] = useState(new Date().getFullYear() + 2);

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

  // Init projection starting amount from portfolio total once loaded
  useEffect(() => {
    if (totalPortfolio > 0 && projStarting === '') {
      setProjStarting(toDollars(totalPortfolio).toFixed(2));
      computeProjection(toDollars(totalPortfolio).toFixed(2), projMonthly, projRate, projMonths);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPortfolio]);

  function computeProjection(starting: string, monthly: string, rate: string, months: string) {
    const startCents = toCents(parseFloat(starting) || 0);
    const monthlyCents = toCents(parseFloat(monthly) || 0);
    const annualRate = (parseFloat(rate) || 0) / 100;
    const numMonths = parseInt(months) || 12;
    const r = annualRate / 12;
    const rows: { month: string; value: number }[] = [];
    let balance = startCents;
    const now = new Date();
    for (let i = 1; i <= numMonths; i++) {
      balance = Math.round(balance * (1 + r) + monthlyCents);
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      rows.push({ month: `${MONTH_NAMES_SHORT[d.getMonth()]} ${d.getFullYear()}`, value: balance });
    }
    setProjData(rows);
    if (rows.length > 0) {
      const lastDate = new Date(now.getFullYear(), now.getMonth() + numMonths, 1);
      setProjEndYear(lastDate.getFullYear());
    }
  }

  // Asset allocation: investments + HYSA + yearly income
  const netWorth = totalPortfolio + hysa;
  const allocationItems = [
    { label: 'Investments', value: totalPortfolio, color: colors.primary },
    { label: 'HYSA Savings', value: hysa, color: colors.success },
    { label: 'Yearly Income', value: ytdIncome, color: colors.warning },
  ].filter((a) => a.value > 0);
  const allocationTotal = allocationItems.reduce((s, a) => s + a.value, 0);
  const pieData = allocationItems.map((a) => ({ name: a.label, value: a.value, fill: a.color }));

  // FIRE calc
  const actualYearlyExpenses = totalExpenses * 12;
  const fireExpenses = useActual ? actualYearlyExpenses : toCents(parseFloat(estimatedExpenses) || 0);
  const fireTarget = fireNumber(fireExpenses);
  const firePct = Math.min(100, (totalPortfolio / Math.max(1, fireTarget)) * 100);
  const ytf = totalPortfolio > 0 && fireTarget > 0
    ? yearsToFire(totalPortfolio, toCents(parseFloat(fireMonthlyContrib) || 0), (parseFloat(fireAnnualReturn) || 0) / 100, fireTarget)
    : Infinity;

  // YTD savings rate (from current review month)
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Net worth YTD growth — approximate as ytdSaved + investment gains (we only have investments total)
  const ytdNetWorthGrowth = ytdSaved;

  // FIRE progress pct for banner
  const fireProgressPct = Math.min(100, (totalPortfolio / Math.max(1, fireTarget)) * 100);

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
        {/* Asset Allocation */}
        <SectionCard>
          <CardHead>
            <div>
              <CardTitle>Asset Allocation</CardTitle>
              <CardSub>Portfolio breakdown by asset type</CardSub>
            </div>
          </CardHead>
          <CardBody>
            {/* Donut centered */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <div style={{ position: 'relative' }}>
                <PieChart width={180} height={180}>
                  <Pie data={pieData.length > 0 ? pieData : [{ name: 'empty', value: 1, fill: colors.border }]} dataKey="value" cx="50%" cy="50%" innerRadius={58} outerRadius={85} paddingAngle={2} label={false}>
                    {(pieData.length > 0 ? pieData : [{ fill: colors.border }]).map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                </PieChart>
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: font.size.sm, fontWeight: font.weight.bold, color: colors.textPrimary,
                }}>
                  <span>{formatDollarsWhole(allocationTotal > 0 ? allocationTotal : netWorth)}</span>
                  <span style={{ fontSize: '9px', color: colors.textMuted, fontWeight: 'normal' }}>Total</span>
                </div>
              </div>
            </div>
            {/* Legend below chart */}
            <div>
              {allocationItems.map((item) => {
                const pct = allocationTotal > 0 ? (item.value / allocationTotal) * 100 : 0;
                return (
                  <AllocationRow key={item.label}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                    <AllocationLabel>{item.label}</AllocationLabel>
                    <div style={{ flex: 2 }}>
                      <AllocationBar pct={pct} barColor={item.color} />
                    </div>
                    <AllocationValue>{formatDollarsWhole(item.value)}</AllocationValue>
                    <AllocationPct tc={item.color}>{pct.toFixed(2)}%</AllocationPct>
                  </AllocationRow>
                );
              })}
              {allocationItems.length === 0 && (
                <p style={{ color: colors.textMuted, fontSize: font.size.sm, fontStyle: 'italic', textAlign: 'center' }}>
                  No investment or savings data for this review.
                </p>
              )}
            </div>
          </CardBody>
        </SectionCard>

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
            <FireGrid>
              <FireLeft>
                <ToggleGroup>
                  <ToggleBtn active={useActual} onClick={() => setUseActual(true)}>Use Actual</ToggleBtn>
                  <ToggleBtn active={!useActual} onClick={() => setUseActual(false)}>Use Estimated</ToggleBtn>
                </ToggleGroup>

                <FireInputGroup>
                  <FireLabel style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Current Yearly Expenses (from Monthly)
                    {useActual && <span style={{ background: colors.primaryLight, color: semanticColors.primaryText, fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>ACTIVE</span>}
                  </FireLabel>
                  <FireInput
                    disabled
                    value={`$${toDollars(actualYearlyExpenses).toFixed(2)}`}
                    style={{ opacity: useActual ? 1 : 0.5 }}
                  />
                </FireInputGroup>

                <FireInputGroup>
                  <FireLabel style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    Estimated Yearly Expense
                    {!useActual && <span style={{ background: colors.primaryLight, color: semanticColors.primaryText, fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>ACTIVE</span>}
                  </FireLabel>
                  <FireInput
                    type="number"
                    value={estimatedExpenses}
                    onChange={(e) => setEstimatedExpenses(e.target.value)}
                    placeholder="75000"
                    style={{ opacity: useActual ? 0.5 : 1 }}
                  />
                </FireInputGroup>

                <FireInputGroup>
                  <FireLabel>Monthly Contribution ($)</FireLabel>
                  <FireInput
                    type="number"
                    value={fireMonthlyContrib}
                    onChange={(e) => setFireMonthlyContrib(e.target.value)}
                    placeholder="3000"
                  />
                </FireInputGroup>

                <FireInputGroup>
                  <FireLabel>Expected Annual Return (%)</FireLabel>
                  <FireInput
                    type="number"
                    step="0.1"
                    value={fireAnnualReturn}
                    onChange={(e) => setFireAnnualReturn(e.target.value)}
                    placeholder="7"
                  />
                </FireInputGroup>
              </FireLeft>

              <Divider />

              <FireRight>
                <FireResultsTitle>Results</FireResultsTitle>

                <FireTarget>
                  <FireTargetLabel>FIRE Target (25× expenses)</FireTargetLabel>
                  <FireTargetValue>{formatDollarsWhole(fireTarget)}</FireTargetValue>
                </FireTarget>

                <ProgressBox>
                  <FireTargetLabel>Current Progress</FireTargetLabel>
                  <ProgressBoxValue>{formatDollarsWhole(totalPortfolio)}</ProgressBoxValue>
                  <ProgressBoxSub>{firePct.toFixed(1)}% complete</ProgressBoxSub>
                  <KpiProgressTrack style={{ marginTop: 6 }}>
                    <KpiProgressFill pct={firePct} color={colors.success} />
                  </KpiProgressTrack>
                </ProgressBox>

                <YearsToFireBox>
                  <YearsIcon>⏱️</YearsIcon>
                  <div>
                    <FireTargetLabel style={{ marginBottom: 2 }}>Estimated Years to FIRE</FireTargetLabel>
                    {ytf === Infinity ? (
                      <>
                        <YearsValue style={{ color: colors.textMuted }}>&gt; 100 yrs</YearsValue>
                        <YearsSub style={{ color: colors.textMuted }}>increase contribution or return rate</YearsSub>
                      </>
                    ) : (
                      <>
                        <YearsValue>{ytf.toFixed(1)} years</YearsValue>
                        <YearsSub>at current rate</YearsSub>
                      </>
                    )}
                  </div>
                </YearsToFireBox>
              </FireRight>
            </FireGrid>
          </CardBody>
        </SectionCard>
      </TwoCol>

      {/* ── Wealth Projections ── */}
      <ProjectionWrap>
        <ProjectionHead>
          <div>
            <CardTitle>Wealth Projections</CardTitle>
            <CardSub>Compound growth calculator</CardSub>
          </div>
        </ProjectionHead>

        <ProjectionInputsBar>
          <ProjInputGroup>
            <ProjLabel>Starting Amount</ProjLabel>
            <ProjInput
              type="number" value={projStarting}
              onChange={(e) => { setProjStarting(e.target.value); computeProjection(e.target.value, projMonthly, projRate, projMonths); }}
            />
          </ProjInputGroup>
          <ProjInputGroup>
            <ProjLabel>Monthly Contribution</ProjLabel>
            <ProjInput
              type="number" value={projMonthly}
              onChange={(e) => { setProjMonthly(e.target.value); computeProjection(projStarting, e.target.value, projRate, projMonths); }}
            />
          </ProjInputGroup>
          <ProjInputGroup>
            <ProjLabel>Interest Rate (%)</ProjLabel>
            <ProjInput
              type="number" step="0.01" value={projRate}
              onChange={(e) => { setProjRate(e.target.value); computeProjection(projStarting, projMonthly, e.target.value, projMonths); }}
            />
          </ProjInputGroup>
          <ProjInputGroup>
            <ProjLabel>Timespan (months)</ProjLabel>
            <ProjInput
              type="number" value={projMonths}
              onChange={(e) => { setProjMonths(e.target.value); computeProjection(projStarting, projMonthly, projRate, e.target.value); }}
            />
          </ProjInputGroup>
          <EndYearBadge>{projEndYear}</EndYearBadge>
        </ProjectionInputsBar>

        <ProjectionChartArea>
          <div style={{ padding: '16px 8px 8px 0' }}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={projData.map((d, i) => ({ ...d, index: i }))} margin={{ left: 8, right: 16, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => {
                    const parts = v.split(' ');
                    return parts[0];
                  }}
                  interval={Math.max(0, Math.floor(projData.length / 8) - 1)}
                />
                <YAxis tickFormatter={(v) => `$${(v / 100000).toFixed(0)}k`} tick={{ fontSize: 10 }} width={48} />
                <Tooltip
                  formatter={(v) => formatDollarsWhole(Number(v))}
                  labelFormatter={(l) => projData[l as number]?.month ?? l}
                />
                <Line type="monotone" dataKey="value" stroke={colors.primary} strokeWidth={2} dot={false} name="Value" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <MonthlyValuesPanel>
            <MonthlyValuesHeader>Monthly Values</MonthlyValuesHeader>
            {projData.map((row, i) => (
              <MonthlyValueRow key={i} highlight={i === 0}>
                <MonthRowLabel>{row.month}</MonthRowLabel>
                <MonthRowValue>{formatDollarsWhole(row.value)}</MonthRowValue>
              </MonthlyValueRow>
            ))}
            {projData.length === 0 && (
              <MonthlyValueRow>
                <MonthRowLabel style={{ color: colors.textMuted, fontStyle: 'italic' }}>No data yet</MonthRowLabel>
              </MonthlyValueRow>
            )}
          </MonthlyValuesPanel>
        </ProjectionChartArea>
      </ProjectionWrap>
    </StepShell>
  );
}
