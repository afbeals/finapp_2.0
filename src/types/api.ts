// API response shape contracts — shared between api.ts wrappers and page consumers.

import type {
  Loan, LoanSnapshot,
  SavingsAccount, SavingsSnapshot, HistoricalSnapshot,
  InvestmentAccount, InvestmentCategory, HoldingSnapshot, Purchase,
  ExpenseEntry, IncomeEntry, ExpenseCategory,
  Vault, VaultSnapshot,
  Member,
} from './entities';

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface ReviewSummary {
  id: number;
  periodYear: number;
  periodMonth: number;
  type: 'MONTHLY' | 'QUARTERLY';
  status: 'IN_PROGRESS' | 'COMPLETE' | 'SKIPPED';
  currentStep: string;
  lockedForEdit: boolean;
  createdAt: string;
  completedAt: string | null;
}

// ─── Loans ────────────────────────────────────────────────────────────────────

export interface LoansResponse {
  loans: Loan[];
  snapshots: LoanSnapshot[];
}

// ─── Savings ──────────────────────────────────────────────────────────────────

export interface SavingsResponse {
  accounts: SavingsAccount[];
  snapshots: SavingsSnapshot[];
}

export interface SavingsHistoryResponse {
  snapshots: HistoricalSnapshot[];
}

// ─── Investments ──────────────────────────────────────────────────────────────

export interface InvestmentsResponse {
  accounts: InvestmentAccount[];
  snapshots: Record<number, HoldingSnapshot>;
  purchases: Purchase[];
}

export interface InvestmentCategoriesResponse {
  categories: InvestmentCategory[];
}

export interface InvestmentAccountsResponse {
  accounts: InvestmentAccount[];
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export interface ExpensesResponse {
  entries: ExpenseEntry[];
}

export interface IncomeResponse {
  entries: IncomeEntry[];
}

export interface CategoriesResponse {
  categories: ExpenseCategory[];
}

// ─── Vaults ───────────────────────────────────────────────────────────────────

export interface VaultsResponse {
  vaults: Vault[];
  snapshots: VaultSnapshot[];
}

// ─── Members ──────────────────────────────────────────────────────────────────

export interface MembersResponse {
  members: Member[];
}
