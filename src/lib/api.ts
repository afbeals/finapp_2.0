'use client';

// ─── Typed API client ─────────────────────────────────────────────────────────
// All page-side fetch calls go through these helpers.
// Throws ApiError on non-2xx responses; callers catch with useAsyncData or try/catch.

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    let payload: unknown;
    try { payload = await res.json(); } catch { /* ignore */ }
    const message =
      (payload && typeof payload === 'object' && 'error' in payload)
        ? String((payload as Record<string, unknown>).error)
        : `HTTP ${res.status}`;
    throw new ApiError(res.status, message, payload);
  }
  return res.json() as Promise<T>;
}

export function apiGet<T>(url: string): Promise<T> {
  return request<T>(url);
}

export function apiPost<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, { method: 'POST', body: JSON.stringify(body) });
}

export function apiPatch<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, { method: 'PATCH', body: JSON.stringify(body) });
}

export function apiPut<T>(url: string, body: unknown): Promise<T> {
  return request<T>(url, { method: 'PUT', body: JSON.stringify(body) });
}

export function apiDelete<T>(url: string, body?: unknown): Promise<T> {
  return request<T>(url, {
    method: 'DELETE',
    body: body != null ? JSON.stringify(body) : undefined,
  });
}

// ─── Typed domain wrappers ────────────────────────────────────────────────────
// Each function wraps one API endpoint and unwraps the response envelope,
// giving pages a clean typed call with no raw fetch boilerplate.

import type {
  LoansResponse, SavingsResponse, VaultsResponse, MembersResponse,
  InvestmentsResponse, InvestmentCategoriesResponse, InvestmentAccountsResponse,
  ExpensesResponse, IncomeResponse, CategoriesResponse,
} from '@/types/api';
import type {
  Loan, LoanSnapshot, SavingsAccount, SavingsSnapshot, Vault, VaultSnapshot,
  ExpenseEntry, IncomeEntry, ExpenseCategory, InvestmentCategory, InvestmentAccount,
  Member,
} from '@/types/entities';

// Members
export const getMembers = (): Promise<MembersResponse> =>
  apiGet<MembersResponse>('/api/config/members');

// Loans
export const getReviewLoans = (reviewId: string | number): Promise<LoansResponse> =>
  apiGet<LoansResponse>(`/api/reviews/${reviewId}/loans`);

export const patchLoanSnapshot = (reviewId: string | number, loanId: number, fields: Partial<Omit<LoanSnapshot, 'loanId'>>): Promise<{ snapshot: LoanSnapshot }> =>
  apiPatch(`/api/reviews/${reviewId}/loans`, { loanId, ...fields });

export const patchLoan = (loanId: number, fields: Partial<Pick<Loan, 'name' | 'rate' | 'paidOff' | 'mortgageInsurance' | 'otherFees'>>): Promise<{ loan: Loan }> =>
  apiPatch(`/api/loans/${loanId}`, fields);

// Savings
export const getReviewSavings = (reviewId: string | number): Promise<SavingsResponse> =>
  apiGet<SavingsResponse>(`/api/reviews/${reviewId}/savings`);

export const putReviewSavings = (reviewId: string | number, snapshots: Partial<SavingsSnapshot>[]): Promise<{ snapshots: SavingsSnapshot[] }> =>
  apiPut(`/api/reviews/${reviewId}/savings`, snapshots);

export const patchSavingsAccount = (id: number, fields: Partial<SavingsAccount>): Promise<{ account: SavingsAccount }> =>
  apiPatch(`/api/savings-accounts/${id}`, fields);

// Vaults
export const getReviewVaults = (reviewId: string | number): Promise<VaultsResponse> =>
  apiGet<VaultsResponse>(`/api/reviews/${reviewId}/vaults`);

export const putReviewVaults = (reviewId: string | number, payload: { snapshots: VaultSnapshot[]; pctUpdates?: { id: number; treasuryPct: number }[] }): Promise<{ snapshots: VaultSnapshot[] }> =>
  apiPut(`/api/reviews/${reviewId}/vaults`, payload);

export const createVault = (data: Partial<Vault>): Promise<{ vault: Vault }> =>
  apiPost('/api/vaults', data);

export const updateVault = (id: number, data: Partial<Vault>): Promise<{ vault: Vault }> =>
  apiPatch(`/api/vaults/${id}`, data);

export const deleteVault = (id: number): Promise<{ ok: boolean }> =>
  apiDelete(`/api/vaults/${id}`);

