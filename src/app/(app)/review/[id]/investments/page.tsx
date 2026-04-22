'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import styled from 'styled-components';
import { StepShell } from '@/components/review/StepShell';
import { useStepNav } from '@/lib/useStepNav';
import { useReviewStore } from '@/lib/store';
import { formatDollars, toDollars } from '@/lib/money';
import { colors, semanticColors, font, spacing, radius } from '@/styles/tokens';
import { LoadingState } from '@/components/shared/LoadingState';
import { KpiGrid, KpiCard } from '@/components/shared/KpiGrid';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { getReviewInvestments, getInvestmentCategories, apiPut, getMarketPrices } from '@/lib/api';
import type { Purchase, InvestmentAccount, InvestmentCategory } from '@/types/entities';
import { InvestmentSection } from './InvestmentSection';
import { AddPurchaseModal } from './AddPurchaseModal';
import {
  TAXABLE_TYPES,
  RETIREMENT_TYPES,
  buildPositions,
  buildCategoryColorMap,
  fmtGain,
  fmtPct,
} from './investmentHelpers';

type InvCategoryDef = InvestmentCategory;

// ─── Styled components (page-level only) ─────────────────────────────────────

const SplitBarWrap = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: 14px 16px;
  margin-bottom: ${spacing[5]};
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
`;

const SplitBar = styled.div`
  display: flex;
  height: 14px;
  border-radius: 7px;
  overflow: hidden;
  margin: 8px 0 6px;
`;

const SplitSegment = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'pct' && p !== 'bg' })<{ pct: number; bg: string }>`
  width: ${({ pct }) => pct}%;
  background: ${({ bg }) => bg};
  transition: width 0.4s ease;
`;

const SplitLegend = styled.div`
  display: flex;
  gap: 20px;
  font-size: 11px;
  color: ${colors.textMuted};
`;

const LegendDot = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'bg' })<{ bg: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  &::before { content: ''; display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${({ bg }) => bg}; }
`;

const MarketStrip = styled.div`
  background: ${colors.navbar};
  border-radius: ${radius.lg};
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  gap: 16px;
  margin-bottom: ${spacing[5]};
  flex-wrap: wrap;
`;

const MarketTag = styled.span`
  font-size: 10px;
  color: ${colors.textDisabled};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-right: 4px;
`;

