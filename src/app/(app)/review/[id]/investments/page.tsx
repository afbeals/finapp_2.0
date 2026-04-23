'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
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
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Label, Select, FormGroup } from '@/components/ui/Input';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import {
  getReviewInvestments,
  getInvestmentCategories,
  getMembers,
  apiPut,
  apiDelete,
  getMarketPrices,
  createInvestmentAccount,
  updateInvestmentAccount,
  deleteInvestmentAccount,
  upsertRetirementSnapshot,
} from '@/lib/api';
import type {
  Purchase,
  InvestmentAccount,
  InvestmentCategory,
  Member,
  HistoricalRetirementSnapshot,
  RetirementSnapshot,
} from '@/types/entities';
import { InvestmentSection } from './InvestmentSection';
import { AddPurchaseModal } from './AddPurchaseModal';
import { RetirementAccountCard } from './RetirementAccountCard';
import {
  EditRetirementAccountModal,
  type RetirementAccountFormValues,
} from './EditRetirementAccountModal';
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
  const reviewIdNum = Number(reviewId);
  const { state: reviewState } = useReviewStore();
  const { goNext, goBack, goSkip, saving } = useStepNav('investments');
  const readOnly = reviewState.activeReview?.status === 'COMPLETE' && !reviewState.isEditMode;

  const [accounts, setAccounts] = useState<InvestmentAccount[]>([]);
  const [invCategories, setInvCategories] = useState<InvCategoryDef[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [allRetirementHistory, setAllRetirementHistory] = useState<HistoricalRetirementSnapshot[]>([]);
  const [retirementSnapshots, setRetirementSnapshots] = useState<RetirementSnapshot[]>([]);
  const [allReviews, setAllReviews] = useState<{ id: number; periodYear: number; periodMonth: number }[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [marketIndices, setMarketIndices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addDefaultAccountId, setAddDefaultAccountId] = useState<number | undefined>();

  const [expandedRetirementIds, setExpandedRetirementIds] = useState<Set<number>>(new Set());
  const [retirementModalMode, setRetirementModalMode] = useState<'add' | 'edit' | null>(null);
  const [retirementModalAccountId, setRetirementModalAccountId] = useState<number | null>(null);
  const [deleteAccountId, setDeleteAccountId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Taxable account CRUD
  const [taxableModalMode, setTaxableModalMode] = useState<'add' | 'edit' | null>(null);
  const [taxableModalAccountId, setTaxableModalAccountId] = useState<number | null>(null);
  const [taxableAccForm, setTaxableAccForm] = useState({ name: '', institution: '', ownerMemberId: null as number | null });
  const [savingTaxable, setSavingTaxable] = useState(false);
  const [deleteTaxableId, setDeleteTaxableId] = useState<number | null>(null);
  const [deletingTaxable, setDeletingTaxable] = useState(false);
  const [taxableDeletePurchaseCount, setTaxableDeletePurchaseCount] = useState(0);
  const [taxableTransferToId, setTaxableTransferToId] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      getReviewInvestments(reviewId),
      getInvestmentCategories(),
      getMembers(),
    ])
      .then(([inv, { categories: cats }, { members: mems }]) => {
        setAccounts(inv.accounts ?? []);
        setInvCategories(cats ?? []);
        setMembers(mems ?? []);
        setRetirementSnapshots(inv.retirementSnapshots ?? []);
        setAllRetirementHistory(inv.allRetirementSnapshots ?? []);
        setAllReviews(inv.allReviews ?? []);
      })
      .catch((e) => console.error('investments fetch:', e))
      .finally(() => setLoading(false));
  }, [reviewId]);

  // Fetch live prices once accounts are loaded (only for taxable — retirement no longer uses lots)
  const fetchPrices = useCallback(async (accs: InvestmentAccount[]) => {
    const taxableTickers = accs
      .filter((a) => TAXABLE_TYPES.has(a.type))
      .flatMap((a) => a.purchases.map((p) => p.ticker));
    const allTickers = Array.from(new Set(taxableTickers));
    const indexTickers = ['SPY', 'QQQ', 'DIA'];
    const all = [...allTickers, ...indexTickers];
    if (all.length === 0) return;
    setPricesLoading(true);
    try {
      const { prices } = await getMarketPrices(all);
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
    const taxableAccountIds = new Set(taxableAccounts.map((a) => a.id));
    const snapshots = accounts
      .filter((a) => taxableAccountIds.has(a.id))
      .flatMap((a) =>
        a.purchases.map((p) => {
          const price = livePrices[p.ticker] ?? 0;
          const value = Math.round(p.shares * price);
          const lotCostBasis = Math.round(p.shares * p.pricePerShare);
          return { purchaseId: p.id, price, value, gainLoss: value - lotCostBasis };
        })
      );
    const retirementPayload = retirementSnapshots.map((s) => ({ accountId: s.accountId, balance: s.balance }));
    await apiPut(`/api/reviews/${reviewId}/investments`, {
      snapshots,
      retirementSnapshots: retirementPayload,
    });
    await goNext();
  }

  const taxableAccounts = useMemo(() => accounts.filter((a) => TAXABLE_TYPES.has(a.type)), [accounts]);
  const retirementAccounts = useMemo(() => accounts.filter((a) => RETIREMENT_TYPES.has(a.type)), [accounts]);

  const taxablePositions = useMemo(() => buildPositions(taxableAccounts, livePrices), [taxableAccounts, livePrices]);

  const retirementBalanceByAccount = useMemo(() => {
    const m: Record<number, number> = {};
    for (const s of retirementSnapshots) m[s.accountId] = s.balance;
    return m;
  }, [retirementSnapshots]);

  const retirementHistoryByAccount = useMemo(() => {
    const m: Record<number, HistoricalRetirementSnapshot[]> = {};
    for (const s of allRetirementHistory) {
      if (!m[s.accountId]) m[s.accountId] = [];
      m[s.accountId].push(s);
    }
    return m;
  }, [allRetirementHistory]);

  const categoryColorMap = useMemo(() => buildCategoryColorMap(invCategories), [invCategories]);

  const taxableValue = taxablePositions.reduce((s, p) => s + p.currentValue, 0);
  const retirementValue = Object.values(retirementBalanceByAccount).reduce((s, v) => s + v, 0);
  const totalValue = taxableValue + retirementValue;
  const totalGainLoss = taxablePositions.reduce((s, p) => s + p.gainLoss, 0);
  const totalCostBasis = taxablePositions.reduce((s, p) => s + p.totalCostBasis, 0);
  const totalGrowthPct = totalCostBasis > 0 ? totalGainLoss / totalCostBasis : 0;
  const taxablePct = totalValue > 0 ? (taxableValue / totalValue) * 100 : 50;
  const retirementPct = 100 - taxablePct;

  const sp500 = marketIndices['SPY'];
  const nasdaq = marketIndices['QQQ'];
  const djia = marketIndices['DIA'];

  const toggleRetirementExpand = useCallback((id: number) => {
    setExpandedRetirementIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const saveRetirementBalance = useCallback(
    async (accountId: number, rid: number, balanceDollars: string) => {
      const cents = Math.round(Number(balanceDollars) * 100);
      if (!Number.isFinite(cents) || cents < 0) return;
      const { snapshot } = await upsertRetirementSnapshot({ accountId, reviewId: rid, balance: cents });
      setAllRetirementHistory((prev) => {
        const i = prev.findIndex((r) => r.accountId === accountId && r.reviewId === rid);
        const hist: HistoricalRetirementSnapshot = {
          id: snapshot.id,
          accountId,
          reviewId: rid,
          balance: cents,
          review: snapshot.review,
        };
        if (i === -1) return [...prev, hist];
        const next = [...prev];
        next[i] = hist;
        return next;
      });
      if (rid === reviewIdNum) {
        setRetirementSnapshots((prev) => {
          const i = prev.findIndex((r) => r.accountId === accountId);
          const row = { id: snapshot.id, accountId, reviewId: rid, balance: cents };
          if (i === -1) return [...prev, row];
          const next = [...prev];
          next[i] = row;
          return next;
        });
      }
    },
    [reviewIdNum],
  );

  const addRetirementHistoryRow = useCallback(
    async (accountId: number, rid: number) => {
      await saveRetirementBalance(accountId, rid, '0');
    },
    [saveRetirementBalance],
  );

  const handleSubmitRetirementAccount = useCallback(
    async (values: RetirementAccountFormValues) => {
      if (retirementModalMode === 'add') {
        const { account } = await createInvestmentAccount(values);
        setAccounts((prev) => [...prev, { ...account, purchases: [] }]);
        setExpandedRetirementIds((prev) => new Set(prev).add(account.id));
      } else if (retirementModalMode === 'edit' && retirementModalAccountId) {
        const { account } = await updateInvestmentAccount(retirementModalAccountId, values);
        setAccounts((prev) =>
          prev.map((a) =>
            a.id === account.id ? { ...account, purchases: a.purchases } : a,
          ),
        );
      }
    },
    [retirementModalMode, retirementModalAccountId],
  );

  const confirmDelete = useCallback(async () => {
    if (deleteAccountId == null) return;
    setDeleting(true);
    try {
      await apiDelete(`/api/config/investment-accounts/${deleteAccountId}`, { force: true });
      setAccounts((prev) => prev.filter((a) => a.id !== deleteAccountId));
      setRetirementSnapshots((prev) => prev.filter((s) => s.accountId !== deleteAccountId));
      setAllRetirementHistory((prev) => prev.filter((s) => s.accountId !== deleteAccountId));
      setDeleteAccountId(null);
    } finally {
      setDeleting(false);
    }
  }, [deleteAccountId]);

  const editingAccount = retirementModalAccountId
    ? accounts.find((a) => a.id === retirementModalAccountId)
    : undefined;

  function openTaxableModal(mode: 'add' | 'edit', accountId?: number) {
    const acc = accountId ? accounts.find((a) => a.id === accountId) : undefined;
    setTaxableAccForm({
      name: acc?.name ?? '',
      institution: acc?.institution ?? '',
      ownerMemberId: acc?.ownerMemberId ?? null,
    });
    setTaxableModalAccountId(accountId ?? null);
    setTaxableModalMode(mode);
  }

  async function handleSubmitTaxableAccount() {
    if (!taxableAccForm.name.trim()) return;
    setSavingTaxable(true);
    try {
      if (taxableModalMode === 'add') {
        const { account } = await createInvestmentAccount({ ...taxableAccForm, type: 'TAXABLE' });
        setAccounts((prev) => [...prev, { ...account, purchases: [] }]);
      } else if (taxableModalAccountId) {
        const { account } = await updateInvestmentAccount(taxableModalAccountId, taxableAccForm);
        setAccounts((prev) => prev.map((a) => a.id === account.id ? { ...account, purchases: a.purchases } : a));
      }
      setTaxableModalMode(null);
    } finally {
      setSavingTaxable(false);
    }
  }

  async function initiateTaxableDelete(accountId: number) {
    const result = await deleteInvestmentAccount(accountId).catch((e) => e);
    if (result?.inUse) {
      setTaxableDeletePurchaseCount(result.purchaseCount ?? 0);
      setTaxableTransferToId(null);
      setDeleteTaxableId(accountId);
    } else if (result?.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    }
  }

  async function confirmTaxableDelete() {
    if (deleteTaxableId == null) return;
    setDeletingTaxable(true);
    try {
      const result = await deleteInvestmentAccount(
        deleteTaxableId,
        taxableTransferToId ?? undefined,
      ).catch(() => null);
      if (result?.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== deleteTaxableId));
        setDeleteTaxableId(null);
      }
    } finally {
      setDeletingTaxable(false);
    }
  }

  const taxableTransferOptions = taxableAccounts.filter((a) => a.id !== deleteTaxableId);

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
          label="Taxable Gain / Loss"
          value={pricesLoading ? '…' : fmtGain(totalGainLoss)}
          sub="unrealized"
        />
        <KpiCard
          tone={totalGainLoss >= 0 ? 'success' : 'danger'}
          label="Taxable Growth %"
          value={pricesLoading ? '…' : fmtPct(totalGrowthPct)}
          sub="vs taxable cost basis"
        />
        <KpiCard label="Taxable Cost Basis" value={formatDollars(totalCostBasis)} sub="total invested" />
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
      <SectionHeader
        title="Investment Accounts (Taxable)"
        actions={
          !readOnly && (
            <Button size="sm" onClick={() => openTaxableModal('add')}>+ Add Account</Button>
          )
        }
      />
      {taxableAccounts.length === 0 && (
        <p style={{ color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing[3] }}>
          No taxable investment accounts yet.
        </p>
      )}
      {taxableAccounts.length > 0 && (
        <InvestmentSection
          title=""
          isRetirement={false}
          accounts={taxableAccounts}
          positions={taxablePositions}
          livePrices={livePrices}
          pricesLoading={pricesLoading}
          readOnly={readOnly}
          categoryColorMap={categoryColorMap}
          onAddPurchase={(id) => { setAddDefaultAccountId(id); setShowAddModal(true); }}
          onEditAccount={!readOnly ? (id) => openTaxableModal('edit', id) : undefined}
          onDeleteAccount={!readOnly ? (id) => initiateTaxableDelete(id) : undefined}
        />
      )}

      {/* ── Retirement Accounts ── */}
      <SectionHeader title="Retirement Accounts" />
      {retirementAccounts.map((account) => (
        <RetirementAccountCard
          key={account.id}
          account={account}
          currentBalance={retirementBalanceByAccount[account.id] ?? 0}
          history={retirementHistoryByAccount[account.id] ?? []}
          allReviews={allReviews}
          currentReviewId={reviewIdNum}
          readOnly={readOnly}
          isExpanded={expandedRetirementIds.has(account.id)}
          onToggleExpand={toggleRetirementExpand}
          onSaveBalance={saveRetirementBalance}
          onAddHistoryRow={addRetirementHistoryRow}
          onEdit={(id) => { setRetirementModalAccountId(id); setRetirementModalMode('edit'); }}
          onDelete={(id) => setDeleteAccountId(id)}
        />
      ))}

      {retirementAccounts.length === 0 && (
        <p style={{ color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing[3] }}>
          No retirement accounts yet. Add one below.
        </p>
      )}

      {!readOnly && (
        <Button
          onClick={() => { setRetirementModalAccountId(null); setRetirementModalMode('add'); }}
          style={{ marginTop: spacing[3] }}
        >
          + Add Retirement Account
        </Button>
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

      <EditRetirementAccountModal
        isOpen={retirementModalMode !== null}
        onClose={() => { setRetirementModalMode(null); setRetirementModalAccountId(null); }}
        onSubmit={handleSubmitRetirementAccount}
        members={members}
        initialValues={editingAccount}
        mode={retirementModalMode ?? 'add'}
      />

      <ConfirmModal
        isOpen={deleteAccountId !== null}
        onClose={() => setDeleteAccountId(null)}
        onConfirm={confirmDelete}
        title="Delete Retirement Account"
        message="This will remove the account and all of its snapshots. This cannot be undone."
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        confirmVariant="danger"
        loading={deleting}
      />

      {/* Add / Edit Taxable Account Modal */}
      <Modal
        isOpen={taxableModalMode !== null}
        onClose={() => setTaxableModalMode(null)}
        title={taxableModalMode === 'add' ? 'Add Investment Account' : 'Edit Investment Account'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTaxableModalMode(null)}>Cancel</Button>
            <Button onClick={handleSubmitTaxableAccount} disabled={savingTaxable || !taxableAccForm.name.trim()}>
              {savingTaxable ? 'Saving…' : taxableModalMode === 'add' ? 'Add Account' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <FormGroup>
          <Label>Name *</Label>
          <Input
            value={taxableAccForm.name}
            onChange={(e) => setTaxableAccForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Fidelity Brokerage"
          />
        </FormGroup>
        <FormGroup>
          <Label>Institution</Label>
          <Input
            value={taxableAccForm.institution}
            onChange={(e) => setTaxableAccForm((f) => ({ ...f, institution: e.target.value }))}
            placeholder="e.g. Fidelity"
          />
        </FormGroup>
        <FormGroup>
          <Label>Owner</Label>
          <Select
            value={taxableAccForm.ownerMemberId ?? ''}
            onChange={(e) => setTaxableAccForm((f) => ({ ...f, ownerMemberId: e.target.value ? Number(e.target.value) : null }))}
          >
            <option value="">— unassigned —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </FormGroup>
      </Modal>

      {/* Delete Taxable Account Confirm */}
      {deleteTaxableId !== null && (
        <Modal
          isOpen
          onClose={() => setDeleteTaxableId(null)}
          title="Delete Investment Account"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteTaxableId(null)}>Cancel</Button>
              <Button
                variant="danger"
                onClick={confirmTaxableDelete}
                disabled={deletingTaxable || (taxableDeletePurchaseCount > 0 && taxableTransferToId == null)}
              >
                {deletingTaxable ? 'Deleting…' : 'Delete Account'}
              </Button>
            </>
          }
        >
          {taxableDeletePurchaseCount > 0 ? (
            <>
              <p style={{ marginBottom: spacing[4] }}>
                This account has <strong>{taxableDeletePurchaseCount} purchase lot{taxableDeletePurchaseCount !== 1 ? 's' : ''}</strong>.
                Transfer them to another account before deleting.
              </p>
              <FormGroup>
                <Label>Transfer purchases to *</Label>
                <Select
                  value={taxableTransferToId ?? ''}
                  onChange={(e) => setTaxableTransferToId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">— select an account —</option>
                  {taxableTransferOptions.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </Select>
              </FormGroup>
              {taxableTransferOptions.length === 0 && (
                <p style={{ fontSize: font.size.sm, color: colors.danger, marginTop: spacing[2] }}>
                  No other accounts available. Add another account first.
                </p>
              )}
            </>
          ) : (
            <p>This will permanently delete the account. This cannot be undone.</p>
          )}
        </Modal>
      )}
    </StepShell>
  );
}
