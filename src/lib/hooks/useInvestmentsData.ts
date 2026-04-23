'use client';

import { useEffect, useReducer, useMemo, useCallback } from 'react';
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
import type { Purchase } from '@/types/entities';
import type { RetirementAccountFormValues } from '@/app/(app)/review/[id]/investments/EditRetirementAccountModal';
import {
  TAXABLE_TYPES,
  RETIREMENT_TYPES,
  buildPositions,
  buildCategoryColorMap,
} from '@/app/(app)/review/[id]/investments/investmentHelpers';
import { investmentsReducer, initialInvestmentsState } from './investmentsReducer';

export function useInvestmentsData(reviewId: string) {
  const reviewIdNum = Number(reviewId);
  const [s, dispatch] = useReducer(investmentsReducer, initialInvestmentsState);

  useEffect(() => {
    Promise.all([
      getReviewInvestments(reviewId),
      getInvestmentCategories(),
      getMembers(),
    ])
      .then(([inv, { categories: cats }, { members: mems }]) => {
        dispatch({
          type: 'LOAD_SUCCESS',
          accounts: inv.accounts ?? [],
          invCategories: cats ?? [],
          members: mems ?? [],
          retirementSnapshots: inv.retirementSnapshots ?? [],
          allRetirementHistory: inv.allRetirementSnapshots ?? [],
          allReviews: inv.allReviews ?? [],
        });
      })
      .catch(() => dispatch({ type: 'LOAD_ERROR' }));
  }, [reviewId]);

  const fetchPrices = useCallback(async (accounts: typeof s.accounts) => {
    const taxableTickers = accounts
      .filter((a) => TAXABLE_TYPES.has(a.type))
      .flatMap((a) => a.purchases.map((p) => p.ticker));
    const allTickers = Array.from(new Set(taxableTickers));
    const indexTickers = ['SPY', 'QQQ', 'DIA'];
    const all = [...allTickers, ...indexTickers];
    if (all.length === 0) return;
    dispatch({ type: 'PRICES_LOADING' });
    try {
      const { prices } = await getMarketPrices(all);
      const livePrices: Record<string, number> = {};
      const marketIndices: Record<string, number> = {};
      for (const [ticker, price] of Object.entries(prices)) {
        if (indexTickers.includes(ticker)) marketIndices[ticker] = price;
        else livePrices[ticker] = price;
      }
      dispatch({ type: 'PRICES_SUCCESS', livePrices, marketIndices });
    } catch {
      dispatch({ type: 'PRICES_SUCCESS', livePrices: {}, marketIndices: {} });
    }
  }, []);

  useEffect(() => {
    if (s.accounts.length > 0) fetchPrices(s.accounts);
  }, [s.accounts, fetchPrices]);

  const handlePurchaseAdded = useCallback((purchase: Purchase) => {
    dispatch({ type: 'ADD_PURCHASE', purchase });
    if (!s.livePrices[purchase.ticker]) {
      getMarketPrices([purchase.ticker]).then(({ prices }) => {
        if (prices[purchase.ticker]) {
          dispatch({ type: 'SET_LIVE_PRICE', ticker: purchase.ticker, price: prices[purchase.ticker] });
        }
      });
    }
  }, [s.livePrices]);

  const taxableAccounts = useMemo(() => s.accounts.filter((a) => TAXABLE_TYPES.has(a.type)), [s.accounts]);
  const retirementAccounts = useMemo(() => s.accounts.filter((a) => RETIREMENT_TYPES.has(a.type)), [s.accounts]);
  const taxablePositions = useMemo(() => buildPositions(taxableAccounts, s.livePrices), [taxableAccounts, s.livePrices]);

  const retirementBalanceByAccount = useMemo(() => {
    const m: Record<number, number> = {};
    for (const snap of s.retirementSnapshots) m[snap.accountId] = snap.balance;
    return m;
  }, [s.retirementSnapshots]);

  const retirementHistoryByAccount = useMemo(() => {
    const m: Record<number, typeof s.allRetirementHistory> = {};
    for (const snap of s.allRetirementHistory) {
      if (!m[snap.accountId]) m[snap.accountId] = [];
      m[snap.accountId].push(snap);
    }
    return m;
  }, [s.allRetirementHistory]);

  const categoryColorMap = useMemo(() => buildCategoryColorMap(s.invCategories), [s.invCategories]);

  const taxableValue = taxablePositions.reduce((sum, p) => sum + p.currentValue, 0);
  const retirementValue = Object.values(retirementBalanceByAccount).reduce((sum, v) => sum + v, 0);
  const totalValue = taxableValue + retirementValue;
  const totalGainLoss = taxablePositions.reduce((sum, p) => sum + p.gainLoss, 0);
  const totalCostBasis = taxablePositions.reduce((sum, p) => sum + p.totalCostBasis, 0);
  const totalGrowthPct = totalCostBasis > 0 ? totalGainLoss / totalCostBasis : 0;
  const taxablePct = totalValue > 0 ? (taxableValue / totalValue) * 100 : 50;
  const retirementPct = 100 - taxablePct;

  const editingAccount = s.retirementModalAccountId
    ? s.accounts.find((a) => a.id === s.retirementModalAccountId)
    : undefined;

  const taxableTransferOptions = taxableAccounts.filter((a) => a.id !== s.deleteTaxableId);

  const toggleRetirementExpand = useCallback((id: number) => {
    dispatch({ type: 'TOGGLE_RETIREMENT_EXPAND', id });
  }, []);

  const saveRetirementBalance = useCallback(
    async (accountId: number, rid: number, balanceDollars: string) => {
      const cents = Math.round(Number(balanceDollars) * 100);
      if (!Number.isFinite(cents) || cents < 0) return;
      const { snapshot } = await upsertRetirementSnapshot({ accountId, reviewId: rid, balance: cents });
      dispatch({
        type: 'UPSERT_RETIREMENT_HISTORY',
        snapshot: { id: snapshot.id, accountId, reviewId: rid, balance: cents, review: snapshot.review },
        reviewIdNum,
        cents,
      });
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
      if (s.retirementModalMode === 'add') {
        const { account } = await createInvestmentAccount(values);
        dispatch({ type: 'ADD_ACCOUNT', account });
        dispatch({ type: 'TOGGLE_RETIREMENT_EXPAND', id: account.id });
      } else if (s.retirementModalMode === 'edit' && s.retirementModalAccountId) {
        const { account } = await updateInvestmentAccount(s.retirementModalAccountId, values);
        dispatch({ type: 'UPDATE_ACCOUNT', account });
      }
    },
    [s.retirementModalMode, s.retirementModalAccountId],
  );

  const confirmDelete = useCallback(async () => {
    if (s.deleteAccountId == null) return;
    dispatch({ type: 'SET_DELETING', value: true });
    try {
      await apiDelete(`/api/config/investment-accounts/${s.deleteAccountId}`, { force: true });
      dispatch({ type: 'REMOVE_RETIREMENT_DATA', accountId: s.deleteAccountId });
      dispatch({ type: 'CLOSE_DELETE_RETIREMENT' });
    } finally {
      dispatch({ type: 'SET_DELETING', value: false });
    }
  }, [s.deleteAccountId]);

  const openTaxableModal = useCallback((mode: 'add' | 'edit', accountId?: number) => {
    const acc = accountId ? s.accounts.find((a) => a.id === accountId) : undefined;
    dispatch({
      type: 'OPEN_TAXABLE_MODAL',
      mode,
      accountId: accountId ?? null,
      form: { name: acc?.name ?? '', institution: acc?.institution ?? '', ownerMemberId: acc?.ownerMemberId ?? null },
    });
  }, [s.accounts]);

  const handleSubmitTaxableAccount = useCallback(async () => {
    if (!s.taxableAccForm.name.trim()) return;
    dispatch({ type: 'SET_SAVING_TAXABLE', value: true });
    try {
      if (s.taxableModalMode === 'add') {
        const { account } = await createInvestmentAccount({ ...s.taxableAccForm, type: 'TAXABLE' });
        dispatch({ type: 'ADD_ACCOUNT', account });
      } else if (s.taxableModalAccountId) {
        const { account } = await updateInvestmentAccount(s.taxableModalAccountId, s.taxableAccForm);
        dispatch({ type: 'UPDATE_ACCOUNT', account });
      }
      dispatch({ type: 'CLOSE_TAXABLE_MODAL' });
    } finally {
      dispatch({ type: 'SET_SAVING_TAXABLE', value: false });
    }
  }, [s.taxableAccForm, s.taxableModalMode, s.taxableModalAccountId]);

  const initiateTaxableDelete = useCallback(async (accountId: number) => {
    try {
      const result = await deleteInvestmentAccount(accountId);
      if (result?.ok) {
        dispatch({ type: 'REMOVE_ACCOUNT', id: accountId });
      }
    } catch (e: unknown) {
      const payload = (e as { payload?: { inUse?: boolean; purchaseCount?: number } })?.payload;
      if (payload?.inUse) {
        dispatch({ type: 'OPEN_DELETE_TAXABLE', id: accountId, purchaseCount: payload.purchaseCount ?? 0 });
      }
    }
  }, []);

  const confirmTaxableDelete = useCallback(async () => {
    if (s.deleteTaxableId == null) return;
    dispatch({ type: 'SET_DELETING_TAXABLE', value: true });
    try {
      const result = await deleteInvestmentAccount(s.deleteTaxableId, s.taxableTransferToId ?? undefined);
      if (result?.ok) {
        dispatch({ type: 'REMOVE_ACCOUNT', id: s.deleteTaxableId });
        dispatch({ type: 'CLOSE_DELETE_TAXABLE' });
      }
    } finally {
      dispatch({ type: 'SET_DELETING_TAXABLE', value: false });
    }
  }, [s.deleteTaxableId, s.taxableTransferToId]);

  async function buildSavePayload() {
    const taxableAccountIds = new Set(taxableAccounts.map((a) => a.id));
    const snapshots = s.accounts
      .filter((a) => taxableAccountIds.has(a.id))
      .flatMap((a) =>
        a.purchases.map((p) => {
          const price = s.livePrices[p.ticker] ?? 0;
          const value = Math.round(p.shares * price);
          const lotCostBasis = Math.round(p.shares * p.pricePerShare);
          return { purchaseId: p.id, price, value, gainLoss: value - lotCostBasis };
        })
      );
    const retirementPayload = s.retirementSnapshots.map((snap) => ({ accountId: snap.accountId, balance: snap.balance }));
    await apiPut(`/api/reviews/${reviewId}/investments`, { snapshots, retirementSnapshots: retirementPayload });
  }

  return {
    // loading state
    loading: s.loading,
    loadError: s.loadError,
    // data
    accounts: s.accounts,
    members: s.members,
    invCategories: s.invCategories,
    allReviews: s.allReviews,
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
    sp500: s.marketIndices['SPY'],
    nasdaq: s.marketIndices['QQQ'],
    djia: s.marketIndices['DIA'],
    livePrices: s.livePrices,
    pricesLoading: s.pricesLoading,
    reviewIdNum,
    // add purchase modal
    showAddModal: s.showAddModal,
    setShowAddModal: (open: boolean) => dispatch(open ? { type: 'OPEN_ADD_PURCHASE', accountId: undefined } : { type: 'CLOSE_ADD_PURCHASE' }),
    addDefaultAccountId: s.addDefaultAccountId,
    setAddDefaultAccountId: (id: number | undefined) => dispatch({ type: 'OPEN_ADD_PURCHASE', accountId: id }),
    handlePurchaseAdded,
    // retirement state
    expandedRetirementIds: s.expandedRetirementIds,
    retirementModalMode: s.retirementModalMode,
    setRetirementModalMode: (mode: 'add' | 'edit' | null) => dispatch(mode ? { type: 'OPEN_RETIREMENT_MODAL', mode, accountId: s.retirementModalAccountId } : { type: 'CLOSE_RETIREMENT_MODAL' }),
    retirementModalAccountId: s.retirementModalAccountId,
    setRetirementModalAccountId: (id: number | null) => dispatch({ type: 'OPEN_RETIREMENT_MODAL', mode: s.retirementModalMode ?? 'add', accountId: id }),
    deleteAccountId: s.deleteAccountId,
    setDeleteAccountId: (id: number | null) => id != null ? dispatch({ type: 'OPEN_DELETE_RETIREMENT', accountId: id }) : dispatch({ type: 'CLOSE_DELETE_RETIREMENT' }),
    deleting: s.deleting,
    editingAccount,
    // retirement handlers
    toggleRetirementExpand,
    saveRetirementBalance,
    addRetirementHistoryRow,
    handleSubmitRetirementAccount,
    confirmDelete,
    // taxable state
    taxableModalMode: s.taxableModalMode,
    setTaxableModalMode: (mode: 'add' | 'edit' | null) => mode ? dispatch({ type: 'OPEN_TAXABLE_MODAL', mode, accountId: s.taxableModalAccountId, form: s.taxableAccForm }) : dispatch({ type: 'CLOSE_TAXABLE_MODAL' }),
    taxableAccForm: s.taxableAccForm,
    setTaxableAccForm: (updater: ((prev: typeof s.taxableAccForm) => typeof s.taxableAccForm) | typeof s.taxableAccForm) => {
      const form = typeof updater === 'function' ? updater(s.taxableAccForm) : updater;
      dispatch({ type: 'SET_TAXABLE_FORM', form });
    },
    savingTaxable: s.savingTaxable,
    deleteTaxableId: s.deleteTaxableId,
    setDeleteTaxableId: (id: number | null) => id != null ? dispatch({ type: 'OPEN_DELETE_TAXABLE', id, purchaseCount: s.taxableDeletePurchaseCount }) : dispatch({ type: 'CLOSE_DELETE_TAXABLE' }),
    deletingTaxable: s.deletingTaxable,
    taxableDeletePurchaseCount: s.taxableDeletePurchaseCount,
    taxableTransferToId: s.taxableTransferToId,
    setTaxableTransferToId: (id: number | null) => dispatch({ type: 'SET_TAXABLE_TRANSFER_TO', id }),
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
