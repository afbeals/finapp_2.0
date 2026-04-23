import type { Vault, Member, Loan, LoanSnapshot, InvestmentAccount, Purchase } from '@/types/entities';
import type { ActiveReview, ReviewStep } from '@/lib/store';

// ─── Member ───────────────────────────────────────────────────────────────────

export function makeMember(overrides: Partial<Member> = {}): Member {
  return { id: 1, name: 'Alice', color: '#aaa', ...overrides };
}

// ─── Vault ────────────────────────────────────────────────────────────────────

export function makeVault(overrides: Partial<Vault> = {}): Vault {
  return {
    id: 1,
    name: 'Emergency Fund',
    type: 'FIXED',
    category: 'Bills',
    owner: null,
    ownerMemberId: null,
    target: 100000,
    frequency: 'MONTHLY',
    rateMonths: 1,
    currentBalance: 50000,
    treasuryPct: 0,
    sortOrder: 1,
    description: '',
    dueMonths: '',
    ...overrides,
  };
}

// ─── Loan ─────────────────────────────────────────────────────────────────────

export function makeLoan(overrides: Partial<Loan> = {}): Loan {
  return {
    id: 1,
    name: 'Test Loan',
    category: 'SCHOOL',
    principal: 1000000,
    rate: 0.05,
    termMonths: 120,
    startDate: '2020-01-01',
    paidOff: false,
    mortgageInsurance: 0,
    otherFees: 0,
    ...overrides,
  };
}

export function makeLoanSnapshot(overrides: Partial<LoanSnapshot> = {}): LoanSnapshot {
  return {
    loanId: 1,
    balance: 1000000,
    paymentsMade: 0,
    interestPaid: 0,
    extraPayment: 0,
    paymentAmount: 0,
    principalAmount: 0,
    ...overrides,
  };
}

// ─── Investments ──────────────────────────────────────────────────────────────

export function makePurchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    id: 1,
    accountId: 1,
    ticker: 'AAPL',
    name: 'Apple Inc.',
    category: 'US Stocks',
    purchaseDate: '2023-01-01',
    pricePerShare: 15000,
    shares: 10,
    ...overrides,
  };
}

export function makeInvestmentAccount(overrides: Partial<InvestmentAccount> = {}): InvestmentAccount {
  return {
    id: 1,
    name: 'Brokerage',
    type: 'TAXABLE',
    institution: 'Vanguard',
    ownerMemberId: null,
    owner: null,
    purchases: [],
    ...overrides,
  };
}

// ─── Review ───────────────────────────────────────────────────────────────────

export function makeReviewStep(stepKey: string, status: ReviewStep['status'] = 'PENDING'): ReviewStep {
  return { id: 1, stepKey, status, data: '' };
}

export function makeActiveReview(overrides: Partial<ActiveReview> = {}): ActiveReview {
  return {
    id: 1,
    periodYear: 2024,
    periodMonth: 1,
    type: 'MONTHLY',
    status: 'IN_PROGRESS',
    currentStep: 'expense',
    lockedForEdit: false,
    steps: [],
    ...overrides,
  };
}