const MarketItem = styled.div`display: flex; flex-direction: column; gap: 1px;`;
const MarketName = styled.span`font-size: 10px; color: ${colors.textDisabled}; text-transform: uppercase; letter-spacing: 0.04em;`;
const MarketVal = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'up' })<{ up?: boolean }>`
  font-size: ${font.size.sm};
  font-weight: 600;
  color: ${({ up }) => up === undefined ? colors.bg : up ? semanticColors.successBright : semanticColors.dangerBright};
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvestmentsPage() {
  const params = useParams();
  const reviewId = params.id as string;
  const { state: reviewState } = useReviewStore();
  const { goNext, goBack, goSkip, saving } = useStepNav('investments');
  const readOnly = reviewState.activeReview?.status === 'COMPLETE' && !reviewState.isEditMode;

  const [accounts, setAccounts] = useState<InvestmentAccount[]>([]);
  const [invCategories, setInvCategories] = useState<InvCategoryDef[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [marketIndices, setMarketIndices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addDefaultAccountId, setAddDefaultAccountId] = useState<number | undefined>();

  useEffect(() => {
    Promise.all([
      getReviewInvestments(reviewId),
      getInvestmentCategories(),
    ])
      .then(([{ accounts: accs }, { categories: cats }]) => {
        setAccounts(accs ?? []);
        setInvCategories(cats ?? []);
      })
      .catch((e) => console.error('investments fetch:', e))
      .finally(() => setLoading(false));
  }, [reviewId]);

  // Fetch live prices once accounts are loaded
  const fetchPrices = useCallback(async (accs: InvestmentAccount[]) => {
    const allTickers = Array.from(new Set(accs.flatMap((a) => a.purchases.map((p) => p.ticker))));
    const indexTickers = ['SPY', 'QQQ', 'DIA'];
    const all = [...allTickers, ...indexTickers];
    if (all.length === 0) return;
    setPricesLoading(true);
    try {
      const { prices } = await getMarketPrices(all);
      // Split out index tickers
      const portfolio: Record<string, number> = {};
      const indices: Record<string, number> = {};
      for (const [ticker, price] of Object.entries(prices)) {
        if (indexTickers.includes(ticker)) indices[ticker] = price;
        else portfolio[ticker] = price;
      }
      setLivePrices(portfolio);
      setMarketIndices(indices);
    } finally {
      setPricesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accounts.length > 0) fetchPrices(accounts);
  }, [accounts, fetchPrices]);

  function handlePurchaseAdded(purchase: Purchase) {
    setAccounts((prev) =>
      prev.map((a) => a.id === purchase.accountId ? { ...a, purchases: [...a.purchases, purchase] } : a)
    );
    // Fetch price for new ticker if not already loaded
    if (!livePrices[purchase.ticker]) {
      getMarketPrices([purchase.ticker])
        .then(({ prices }) => {
          if (prices[purchase.ticker]) {
            setLivePrices((prev) => ({ ...prev, [purchase.ticker]: prices[purchase.ticker] }));
          }
        });
    }
  }

  async function handleSave() {
    const snapshots = accounts.flatMap((a) =>
      a.purchases.map((p) => {
        const price = livePrices[p.ticker] ?? 0;
        const value = Math.round(p.shares * price);
        const lotCostBasis = Math.round(p.shares * p.pricePerShare);
        return { purchaseId: p.id, price, value, gainLoss: value - lotCostBasis };
      })
    );
    await apiPut(`/api/reviews/${reviewId}/investments`, { snapshots });
    await goNext();
  }

  const taxableAccounts = useMemo(() => accounts.filter((a) => TAXABLE_TYPES.has(a.type)), [accounts]);
  const retirementAccounts = useMemo(() => accounts.filter((a) => RETIREMENT_TYPES.has(a.type)), [accounts]);

  const taxablePositions = useMemo(() => buildPositions(taxableAccounts, livePrices), [taxableAccounts, livePrices]);
  const retirementPositions = useMemo(() => buildPositions(retirementAccounts, livePrices), [retirementAccounts, livePrices]);

  const categoryColorMap = useMemo(() => buildCategoryColorMap(invCategories), [invCategories]);

  const taxableValue = taxablePositions.reduce((s, p) => s + p.currentValue, 0);
  const retirementValue = retirementPositions.reduce((s, p) => s + p.currentValue, 0);
  const totalValue = taxableValue + retirementValue;
  const totalGainLoss = [...taxablePositions, ...retirementPositions].reduce((s, p) => s + p.gainLoss, 0);
  const totalCostBasis = [...taxablePositions, ...retirementPositions].reduce((s, p) => s + p.totalCostBasis, 0);
  const totalGrowthPct = totalCostBasis > 0 ? totalGainLoss / totalCostBasis : 0;
  const taxablePct = totalValue > 0 ? (taxableValue / totalValue) * 100 : 50;
  const retirementPct = 100 - taxablePct;

  // Market index display (SPY ≈ S&P/10, QQQ ≈ NASDAQ/100, DIA ≈ DJIA/100)
  const sp500 = marketIndices['SPY'];
  const nasdaq = marketIndices['QQQ'];
  const djia = marketIndices['DIA'];

  if (loading) return <LoadingState centered />;

  return (
    <StepShell
      title="Investments"
      subtitle="Track and manage investment portfolio"
      stepName="Investments"
      onBack={goBack}
      onSkip={goSkip}
      onNext={handleSave}
      saving={saving}
      readOnly={readOnly}
    >
      {/* ── Combined Portfolio Summary ── */}
      <SectionHeader title="Combined Portfolio Summary" />

      <KpiGrid cols={4}>
        <KpiCard label="Total Value" value={pricesLoading ? '…' : formatDollars(totalValue)} sub={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`} />
        <KpiCard
          tone={totalGainLoss >= 0 ? 'success' : 'danger'}
          label="Total Gain / Loss"
          value={pricesLoading ? '…' : fmtGain(totalGainLoss)}
          sub="unrealized"
        />
        <KpiCard
          tone={totalGainLoss >= 0 ? 'success' : 'danger'}
          label="Growth %"
          value={pricesLoading ? '…' : fmtPct(totalGrowthPct)}
          sub="vs total cost basis"
        />
        <KpiCard label="Total Cost Basis" value={formatDollars(totalCostBasis)} sub="total invested" />
      </KpiGrid>

      <SplitBarWrap>
        <p style={{ fontSize: 10, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0' }}>Portfolio Split</p>
        <SplitBar>
          <SplitSegment pct={taxablePct} bg={colors.primary} />
          <SplitSegment pct={retirementPct} bg={semanticColors.successTextMedium} />
        </SplitBar>
        <SplitLegend>
          <LegendDot bg={colors.primary}>
            Investments: {formatDollars(taxableValue)} ({taxablePct.toFixed(0)}%)
          </LegendDot>
          <LegendDot bg={semanticColors.successTextMedium}>
            Retirement: {formatDollars(retirementValue)} ({retirementPct.toFixed(0)}%)
          </LegendDot>
        </SplitLegend>
      </SplitBarWrap>

      {/* ── Market Reference ── */}
      <MarketStrip>
        <MarketTag>Market</MarketTag>
        <MarketItem>
          <MarketName>S&amp;P 500 (SPY)</MarketName>
          <MarketVal up={sp500 !== undefined ? true : undefined}>
            {sp500 ? `$${toDollars(sp500).toFixed(2)}` : pricesLoading ? '…' : '—'}
          </MarketVal>
        </MarketItem>
        <MarketItem>
          <MarketName>NASDAQ (QQQ)</MarketName>
          <MarketVal up={nasdaq !== undefined ? true : undefined}>
            {nasdaq ? `$${toDollars(nasdaq).toFixed(2)}` : pricesLoading ? '…' : '—'}
          </MarketVal>
        </MarketItem>
        <MarketItem>
          <MarketName>DJIA (DIA)</MarketName>
          <MarketVal up={djia !== undefined ? true : undefined}>
            {djia ? `$${toDollars(djia).toFixed(2)}` : pricesLoading ? '…' : '—'}
          </MarketVal>
        </MarketItem>
        {!pricesLoading && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: semanticColors.neutralText }}>
            Live prices via Yahoo Finance
          </span>
        )}
        {pricesLoading && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: colors.textDisabled, fontStyle: 'italic' }}>
            Fetching live prices…
          </span>
        )}
      </MarketStrip>

      {/* ── Investment Accounts (Taxable) ── */}
      {taxableAccounts.length > 0 && (
        <InvestmentSection
          title="Investment Accounts (Taxable)"
          isRetirement={false}
          accounts={taxableAccounts}
          positions={taxablePositions}
          livePrices={livePrices}
          pricesLoading={pricesLoading}
          readOnly={readOnly}
          categoryColorMap={categoryColorMap}
          onAddPurchase={(id) => { setAddDefaultAccountId(id); setShowAddModal(true); }}
        />
      )}

      {/* ── Retirement Accounts ── */}
      {retirementAccounts.length > 0 && (
        <InvestmentSection
          title="Retirement Accounts"
          isRetirement
          accounts={retirementAccounts}
          positions={retirementPositions}
          livePrices={livePrices}
          pricesLoading={pricesLoading}
          readOnly={readOnly}
          categoryColorMap={categoryColorMap}
          onAddPurchase={(id) => { setAddDefaultAccountId(id); setShowAddModal(true); }}
        />
      )}

      {accounts.length === 0 && (
        <p style={{ color: colors.textMuted, fontStyle: 'italic' }}>
          No investment accounts configured. Add accounts via Settings.
        </p>
      )}

      {showAddModal && (
        <AddPurchaseModal
          accounts={accounts}
          categories={invCategories}
          defaultAccountId={addDefaultAccountId}
          onClose={() => setShowAddModal(false)}
          onAdded={handlePurchaseAdded}
        />
      )}
    </StepShell>
  );
}
