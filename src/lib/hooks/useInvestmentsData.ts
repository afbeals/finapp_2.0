'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
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
import type { RetirementAccountFormValues } from '@/app/(app)/review/[id]/investments/EditRetirementAccountModal';
import {
  TAXABLE_TYPES,
  RETIREMENT_TYPES,
  buildPositions,
  buildCategoryColorMap,
} from '@/app/(app)/review/[id]/investments/investmentHelpers';

export function useInvestmentsData(reviewId: string) {
  const reviewIdNum = Number(reviewId);

  const [accounts, setAccounts] = useState<InvestmentAccount[]>([]);
  const [invCategories, setInvCategories] = useState<InvestmentCategory[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [allRetirementHistory, setAllRetirementHistory] = useState<HistoricalRetirementSnapshot[]>([]);
  const [retirementSnapshots, setRetirementSnapshots] = useState<RetirementSnapshot[]>([]);
  const [allReviews, setAllReviews] = useState<{ id: number; periodYear: number; periodMonth: number }[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [marketIndices, setMarketIndices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addDefaultAccountId, setAddDefaultAccountId] = useState<number | undefined>();

  const [expandedRetirementIds, setExpandedRetirementIds] = useState<Set<number>>(new Set());
  const [retirementModalMode, setRetirementModalMode] = useState<'add' | 'edit' | null>(null);
  const [retirementModalAccountId, setRetirementModalAccountId] = useState<number | null>(null);
  const [deleteAccountId, setDeleteAccountId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [reviewId]);

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

  const handlePurchaseAdded = useCallback((purchase: Purchase) => {
    setAccounts((prev) =>
      prev.map((a) => a.id === purchase.accountId ? { ...a, purchases: [...a.purchases, purchase] } : a)
    );
    if (!livePrices[purchase.ticker]) {
      getMarketPrices([purchase.ticker]).then(({ prices }) => {
        if (prices[purchase.ticker]) {
          setLivePrices((prev) => ({ ...prev, [purchase.ticker]: prices[purchase.ticker] }));
        }
      });
    }
  }, [livePrices]);

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

  const editingAccount = retirementModalAccountId
    ? accounts.find((a) => a.id === retirementModalAccountId)
    : undefined;

  const taxableTransferOptions = taxableAccounts.filter((a) => a.id !== deleteTaxableId);

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
          prev.map((a) => a.id === account.id ? { ...account, purchases: a.purchases } : a),
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

  const openTaxableModal = useCallback((mode: 'add' | 'edit', accountId?: number) => {
    const acc = accountId ? accounts.find((a) => a.id === accountId) : undefined;
    setTaxableAccForm({
      name: acc?.name ?? '',
      institution: acc?.institution ?? '',
      ownerMemberId: acc?.ownerMemberId ?? null,
    });
    setTaxableModalAccountId(accountId ?? null);
    setTaxableModalMode(mode);
  }, [accounts]);

  const handleSubmitTaxableAccount = useCallback(async () => {
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
  }, [taxableAccForm, taxableModalMode, taxableModalAccountId]);

  const initiateTaxableDelete = useCallback(async (accountId: number) => {
    try {
      const result = await deleteInvestmentAccount(accountId);
      if (result?.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== accountId));
      }
    } catch (e: unknown) {
      const payload = (e as { payload?: { inUse?: boolean; purchaseCount?: number } })?.payload;
      if (payload?.inUse) {
        setTaxableDeletePurchaseCount(payload.purchaseCount ?? 0);
        setTaxableTransferToId(null);
        setDeleteTaxableId(accountId);
      }
    }
  }, []);

  const confirmTaxableDelete = useCallback(async () => {
    if (deleteTaxableId == null) return;
    setDeletingTaxable(true);
    try {
      const result = await deleteInvestmentAccount(deleteTaxableId, taxableTransferToId ?? undefined);
      if (result?.ok) {
        setAccounts((prev) => prev.filter((a) => a.id !== deleteTaxableId));
        setDeleteTaxableId(null);
      }
    } finally {
      setDeletingTaxable(false);
    }
  }, [deleteTaxableId, taxableTransferToId]);

  async function buildSavePayload() {
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
    await apiPut(`/api/reviews/${reviewId}/investments`, { snapshots, retirementSnapshots: retirementPayload });
  }

  return {
    // loading state
    loading,
    loadError,
    // data
    accounts,
    members,
    invCategories,
    allReviews,
    // derived
    taxableAccounts,
    retirementAccounts,
    taxablePositions,
    retirementBalanceByAccount,
    retirementHistoryByAccount,
    categoryColorMap,
    taxableValue,
    retirementValue,
    totalValue,
    totalGainLoss,
    totalCostBasis,
    totalGrowthPct,
    taxablePct,
    retirementPct,
    sp500,
    nasdaq,
    djia,
    livePrices,
    pricesLoading,
    reviewIdNum,
    // add purchase modal
    showAddModal,
    setShowAddModal,
    addDefaultAccountId,
    setAddDefaultAccountId,
    handlePurchaseAdded,
    // retirement state
    expandedRetirementIds,
    retirementModalMode,
    setRetirementModalMode,
    retirementModalAccountId,
    setRetirementModalAccountId,
    deleteAccountId,
    setDeleteAccountId,
    deleting,
    editingAccount,
    // retirement handlers
    toggleRetirementExpand,
    saveRetirementBalance,
    addRetirementHistoryRow,
    handleSubmitRetirementAccount,
    confirmDelete,
    // taxable state
    taxableModalMode,
    setTaxableModalMode,
    taxableAccForm,
    setTaxableAccForm,
    savingTaxable,
    deleteTaxableId,
    setDeleteTaxableId,
    deletingTaxable,
    taxableDeletePurchaseCount,
    taxableTransferToId,
    setTaxableTransferToId,
    taxableTransferOptions,
    // taxable handlers
    openTaxableModal,
    handleSubmitTaxableAccount,
    initiateTaxableDelete,
    confirmTaxableDelete,
    // save
    buildSavePayload,
  };
}
