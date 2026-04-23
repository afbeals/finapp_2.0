import { describe, it, expect } from 'vitest';
import { investmentsReducer, initialInvestmentsState } from '@/lib/hooks/investmentsReducer';
import type { InvestmentsState } from '@/lib/hooks/investmentsReducer';
import type { InvestmentAccount, InvestmentCategory, Member } from '@/types/entities';

function makeAccount(overrides: Partial<InvestmentAccount> = {}): InvestmentAccount {
  return {
    id: 1,
    name: 'Test',
    institution: '',
    type: 'TAXABLE',
    ownerMemberId: null,
    purchases: [],
    ...overrides,
  } as unknown as InvestmentAccount;
}

describe('investmentsReducer', () => {
  it('LOAD_SUCCESS sets data and clears loading', () => {
    const account = makeAccount();
    const result = investmentsReducer(initialInvestmentsState, {
      type: 'LOAD_SUCCESS',
      accounts: [account],
      invCategories: [] as InvestmentCategory[],
      members: [] as Member[],
      retirementSnapshots: [],
      allRetirementHistory: [],
      allReviews: [],
    });
    expect(result.loading).toBe(false);
    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0].id).toBe(1);
  });

  it('LOAD_ERROR sets loadError and clears loading', () => {
    const result = investmentsReducer(initialInvestmentsState, { type: 'LOAD_ERROR' });
    expect(result.loading).toBe(false);
    expect(result.loadError).toBe(true);
  });

  it('ADD_ACCOUNT appends account with empty purchases', () => {
    const account = makeAccount({ id: 5, name: 'New' });
    const result = investmentsReducer(initialInvestmentsState, { type: 'ADD_ACCOUNT', account });
    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0].purchases).toEqual([]);
  });

  it('UPDATE_ACCOUNT replaces account metadata preserving purchases', () => {
    const existing = makeAccount({ id: 2, name: 'Old', purchases: [{ id: 99 }] as never });
    const updated = makeAccount({ id: 2, name: 'Updated', institution: 'Fidelity' });
    const state: InvestmentsState = { ...initialInvestmentsState, accounts: [existing] };
    const result = investmentsReducer(state, { type: 'UPDATE_ACCOUNT', account: updated });
    expect(result.accounts[0].name).toBe('Updated');
    expect(result.accounts[0].purchases).toHaveLength(1);
  });

  it('REMOVE_ACCOUNT filters out by id', () => {
    const state: InvestmentsState = { ...initialInvestmentsState, accounts: [makeAccount({ id: 3 }), makeAccount({ id: 4 })] };
    const result = investmentsReducer(state, { type: 'REMOVE_ACCOUNT', id: 3 });
    expect(result.accounts).toHaveLength(1);
    expect(result.accounts[0].id).toBe(4);
  });

  it('PRICES_SUCCESS sets livePrices and marketIndices, clears pricesLoading', () => {
    const loading: InvestmentsState = { ...initialInvestmentsState, pricesLoading: true };
    const result = investmentsReducer(loading, {
      type: 'PRICES_SUCCESS',
      livePrices: { AAPL: 15000 },
      marketIndices: { SPY: 52000 },
    });
    expect(result.pricesLoading).toBe(false);
    expect(result.livePrices['AAPL']).toBe(15000);
    expect(result.marketIndices['SPY']).toBe(52000);
  });

  it('TOGGLE_RETIREMENT_EXPAND adds then removes id', () => {
    let result = investmentsReducer(initialInvestmentsState, { type: 'TOGGLE_RETIREMENT_EXPAND', id: 7 });
    expect(result.expandedRetirementIds.has(7)).toBe(true);
    result = investmentsReducer(result, { type: 'TOGGLE_RETIREMENT_EXPAND', id: 7 });
    expect(result.expandedRetirementIds.has(7)).toBe(false);
  });

  it('OPEN_DELETE_TAXABLE / CLOSE_DELETE_TAXABLE manage dialog state', () => {
    const opened = investmentsReducer(initialInvestmentsState, { type: 'OPEN_DELETE_TAXABLE', id: 10, purchaseCount: 3 });
    expect(opened.deleteTaxableId).toBe(10);
    expect(opened.taxableDeletePurchaseCount).toBe(3);
    expect(opened.taxableTransferToId).toBeNull();

    const closed = investmentsReducer(opened, { type: 'CLOSE_DELETE_TAXABLE' });
    expect(closed.deleteTaxableId).toBeNull();
  });

  it('REMOVE_RETIREMENT_DATA cleans accounts, snapshots, and history', () => {
    const state: InvestmentsState = {
      ...initialInvestmentsState,
      accounts: [makeAccount({ id: 1, type: 'ROTH_IRA' as never }), makeAccount({ id: 2, type: 'ROTH_IRA' as never })],
      retirementSnapshots: [{ id: 1, accountId: 1, reviewId: 1, balance: 100 }, { id: 2, accountId: 2, reviewId: 1, balance: 200 }],
      allRetirementHistory: [{ id: 1, accountId: 1, reviewId: 1, balance: 100, review: {} as never }],
    };
    const result = investmentsReducer(state, { type: 'REMOVE_RETIREMENT_DATA', accountId: 1 });
    expect(result.accounts).toHaveLength(1);
    expect(result.retirementSnapshots).toHaveLength(1);
    expect(result.allRetirementHistory).toHaveLength(0);
  });

  it('UPSERT_RETIREMENT_HISTORY inserts when new, updates when existing', () => {
    const snap = { id: 99, accountId: 1, reviewId: 5, balance: 1000, review: {} as never };

    // insert
    let result = investmentsReducer(initialInvestmentsState, { type: 'UPSERT_RETIREMENT_HISTORY', snapshot: snap, reviewIdNum: 5, cents: 1000 });
    expect(result.allRetirementHistory).toHaveLength(1);
    expect(result.retirementSnapshots).toHaveLength(1);
    expect(result.retirementSnapshots[0].balance).toBe(1000);

    // update
    const snap2 = { ...snap, balance: 2000 };
    result = investmentsReducer(result, { type: 'UPSERT_RETIREMENT_HISTORY', snapshot: snap2, reviewIdNum: 5, cents: 2000 });
    expect(result.allRetirementHistory).toHaveLength(1);
    expect(result.retirementSnapshots[0].balance).toBe(2000);
  });
});
