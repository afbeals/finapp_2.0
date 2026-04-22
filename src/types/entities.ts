// ─── Core domain entity types ─────────────────────────────────────────────────
// These replace per-page inline `interface` declarations.
// Monetary fields are integer cents unless noted.

export interface Member {
  id: number;
  name: string;
  color: string;
}

export interface Household {
  id: number;
  name: string;
}

// ─── Loans ────────────────────────────────────────────────────────────────────

export interface Loan {
  id: number;
  name: string;
  category: string; // 'SCHOOL' | 'MORTGAGE' | 'AUTO' | 'OTHER'
  principal: number;
  rate: number; // decimal, e.g. 0.065 = 6.5%
  termMonths: number;
  startDate: string;
  paidOff: boolean;
  mortgageInsurance: number;
  otherFees: number;
}

export interface LoanSnapshot {
  loanId: number;
  balance: number;
  paymentsMade: number;
  interestPaid: number;
  extraPayment: number;
  paymentAmount: number;
  principalAmount: number;
}

// ─── Savings ──────────────────────────────────────────────────────────────────

export interface SavingsAccount {
  id: number;
  name: string;
  type: string; // 'HYSA' | 'CHECKING' | 'SAVINGS'
  institution: string;
  rate: number;
  goal: number;
}

export interface SavingsSnapshot {
  id: number;
  accountId: number;
  reviewId: number;
  startingBalance: number;
  deposits: number;
  interest: number;
  endingBalance: number;
}

export interface HistoricalSnapshot extends SavingsSnapshot {
  review: { id: number; periodYear: number; periodMonth: number };
}

// ─── Investments ──────────────────────────────────────────────────────────────

export interface Purchase {
  id: number;
  accountId: number;
  ticker: string;
  name: string;
  category: string;
  purchaseDate: string;
  pricePerShare: number;
  shares: number;
}

export interface InvestmentAccount {
  id: number;
  name: string;
  type: string;
  institution: string;
  ownerMemberId: number | null;
  owner: Member | null;
  purchases: Purchase[];
}

export interface InvestmentCategory {
  id: number;
  name: string;
  color: string;
  sortOrder: number;
}

export interface HoldingSnapshot {
  id: number;
  purchaseId: number;
  reviewId: number;
  price: number;
  value: number;
  gainLoss: number;
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export interface ExpenseCategory {
  id: number;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
}

export interface ExpenseEntry {
  id: number;
  name: string;
  notes?: string | null;
  amount: number;
  date: string;
  category: ExpenseCategory;
  member: Member | null;
}

export interface IncomeEntry {
  id: number;
  name: string;
  notes?: string | null;
  amount: number;
  member: Member;
}

// ─── Vaults ───────────────────────────────────────────────────────────────────

export interface VaultOwner {
  id: number;
  name: string;
  color: string;
}

export interface Vault {
  id: number;
  name: string;
  type: 'FIXED' | 'VARIABLE';
  category: string;
  owner: VaultOwner | null;
  ownerMemberId: number | null;
  target: number | null;
  frequency: string;
  rateMonths: number;
  currentBalance: number;
  treasuryPct: number;
  sortOrder: number;
  description: string;
  dueMonths: string;
}

export interface VaultSnapshot {
  vaultId: number;
  amount: number;
}