// Investments
export const getReviewInvestments = (reviewId: string | number): Promise<InvestmentsResponse> =>
  apiGet<InvestmentsResponse>(`/api/reviews/${reviewId}/investments`);

export const getInvestmentCategories = (): Promise<InvestmentCategoriesResponse> =>
  apiGet<InvestmentCategoriesResponse>('/api/config/investment-categories');

export const getInvestmentAccounts = (): Promise<InvestmentAccountsResponse> =>
  apiGet<InvestmentAccountsResponse>('/api/config/investment-accounts');

export const createInvestmentAccount = (data: Partial<InvestmentAccount>): Promise<{ account: InvestmentAccount }> =>
  apiPost('/api/config/investment-accounts', data);

export const updateInvestmentAccount = (id: number, data: Partial<InvestmentAccount>): Promise<{ account: InvestmentAccount }> =>
  apiPatch(`/api/config/investment-accounts/${id}`, data);

export const deleteInvestmentAccount = (id: number, transferToId?: number): Promise<{ ok?: boolean; inUse?: boolean; purchaseCount?: number }> =>
  apiDelete(`/api/config/investment-accounts/${id}`, transferToId != null ? { transferToId } : undefined);

export const createInvestmentCategory = (data: Partial<InvestmentCategory>): Promise<{ category: InvestmentCategory }> =>
  apiPost('/api/config/investment-categories', data);

export const updateInvestmentCategory = (id: number, data: Partial<InvestmentCategory>): Promise<{ category: InvestmentCategory }> =>
  apiPatch(`/api/config/investment-categories/${id}`, data);

export const deleteInvestmentCategory = (id: number, transferToName?: string): Promise<{ ok?: boolean; inUse?: boolean; purchaseCount?: number }> =>
  apiDelete(`/api/config/investment-categories/${id}`, transferToName != null ? { transferToName } : undefined);

// Expenses
export const getReviewExpenses = (reviewId: string | number): Promise<ExpensesResponse> =>
  apiGet<ExpensesResponse>(`/api/reviews/${reviewId}/expenses`);

export const getReviewIncome = (reviewId: string | number): Promise<IncomeResponse> =>
  apiGet<IncomeResponse>(`/api/reviews/${reviewId}/income`);

export const getExpenseCategories = (): Promise<CategoriesResponse> =>
  apiGet<CategoriesResponse>('/api/config/categories');

export const createExpenseCategory = (data: Partial<ExpenseCategory>): Promise<{ category: ExpenseCategory }> =>
  apiPost('/api/config/categories', data);

export const updateExpenseCategory = (id: number, data: Partial<ExpenseCategory>): Promise<{ category: ExpenseCategory }> =>
  apiPatch(`/api/config/categories/${id}`, data);

export const deleteExpenseCategory = (id: number): Promise<{ ok: boolean }> =>
  apiDelete(`/api/config/categories/${id}`);

export const createIncomeEntry = (reviewId: string | number, data: Partial<IncomeEntry> & { memberId: number }): Promise<{ entry: IncomeEntry }> =>
  apiPost(`/api/reviews/${reviewId}/income`, data);

export const deleteIncomeEntry = (reviewId: string | number, entryId: number): Promise<{ ok: boolean }> =>
  apiDelete(`/api/reviews/${reviewId}/income/${entryId}`);

export const createExpenseEntry = (reviewId: string | number, data: Partial<ExpenseEntry> & { categoryId: number; memberId?: number | null }): Promise<{ entry: ExpenseEntry }> =>
  apiPost(`/api/reviews/${reviewId}/expenses`, data);

export const deleteExpenseEntry = (reviewId: string | number, entryId: number): Promise<{ ok: boolean }> =>
  apiDelete(`/api/reviews/${reviewId}/expenses/${entryId}`);

// Members config
export const createMember = (data: Partial<Member>): Promise<{ member: Member }> =>
  apiPost('/api/config/members', data);

export const updateMember = (id: number, data: Partial<Member>): Promise<{ member: Member }> =>
  apiPatch(`/api/config/members/${id}`, data);

// Market prices
export const getMarketPrices = (tickers: string[]): Promise<{ prices: Record<string, number>; names?: Record<string, string> }> =>
  apiGet<{ prices: Record<string, number>; names?: Record<string, string> }>(
    `/api/market-prices?tickers=${tickers.join(',')}`
  );
