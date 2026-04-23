/**
 * Hard-coded data extracted from the 2026 financial Google Sheet
 * (ID: 1UCUy1Lzs5WjcGosYugvdn0a6GAlGbwi07Dcn5LQZ95M)
 * Last synced: 2026-04-22
 */

// ─── Expense / Income entries by month ────────────────────────────────────────

export interface SheetEntry {
  month: number;
  title: string;
  category: string;
  amount: number; // dollars (will be converted to cents)
  type: 'Income' | 'Expense';
  notes?: string;
}

export const MONTHLY_ENTRIES: SheetEntry[] = [
  // ─── January ───────────────────────────────────────────────────────────────
  { month: 1, title: 'Allan: Paycheck',    category: '01 Income',        amount: 8186.00,   type: 'Income' },
  { month: 1, title: 'Malia: Paycheck',    category: '01 Income',        amount: 4176.00,   type: 'Income' },
  { month: 1, title: 'Other',              category: '01 Income',        amount: 445.00,    type: 'Income' },
  { month: 1, title: 'Groceries',          category: '04 Groceries',     amount: 526.00,    type: 'Expense', notes: 'Winco, Safeway' },
  { month: 1, title: 'Entertainment',      category: '09 Entertainment', amount: 515.95,    type: 'Expense', notes: 'Events, etc...games, play' },
  { month: 1, title: 'Eating Out',         category: '03 Eating Out',    amount: 946.91,    type: 'Expense', notes: 'Deliver, Eating out' },
  { month: 1, title: 'Shopping',           category: '13 Shopping',      amount: 1084.00,   type: 'Expense', notes: 'Amazon, convience, Etc...' },
  { month: 1, title: 'Personal',           category: '11 Miscellaneous', amount: 190.88,    type: 'Expense' },
  { month: 1, title: 'Mortgage',           category: '02 Housing',       amount: 1709.00,   type: 'Expense' },
  { month: 1, title: 'Housekeeper',        category: '07 Utilities',     amount: 252.00,    type: 'Expense' },
  { month: 1, title: 'Electric',           category: '07 Utilities',     amount: 145.00,    type: 'Expense' },
  { month: 1, title: 'Subscriptions',      category: '12 Subscriptions', amount: 48.00,     type: 'Expense', notes: 'Netflix, Crunchy, Twitch' },
  { month: 1, title: 'Internet',           category: '07 Utilities',     amount: 95.00,     type: 'Expense' },
  { month: 1, title: 'Website',            category: '07 Utilities',     amount: 68.00,     type: 'Expense' },
  { month: 1, title: 'Phone',              category: '07 Utilities',     amount: 175.00,    type: 'Expense' },
  { month: 1, title: 'Natural Gas',        category: '07 Utilities',     amount: 100.00,    type: 'Expense' },
  { month: 1, title: 'Health',             category: '06 Healthcare',    amount: 861.02,    type: 'Expense', notes: 'MVP, Crunch, H/S, colposcopy, Factor' },
  { month: 1, title: 'Transportation',     category: '05 Transportation',amount: 66.00,     type: 'Expense', notes: 'Gas, parking' },
  { month: 1, title: 'Malia: Mutual Fund', category: '08 Debt',          amount: 150.00,    type: 'Expense' },
  { month: 1, title: 'Malia: Insurance',   category: '08 Debt',          amount: 48.65,     type: 'Expense', notes: 'NY Life, quarterly NEA Life' },
  { month: 1, title: 'Donation',           category: '10 Gifts',         amount: 6.18,      type: 'Expense', notes: 'Dog Shelter' },
  { month: 1, title: 'Storage',            category: '07 Utilities',     amount: 217.33,    type: 'Expense', notes: 'Public Storage' },
  { month: 1, title: 'Water',              category: '07 Utilities',     amount: 229.00,    type: 'Expense' },
  { month: 1, title: 'Trash',              category: '07 Utilities',     amount: 92.84,     type: 'Expense' },
  { month: 1, title: 'Travel',             category: '14 Travel',        amount: 3586.00,   type: 'Expense', notes: 'Thailand' },
  { month: 1, title: 'School Loans',       category: '15 Education',     amount: 2147.00,   type: 'Expense' },

  // ─── February ──────────────────────────────────────────────────────────────
  { month: 2, title: 'Allan: Paycheck',    category: '01 Income',        amount: 19425.76,  type: 'Income' },
  { month: 2, title: 'Malia: Paycheck',    category: '01 Income',        amount: 4175.95,   type: 'Income' },
  { month: 2, title: 'Other',              category: '01 Income',        amount: 3895.62,   type: 'Income' },
  { month: 2, title: 'Groceries',          category: '04 Groceries',     amount: 722.00,    type: 'Expense', notes: 'Winco, Safeway' },
  { month: 2, title: 'Entertainment',      category: '09 Entertainment', amount: 583.00,    type: 'Expense', notes: 'Events, etc...games, play' },
  { month: 2, title: 'Eating Out',         category: '03 Eating Out',    amount: 1064.00,   type: 'Expense', notes: 'Deliver, Eating out, Date Night' },
  { month: 2, title: 'Shopping',           category: '13 Shopping',      amount: 928.00,    type: 'Expense', notes: 'Amazon, convience, Etc...' },
  { month: 2, title: 'Personal',           category: '11 Miscellaneous', amount: 56.95,     type: 'Expense' },
  { month: 2, title: 'Mortgage',           category: '02 Housing',       amount: 1708.92,   type: 'Expense' },
  { month: 2, title: 'Housekeeper',        category: '07 Utilities',     amount: 336.00,    type: 'Expense' },
  { month: 2, title: 'Electric',           category: '07 Utilities',     amount: 159.46,    type: 'Expense' },
  { month: 2, title: 'Subscriptions',      category: '12 Subscriptions', amount: 48.00,     type: 'Expense', notes: 'Netflix, Crunchy, Twitch' },
  { month: 2, title: 'Internet',           category: '07 Utilities',     amount: 95.00,     type: 'Expense' },
  { month: 2, title: 'Phone',              category: '07 Utilities',     amount: 174.47,    type: 'Expense' },
  { month: 2, title: 'Natural Gas',        category: '07 Utilities',     amount: 117.55,    type: 'Expense' },
  { month: 2, title: 'Health',             category: '06 Healthcare',    amount: 185.00,    type: 'Expense', notes: 'MVP, Crunch, H/S, colposcopy, Factor' },
  { month: 2, title: 'Transportation',     category: '05 Transportation',amount: 49.00,     type: 'Expense', notes: 'Gas, parking' },
  { month: 2, title: 'Malia: Mutual Fund', category: '08 Debt',          amount: 150.00,    type: 'Expense' },
  { month: 2, title: 'Malia: Insurance',   category: '08 Debt',          amount: 10.65,     type: 'Expense', notes: 'NY Life, quarterly NEA Life' },
  { month: 2, title: 'Donation',           category: '10 Gifts',         amount: 50.00,     type: 'Expense', notes: 'Dog Shelter' },
  { month: 2, title: 'Storage',            category: '07 Utilities',     amount: 226.00,    type: 'Expense', notes: 'Public Storage' },
  { month: 2, title: 'Travel',             category: '14 Travel',        amount: 410.36,    type: 'Expense', notes: 'Thailand' },
  { month: 2, title: 'School Loans',       category: '15 Education',     amount: 60.00,     type: 'Expense', notes: 'School Loan' },

  // ─── March ─────────────────────────────────────────────────────────────────
  { month: 3, title: 'Allan: Paycheck',    category: '01 Income',        amount: 31128.67,  type: 'Income' },
  { month: 3, title: 'Malia: Paycheck',    category: '01 Income',        amount: 4176.12,   type: 'Income' },
  { month: 3, title: 'Other',              category: '01 Income',        amount: 34.35,     type: 'Income' },
  { month: 3, title: 'Groceries',          category: '04 Groceries',     amount: 992.00,    type: 'Expense', notes: 'Winco, Safeway, Fred' },
  { month: 3, title: 'Entertainment',      category: '09 Entertainment', amount: 173.10,    type: 'Expense', notes: 'Events, etc...games, play' },
  { month: 3, title: 'Eating Out',         category: '03 Eating Out',    amount: 903.40,    type: 'Expense', notes: 'Deliver, Eating out, Date Night' },
  { month: 3, title: 'Shopping',           category: '13 Shopping',      amount: 596.09,    type: 'Expense', notes: 'Amazon, convience, Etc...' },
  { month: 3, title: 'Personal',           category: '11 Miscellaneous', amount: 43.01,     type: 'Expense' },
  { month: 3, title: 'Mortgage',           category: '02 Housing',       amount: 1709.00,   type: 'Expense' },
  { month: 3, title: 'Housekeeper',        category: '07 Utilities',     amount: 252.00,    type: 'Expense' },
  { month: 3, title: 'Electric',           category: '07 Utilities',     amount: 110.00,    type: 'Expense' },
  { month: 3, title: 'Subscriptions',      category: '12 Subscriptions', amount: 50.00,     type: 'Expense', notes: 'Netflix, Crunchy, Twitch' },
  { month: 3, title: 'Internet',           category: '07 Utilities',     amount: 100.00,    type: 'Expense' },
  { month: 3, title: 'Website',            category: '07 Utilities',     amount: 18.00,     type: 'Expense' },
  { month: 3, title: 'Phone',              category: '07 Utilities',     amount: 177.00,    type: 'Expense' },
  { month: 3, title: 'Natural Gas',        category: '07 Utilities',     amount: 80.00,     type: 'Expense' },
  { month: 3, title: 'Health',             category: '06 Healthcare',    amount: 352.39,    type: 'Expense', notes: 'MVP, Crunch, Hula, colposcopy labs' },
  { month: 3, title: 'Education',          category: '15 Education',     amount: 10.00,     type: 'Expense', notes: 'e-book, duolingo' },
  { month: 3, title: 'Transportation',     category: '05 Transportation',amount: 41.00,     type: 'Expense', notes: 'Gas, parking' },
  { month: 3, title: 'Malia: Mutual Fund', category: '08 Debt',          amount: 150.00,    type: 'Expense' },
  { month: 3, title: 'Malia: Insurance',   category: '08 Debt',          amount: 10.65,     type: 'Expense', notes: 'NY Life, quarterly NEA Life' },
  { month: 3, title: 'Donation',           category: '10 Gifts',         amount: 660.28,    type: 'Expense', notes: 'Dog Shelter, Birthday, Woman of Wonder' },
  { month: 3, title: 'Storage',            category: '07 Utilities',     amount: 226.00,    type: 'Expense', notes: 'Public Storage' },
  { month: 3, title: 'Water',              category: '07 Utilities',     amount: 231.00,    type: 'Expense' },
  { month: 3, title: 'Trash',              category: '07 Utilities',     amount: 93.00,     type: 'Expense' },
  { month: 3, title: 'Misc',               category: '11 Miscellaneous', amount: 1397.00,   type: 'Expense', notes: 'Home Maint' },
];

// ─── Expense category definitions ─────────────────────────────────────────────

export interface SheetExpenseCategory {
  sortOrder: number;
  name: string;
  icon: string;
  color: string;
}

export const EXPENSE_CATEGORIES: SheetExpenseCategory[] = [
  { sortOrder: 2,  name: 'Housing',        icon: '🏠', color: '#6366F1' },
  { sortOrder: 3,  name: 'Eating Out',     icon: '🍽️', color: '#F59E0B' },
  { sortOrder: 4,  name: 'Groceries',      icon: '🛒', color: '#22C55E' },
  { sortOrder: 5,  name: 'Transportation', icon: '🚗', color: '#3B82F6' },
  { sortOrder: 6,  name: 'Healthcare',     icon: '🏥', color: '#EF4444' },
  { sortOrder: 7,  name: 'Utilities',      icon: '💡', color: '#8B5CF6' },
  { sortOrder: 8,  name: 'Debt',           icon: '💳', color: '#F97316' },
  { sortOrder: 9,  name: 'Entertainment',  icon: '🎬', color: '#EC4899' },
  { sortOrder: 10, name: 'Gifts',          icon: '🎁', color: '#14B8A6' },
  { sortOrder: 11, name: 'Miscellaneous',  icon: '📦', color: '#94A3B8' },
  { sortOrder: 12, name: 'Subscriptions',  icon: '📱', color: '#64748B' },
  { sortOrder: 13, name: 'Shopping',       icon: '🛍️', color: '#0EA5E9' },
  { sortOrder: 14, name: 'Travel',         icon: '✈️', color: '#A78BFA' },
  { sortOrder: 15, name: 'Education',      icon: '📚', color: '#D97706' },
];

// Sheet category label → canonical name mapping
export const CATEGORY_LABEL_MAP: Record<string, string> = {
  '02 Housing':        'Housing',
  '03 Eating Out':     'Eating Out',
  '04 Groceries':      'Groceries',
  '05 Transportation': 'Transportation',
  '06 Healthcare':     'Healthcare',
  '07 Utilities':      'Utilities',
  '08 Debt':           'Debt',
  '09 Entertainment':  'Entertainment',
  '10 Gifts':          'Gifts',
  '11 Miscellaneous':  'Miscellaneous',
  '12 Subscriptions':  'Subscriptions',
  '13 Shopping':       'Shopping',
  '14 Travel':         'Travel',
  '15 Education':      'Education',
};

// ─── Savings accounts ─────────────────────────────────────────────────────────

export interface SheetSavingsAccount {
  name: string;
  type: 'HYSA' | 'CHECKING' | 'SAVINGS';
  institution: string;
  rate: number;
  goalCents: number;
  // Per-month: [starting, jan, feb, mar] for input and interest
  inputByMonth: { starting: number; jan: number; feb: number; mar: number };
  interestByMonth: { starting: number; jan: number; feb: number; mar: number };
}

export const SAVINGS_ACCOUNTS: SheetSavingsAccount[] = [
  {
    name: 'HYSA Emergency Account',
    type: 'HYSA',
    institution: 'Everbank',
    rate: 0.035,
    goalCents: 25_000_000, // $250,000
    inputByMonth:    { starting: 103502.38, jan: 0,       feb: 0,       mar: -4061.08 },
    interestByMonth: { starting: 0,         jan: 288.61,  feb: 270.09,  mar: 300.86 },
  },
  {
    name: 'Joint Savings',
    type: 'SAVINGS',
    institution: 'Sofi',
    rate: 0.035,
    goalCents: 0,
    inputByMonth:    { starting: 0, jan: 0, feb: 0, mar: 0 },
    interestByMonth: { starting: 0, jan: 33.06, feb: 18.47, mar: 11.22 },
  },
  {
    name: 'HYSA New House',
    type: 'HYSA',
    institution: '', // prompt
    rate: 0,
    goalCents: 0,
    inputByMonth:    { starting: 5760.05,  jan: 1200.00, feb: 250.35,  mar: 7560.00 },
    interestByMonth: { starting: 0,        jan: 18.15,   feb: 17.87,   mar: 36.17 },
  },
  {
    name: 'Child 1',
    type: 'SAVINGS',
    institution: '', // prompt
    rate: 0,
    goalCents: 0,
    inputByMonth:    { starting: 6143.92,  jan: 2000.00, feb: 500.69,  mar: 12040.00 },
    interestByMonth: { starting: 0,        jan: 20.71,   feb: 21.30,   mar: 49.73 },
  },
  {
    name: 'Child 2',
    type: 'SAVINGS',
    institution: '', // prompt
    rate: 0,
    goalCents: 0,
    inputByMonth:    { starting: 2339.33,  jan: 800.00,  feb: 150.20,  mar: 3080.00 },
    interestByMonth: { starting: 0,        jan: 7.96,    feb: 8.13,    mar: 15.71 },
  },
];

// ─── Loans ────────────────────────────────────────────────────────────────────

export interface SheetSchoolLoan {
  name: string;
  balance: number;    // dollars — used as principal (current balance)
  rate: number;       // decimal (e.g. 0.045)
  termMonths: number; // remaining term from sheet "Term" column
}

export const MORTGAGE = {
  name: 'New American',
  principal: 333000,  // dollars
  rate: 0.02625,
  termMonths: 360,
  startDate: '2020-09-01',
  // Current amortization state as of March 2026 (payment 67)
  marBalance: 289102.67,
  // Per-payment interest from amortization table
  janInterestPaid: 637.02,
  febInterestPaid: 635.49,
  marInterestPaid: 633.95,
  // Payment numbers
  janPaymentNum: 65,
  febPaymentNum: 66,
  marPaymentNum: 67,
};

export const SCHOOL_LOANS: SheetSchoolLoan[] = [
  { name: 'Direct Sub 01',    balance: 4970.03,   rate: 0.045,  termMonths: 139 },
  { name: 'Direct Sub 02',    balance: 5844.83,   rate: 0.034,  termMonths: 135 },
  { name: 'Direct Sub 03',    balance: 5117.70,   rate: 0.034,  termMonths: 135 },
  { name: 'Direct Sub 04',    balance: 1937.60,   rate: 0.0386, termMonths: 137 },
  { name: 'Direct Unsub 05',  balance: 1127.46,   rate: 0.0386, termMonths: 141 },
  { name: 'Direct Unsub 06',  balance: 11133.47,  rate: 0.0531, termMonths: 150 },
  { name: 'Direct Unsub 07',  balance: 17626.46,  rate: 0.06,   termMonths: 148 },
  { name: 'Stafford Sub 08',  balance: 4088.86,   rate: 0.06,   termMonths: 147 },
];

// ─── Investment accounts ───────────────────────────────────────────────────────

export type InvestmentAccountType =
  | 'TAXABLE' | 'TRADITIONAL_401K' | 'ROTH_401K'
  | 'TRADITIONAL_IRA' | 'ROTH_IRA' | 'HSA' | 'OTHER';

export interface SheetRetirementAccount {
  name: string;
  type: InvestmentAccountType;
  institution: string;
  owner: 'Allan' | 'Malia';
  // March 2026 balance in dollars
  marBalance: number;
}

export const RETIREMENT_ACCOUNTS: SheetRetirementAccount[] = [
  { name: 'Taskrabbit 401k',  type: 'TRADITIONAL_401K', institution: 'Fidelity',  owner: 'Allan', marBalance: 41560.70 },
  { name: 'Uber 401k',        type: 'TRADITIONAL_401K', institution: 'Vanguard',  owner: 'Allan', marBalance: 79328.49 + 7914.17 }, // VFFVX Uber + Airbnb lots combined to one acct based on notes
  { name: 'Airbnb 401k',      type: 'TRADITIONAL_401K', institution: 'Vanguard',  owner: 'Allan', marBalance: 0 }, // folded into Uber 401k above — will be split in purchase routing
  { name: 'CDK 401k',         type: 'TRADITIONAL_401K', institution: 'Unknown',   owner: 'Allan', marBalance: 63165.42 + 138964.31 + 57.13 + 6546.37 },
  { name: 'Malia Mutual IRA', type: 'TRADITIONAL_IRA',  institution: 'American Funds', owner: 'Malia', marBalance: 24188.09 * (192.865 / 249.028) },
  { name: 'Malia Mutual Roth',type: 'ROTH_IRA',         institution: 'American Funds', owner: 'Malia', marBalance: 24188.09 * (56.163 / 249.028) },
  { name: 'BSD 403b',         type: 'TRADITIONAL_401K', institution: 'Vanguard',  owner: 'Malia', marBalance: 0 },
];

// ─── Investment purchase lots ──────────────────────────────────────────────────

export interface SheetPurchaseLot {
  ticker: string;
  name: string;
  category: string;
  purchaseDate: string; // ISO date string
  pricePerShare: number; // dollars
  shares: number;
  account: 'TAXABLE' | 'Taskrabbit 401k' | 'Uber 401k' | 'Airbnb 401k' | 'CDK 401k' | 'Malia Mutual IRA' | 'Malia Mutual Roth' | 'BSD 403b';
}

// Taxable brokerage lots (no notes = taxable)
export const TAXABLE_LOTS: SheetPurchaseLot[] = [
  { ticker: 'RDDT',  name: 'Reddit Inc',                   category: 'Social',          purchaseDate: '2024-05-29', pricePerShare: 57.38,   shares: 1.04,     account: 'TAXABLE' },
  { ticker: 'RIVN',  name: 'Rivian Automotive Inc',        category: 'Transportation',  purchaseDate: '2024-05-29', pricePerShare: 10.15,   shares: 2.46,     account: 'TAXABLE' },
  { ticker: 'UBER',  name: 'Uber Technologies Inc',        category: 'Transportation',  purchaseDate: '2024-06-01', pricePerShare: 34.63,   shares: 4075,     account: 'TAXABLE' },
  { ticker: 'NVDA',  name: 'NVIDIA Corp',                  category: 'Technology',      purchaseDate: '2024-06-10', pricePerShare: 121.68,  shares: 8.34,     account: 'TAXABLE' },
  { ticker: 'NVDA',  name: 'NVIDIA Corp',                  category: 'Technology',      purchaseDate: '2024-06-11', pricePerShare: 121.79,  shares: 0.041,    account: 'TAXABLE' },
  { ticker: 'NVDA',  name: 'NVIDIA Corp',                  category: 'Technology',      purchaseDate: '2024-06-12', pricePerShare: 124.68,  shares: 28.06,    account: 'TAXABLE' },
  { ticker: 'RDDT',  name: 'Reddit Inc',                   category: 'Social',          purchaseDate: '2024-06-12', pricePerShare: 100.00,  shares: 1.51,     account: 'TAXABLE' },
  { ticker: 'RIVN',  name: 'Rivian Automotive Inc',        category: 'Transportation',  purchaseDate: '2024-06-12', pricePerShare: 11.78,   shares: 8.48,     account: 'TAXABLE' },
  { ticker: 'NVDA',  name: 'NVIDIA Corp',                  category: 'Technology',      purchaseDate: '2024-06-20', pricePerShare: 139.84,  shares: 20.02,    account: 'TAXABLE' },
  { ticker: 'NVDA',  name: 'NVIDIA Corp',                  category: 'Technology',      purchaseDate: '2024-06-25', pricePerShare: 121.84,  shares: 20.51,    account: 'TAXABLE' },
  { ticker: 'NFLX',  name: 'Netflix Inc',                  category: 'Technology',      purchaseDate: '2024-09-24', pricePerShare: 71.95,   shares: 30,       account: 'TAXABLE' }, // note: 10-1 stock split Nov 2025 → price is post-split equivalent
  { ticker: 'RDDT',  name: 'Reddit Inc',                   category: 'Social',          purchaseDate: '2024-10-14', pricePerShare: 73.78,   shares: 4.26,     account: 'TAXABLE' },
  { ticker: 'TCEHY', name: 'Tencent Holdings ADR',         category: 'Entertainment',   purchaseDate: '2024-10-14', pricePerShare: 56.12,   shares: 4,        account: 'TAXABLE' },
  { ticker: 'TSLA',  name: 'Tesla Inc',                    category: 'Transportation',  purchaseDate: '2024-10-14', pricePerShare: 220.01,  shares: 4.54,     account: 'TAXABLE' },
  { ticker: 'AMZN',  name: 'Amazon.com Inc',               category: 'Consumer',        purchaseDate: '2024-11-06', pricePerShare: 205.53,  shares: 2.91,     account: 'TAXABLE' },
  { ticker: 'DIS',   name: 'Walt Disney Co',               category: 'Entertainment',   purchaseDate: '2024-11-06', pricePerShare: 98.62,   shares: 2.02,     account: 'TAXABLE' },
  { ticker: 'GOOGL', name: 'Alphabet Inc Class A',         category: 'Technology',      purchaseDate: '2024-11-06', pricePerShare: 175.05,  shares: 0.28,     account: 'TAXABLE' },
  { ticker: 'MSFT',  name: 'Microsoft Corp',               category: 'Technology',      purchaseDate: '2024-11-06', pricePerShare: 416.13,  shares: 0.12,     account: 'TAXABLE' },
  { ticker: 'NVDA',  name: 'NVIDIA Corp',                  category: 'Technology',      purchaseDate: '2024-11-06', pricePerShare: 145.88,  shares: 4.12,     account: 'TAXABLE' },
  { ticker: 'XLU',   name: 'State Street Utilities Select Sector SPDR ETF', category: 'Utilities', purchaseDate: '2024-12-16', pricePerShare: 77.64, shares: 7.72, account: 'TAXABLE' },
  { ticker: 'GOOGL', name: 'Alphabet Inc Class A',         category: 'Technology',      purchaseDate: '2025-01-13', pricePerShare: 190.12,  shares: 1.57,     account: 'TAXABLE' },
  { ticker: 'NVDA',  name: 'NVIDIA Corp',                  category: 'Technology',      purchaseDate: '2025-01-13', pricePerShare: 132.49,  shares: 1.5,      account: 'TAXABLE' },
  { ticker: 'GOOGL', name: 'Alphabet Inc Class A',         category: 'Technology',      purchaseDate: '2025-01-14', pricePerShare: 185.09,  shares: 1,        account: 'TAXABLE' },
  { ticker: 'VPU',   name: 'Vanguard Utilities Index Fund ETF', category: 'Utilities',  purchaseDate: '2025-01-14', pricePerShare: 171.17,  shares: 1,        account: 'TAXABLE' },
  { ticker: 'XLU',   name: 'State Street Utilities Select Sector SPDR ETF', category: 'Utilities', purchaseDate: '2025-01-14', pricePerShare: 39.63, shares: 3.62, account: 'TAXABLE' },
  { ticker: 'NVDA',  name: 'NVIDIA Corp',                  category: 'Technology',      purchaseDate: '2025-01-29', pricePerShare: 126.64,  shares: 7.89,     account: 'TAXABLE' },
  { ticker: 'VT',    name: 'Vanguard Total World Stock Index Fund ETF', category: 'Index Fund', purchaseDate: '2025-03-27', pricePerShare: 118.20, shares: 0.84, account: 'TAXABLE' },
  { ticker: 'NVDA',  name: 'NVIDIA Corp',                  category: 'Technology',      purchaseDate: '2025-03-31', pricePerShare: 105.12,  shares: 4.28,     account: 'TAXABLE' },
  { ticker: 'VPU',   name: 'Vanguard Utilities Index Fund ETF', category: 'Utilities',  purchaseDate: '2025-03-31', pricePerShare: 168.02,  shares: 0.73,     account: 'TAXABLE' },
  { ticker: 'VT',    name: 'Vanguard Total World Stock Index Fund ETF', category: 'Index Fund', purchaseDate: '2025-03-31', pricePerShare: 114.67, shares: 1.3, account: 'TAXABLE' },
  { ticker: 'XLU',   name: 'State Street Utilities Select Sector SPDR ETF', category: 'Utilities', purchaseDate: '2025-03-31', pricePerShare: 39.08, shares: 4.46, account: 'TAXABLE' },
  { ticker: 'VPU',   name: 'Vanguard Utilities Index Fund ETF', category: 'Utilities',  purchaseDate: '2025-04-17', pricePerShare: 127.66,  shares: 0.7,      account: 'TAXABLE' },
  { ticker: 'XLU',   name: 'State Street Utilities Select Sector SPDR ETF', category: 'Utilities', purchaseDate: '2025-04-17', pricePerShare: 38.68, shares: 9.88, account: 'TAXABLE' },
  { ticker: 'VT',    name: 'Vanguard Total World Stock Index Fund ETF', category: 'Index Fund', purchaseDate: '2025-05-22', pricePerShare: 121.98, shares: 4.09, account: 'TAXABLE' },
  { ticker: 'BND',   name: 'Vanguard Total Bond Market Index Fund ETF', category: 'Bonds', purchaseDate: '2025-06-10', pricePerShare: 72.46, shares: 1.38, account: 'TAXABLE' },
  { ticker: 'BNDW',  name: 'Vanguard Total World Bond ETF',            category: 'Bonds', purchaseDate: '2025-06-10', pricePerShare: 68.68, shares: 1.45, account: 'TAXABLE' },
  { ticker: 'VT',    name: 'Vanguard Total World Stock Index Fund ETF', category: 'Index Fund', purchaseDate: '2025-06-10', pricePerShare: 126.01, shares: 2.38, account: 'TAXABLE' },
  { ticker: 'BND',   name: 'Vanguard Total Bond Market Index Fund ETF', category: 'Bonds', purchaseDate: '2025-07-14', pricePerShare: 72.79, shares: 1.03, account: 'TAXABLE' },
  { ticker: 'BNDW',  name: 'Vanguard Total World Bond ETF',            category: 'Bonds', purchaseDate: '2025-07-14', pricePerShare: 68.66, shares: 1.82, account: 'TAXABLE' },
  { ticker: 'VPU',   name: 'Vanguard Utilities Index Fund ETF', category: 'Utilities',   purchaseDate: '2025-07-14', pricePerShare: 178.29,  shares: 0.14,    account: 'TAXABLE' },
  { ticker: 'VT',    name: 'Vanguard Total World Stock Index Fund ETF', category: 'Index Fund', purchaseDate: '2025-07-14', pricePerShare: 129.49, shares: 1.35, account: 'TAXABLE' },
  { ticker: 'XLU',   name: 'State Street Utilities Select Sector SPDR ETF', category: 'Utilities', purchaseDate: '2025-07-14', pricePerShare: 41.25, shares: 2.42, account: 'TAXABLE' },
  { ticker: 'BND',   name: 'Vanguard Total Bond Market Index Fund ETF', category: 'Bonds', purchaseDate: '2025-08-28', pricePerShare: 73.87, shares: 1.01, account: 'TAXABLE' },
  { ticker: 'BNDW',  name: 'Vanguard Total World Bond ETF',            category: 'Bonds', purchaseDate: '2025-08-28', pricePerShare: 69.33, shares: 1.8,  account: 'TAXABLE' },
  { ticker: 'VPU',   name: 'Vanguard Utilities Index Fund ETF', category: 'Utilities',   purchaseDate: '2025-08-28', pricePerShare: 184.69,  shares: 0.67,    account: 'TAXABLE' },
  { ticker: 'VT',    name: 'Vanguard Total World Stock Index Fund ETF', category: 'Index Fund', purchaseDate: '2025-08-28', pricePerShare: 134.22, shares: 0.74, account: 'TAXABLE' },
  { ticker: 'XLU',   name: 'State Street Utilities Select Sector SPDR ETF', category: 'Utilities', purchaseDate: '2025-08-28', pricePerShare: 42.61, shares: 1.76, account: 'TAXABLE' },
  { ticker: 'BND',   name: 'Vanguard Total Bond Market Index Fund ETF', category: 'Bonds', purchaseDate: '2025-10-02', pricePerShare: 74.29, shares: 1.14, account: 'TAXABLE' },
  { ticker: 'BNDW',  name: 'Vanguard Total World Bond ETF',            category: 'Bonds', purchaseDate: '2025-10-02', pricePerShare: 69.55, shares: 1.65, account: 'TAXABLE' },
  { ticker: 'VT',    name: 'Vanguard Total World Stock Index Fund ETF', category: 'Index Fund', purchaseDate: '2025-10-02', pricePerShare: 138.94, shares: 1.43, account: 'TAXABLE' },
  { ticker: 'XLU',   name: 'State Street Utilities Select Sector SPDR ETF', category: 'Utilities', purchaseDate: '2025-10-02', pricePerShare: 43.88, shares: 2.3, account: 'TAXABLE' },
  { ticker: 'AMD',   name: 'Advanced Micro Devices Inc',               category: 'Technology',    purchaseDate: '2025-10-13', pricePerShare: 216.61,  shares: 0.11,    account: 'TAXABLE' },
  { ticker: 'AVGO',  name: 'Broadcom Inc',                             category: 'Technology',    purchaseDate: '2025-10-13', pricePerShare: 356.04,  shares: 0.07,    account: 'TAXABLE' },
  { ticker: 'BND',   name: 'Vanguard Total Bond Market Index Fund ETF', category: 'Bonds', purchaseDate: '2025-10-13', pricePerShare: 74.55, shares: 1.34, account: 'TAXABLE' },
  { ticker: 'BND',   name: 'Vanguard Total Bond Market Index Fund ETF', category: 'Bonds', purchaseDate: '2025-10-13', pricePerShare: 75.00, shares: 1.07, account: 'TAXABLE' },
  { ticker: 'BNDW',  name: 'Vanguard Total World Bond ETF',            category: 'Bonds', purchaseDate: '2025-10-13', pricePerShare: 69.87, shares: 1.43, account: 'TAXABLE' },
  { ticker: 'BNDW',  name: 'Vanguard Total World Bond ETF',            category: 'Bonds', purchaseDate: '2025-10-13', pricePerShare: 125.00, shares: 1.68, account: 'TAXABLE' },
  { ticker: 'OKLO',  name: 'Oklo Inc',                                 category: 'Technology',    purchaseDate: '2025-10-13', pricePerShare: 168.20,  shares: 0.14,    account: 'TAXABLE' },
  { ticker: 'ORCL',  name: 'Oracle Corp',                              category: 'Technology',    purchaseDate: '2025-10-13', pricePerShare: 309.93,  shares: 0.08,    account: 'TAXABLE' },
  { ticker: 'VPU',   name: 'Vanguard Utilities Index Fund ETF', category: 'Utilities',   purchaseDate: '2025-10-13', pricePerShare: 197.62,  shares: 0.5,     account: 'TAXABLE' },
  { ticker: 'VT',    name: 'Vanguard Total World Stock Index Fund ETF', category: 'Index Fund', purchaseDate: '2025-10-13', pricePerShare: 137.29, shares: 0.72, account: 'TAXABLE' },
  { ticker: 'VT',    name: 'Vanguard Total World Stock Index Fund ETF', category: 'Index Fund', purchaseDate: '2025-10-13', pricePerShare: 175.00, shares: 1.23, account: 'TAXABLE' },
  { ticker: 'VTI',   name: 'Vanguard Total Stock Market Index Fund ETF', category: 'Technology', purchaseDate: '2025-11-13', pricePerShare: 125.00, shares: 0.37, account: 'TAXABLE' },
  { ticker: 'NFLX',  name: 'Netflix Inc',                              category: 'Technology',    purchaseDate: '2025-12-22', pricePerShare: 94.64,   shares: 3,       account: 'TAXABLE' },
  { ticker: 'VT',    name: 'Vanguard Total World Stock Index Fund ETF', category: 'Index Fund', purchaseDate: '2025-12-22', pricePerShare: 141.23, shares: 0.7, account: 'TAXABLE' },
  { ticker: 'VTI',   name: 'Vanguard Total Stock Market Index Fund ETF', category: 'Technology', purchaseDate: '2025-12-22', pricePerShare: 337.00, shares: 0.34, account: 'TAXABLE' },
  { ticker: 'NFLX',  name: 'Netflix Inc',                              category: 'Technology',    purchaseDate: '2026-02-23', pricePerShare: 75.31,   shares: 2.65,    account: 'TAXABLE' },
  { ticker: 'SOFI',  name: 'SoFi Technologies Inc',                    category: 'Finance',       purchaseDate: '2026-02-23', pricePerShare: 17.66,   shares: 11.32,   account: 'TAXABLE' },
  { ticker: 'CIBR',  name: 'First Trust NASDAQ Cybersecurity ETF',     category: 'Technology',    purchaseDate: '2026-02-23', pricePerShare: 61.59,   shares: 3.24,    account: 'TAXABLE' },
];

// Retirement lots
export const RETIREMENT_LOTS: SheetPurchaseLot[] = [
  { ticker: 'FFLDX', name: 'Fidelity Freedom Index 2055 Fund - Institutional Premium Class', category: 'Index Fund', purchaseDate: '2022-05-01', pricePerShare: 19.26, shares: 1535.872, account: 'Taskrabbit 401k' },
  { ticker: 'VFFVX', name: 'Vanguard Target Retirement 2055 Fund', category: 'Index Fund', purchaseDate: '2024-06-01', pricePerShare: 54.04, shares: 1007.88, account: 'Uber 401k' },
  { ticker: 'VFFVX', name: 'Vanguard Target Retirement 2055 Fund', category: 'Index Fund', purchaseDate: '2024-06-01', pricePerShare: 80.56, shares: 52.518, account: 'Airbnb 401k' },
  { ticker: 'IWR',   name: 'iShares Russell Mid-Cap ETF', category: 'Index Fund', purchaseDate: '2024-06-03', pricePerShare: 17.67, shares: 608.12, account: 'CDK 401k' },
  { ticker: 'ACWI',  name: 'iShares MSCI ACWI ETF', category: 'Index Fund', purchaseDate: '2024-06-06', pricePerShare: 15.16, shares: 925.38, account: 'CDK 401k' },
  { ticker: 'SPX',   name: 'Stellar AfricaGold Inc', category: 'Index Fund', purchaseDate: '2024-06-06', pricePerShare: 25.28, shares: 571.323, account: 'CDK 401k' },
  { ticker: 'AGG',   name: 'iShares Core US Aggregate Bond ETF', category: 'Index Fund', purchaseDate: '2024-06-06', pricePerShare: 11.10, shares: 65.72, account: 'CDK 401k' },
  { ticker: 'ANCFX', name: 'American Funds Fundamental Investors® Class A', category: 'Index Fund', purchaseDate: '2023-03-01', pricePerShare: 85.74, shares: 192.865, account: 'Malia Mutual IRA' },
  { ticker: 'ANCFX', name: 'American Funds Fundamental Investors® Class A', category: 'Index Fund', purchaseDate: '2019-02-07', pricePerShare: 85.74, shares: 56.163, account: 'Malia Mutual Roth' },
  { ticker: 'VFFVX', name: 'Vanguard Target Retirement 2055 Fund', category: 'Index Fund', purchaseDate: '2021-11-01', pricePerShare: 57.56, shares: 75.627, account: 'BSD 403b' },
];

// Current prices as of early April 2026 (from tab 5)
export const CURRENT_PRICES: Record<string, number> = {
  NVDA:  202.50,
  NFLX:   93.24,
  RDDT:  164.31,
  RIVN:   17.74,
  UBER:   75.58,
  TCEHY:  64.45,
  TSLA:  387.51,
  DIS:   104.82,
  AMZN:  255.36,
  MSFT:  432.92,
  GOOGL: 339.32,
  XLU:    44.87,
  VPU:   194.34,
  VT:    150.10,
  BND:    73.86,
  BNDW:   68.55,
  ORCL:  187.50,
  OKLO:   72.41,
  AVGO:  422.65,
  AMD:   303.46,
  VTI:   351.22,
  SOFI:   19.06,
  CIBR:   68.91,
  // Retirement tickers
  FFLDX:  27.06,
  VFFVX:  69.83,
  IWR:   103.87,
  ACWI:  150.17,
  SPX:     0.10,
  AGG:    99.61,
  ANCFX:  97.13,
};

// ─── Vaults ───────────────────────────────────────────────────────────────────

export interface SheetVault {
  rawName: string;
  sortOrder: number;
  category: string;
  groupOrder: number;
  who: 'All' | 'ABG' | 'Mal';
  frequency: string;
  description: string;
  goalDollars: number;
  rateMonths: number;
  dueMonths: string;
  currentDollars?: number; // for GOAL/VARIABLE vaults
  type: 'FIXED' | 'GOAL' | 'VARIABLE';
}

export const VAULTS: SheetVault[] = [
  { rawName: '01-Bills-01-All-Monthly-General-7000',           sortOrder: 1,  category: 'Bills',       groupOrder: 1, who: 'All',  frequency: 'MONTHLY',   description: 'General',    goalDollars: 7000,      rateMonths: 1,  dueMonths: '',      type: 'FIXED' },
  { rawName: '02-Bills-01-ABG-SemiAnn(5,11)-CarIns-750',       sortOrder: 2,  category: 'Bills',       groupOrder: 1, who: 'ABG',  frequency: 'SEMI-ANN',  description: 'CarIns',     goalDollars: 755,       rateMonths: 6,  dueMonths: '5,11',  type: 'FIXED' },
  { rawName: '02-Bills-02-ABG-3Yr(1)-VPN-80',                  sortOrder: 3,  category: 'Bills',       groupOrder: 2, who: 'ABG',  frequency: '3-YEAR',    description: 'VPN',        goalDollars: 80,        rateMonths: 36, dueMonths: '1',     type: 'FIXED' },
  { rawName: '02-Bills-03-ABG-1Yr(1)-General-140',             sortOrder: 4,  category: 'Bills',       groupOrder: 3, who: 'ABG',  frequency: '1-YEAR',    description: 'General',    goalDollars: 140,       rateMonths: 12, dueMonths: '1',     type: 'FIXED' },
  { rawName: '02-Bills-04-Mal-SemiAnn(6,12)-CarIns-655',       sortOrder: 5,  category: 'Bills',       groupOrder: 4, who: 'Mal',  frequency: 'SEMI-ANN',  description: 'CarIns',     goalDollars: 655,       rateMonths: 6,  dueMonths: '6,12',  type: 'FIXED' },
  { rawName: '03-Pers-01-ABG-3Mths-Personal-100',              sortOrder: 6,  category: 'Personal',    groupOrder: 1, who: 'ABG',  frequency: '3-MONTH',   description: 'Personal',   goalDollars: 100,       rateMonths: 3,  dueMonths: '',      type: 'FIXED' },
  { rawName: '03-Pers-02-Mal-3Mths-Personal-90',               sortOrder: 7,  category: 'Personal',    groupOrder: 2, who: 'Mal',  frequency: '3-MONTH',   description: 'Personal',   goalDollars: 90,        rateMonths: 3,  dueMonths: '',      type: 'FIXED' },
  { rawName: '04-PrePay-01-All-1Yr(3)-Taxes-4500',             sortOrder: 8,  category: 'Pre-Pay',     groupOrder: 1, who: 'All',  frequency: '1-YEAR',    description: 'Taxes',      goalDollars: 4500,      rateMonths: 12, dueMonths: '3',     type: 'FIXED' },
  { rawName: '04-PrePay-02-All-1Yr(12)-Maint-20000',           sortOrder: 9,  category: 'Pre-Pay',     groupOrder: 2, who: 'All',  frequency: '1-YEAR',    description: 'Maint',      goalDollars: 15000,     rateMonths: 12, dueMonths: '12',    type: 'FIXED' },
  { rawName: '05-Temp-01-All-Monthly-SchoolLoan-17000',         sortOrder: 10, category: 'Replenish',   groupOrder: 1, who: 'All',  frequency: 'MONTHLY',   description: 'SchoolLoan', goalDollars: 17431.59,  rateMonths: 24, dueMonths: '',      type: 'FIXED' },
  { rawName: '06-Invest-01-All-Monthly-Contribute-1100',        sortOrder: 11, category: 'Investments', groupOrder: 1, who: 'All',  frequency: 'MONTHLY',   description: 'Contribute', goalDollars: 1100,      rateMonths: 1,  dueMonths: '',      type: 'FIXED' },
  { rawName: '07-Other-01-All-1Yr(12)-Travel-10000',            sortOrder: 12, category: 'Other',       groupOrder: 1, who: 'All',  frequency: '1-YEAR',    description: 'Travel',     goalDollars: 12000,     rateMonths: 1,  dueMonths: '12',    type: 'GOAL',   currentDollars: 10210.33 },
  { rawName: '07-Other-02-All-1Yr(12)-Camping-2000',            sortOrder: 13, category: 'Other',       groupOrder: 2, who: 'All',  frequency: '1-YEAR',    description: 'Camping',    goalDollars: 2000,      rateMonths: 1,  dueMonths: '12',    type: 'GOAL',   currentDollars: 2021.40 },
  { rawName: '07-Other-03-All-1Yr(12)-Cabin-4400',              sortOrder: 14, category: 'Other',       groupOrder: 3, who: 'All',  frequency: '1-YEAR',    description: 'Cabin',      goalDollars: 4400,      rateMonths: 1,  dueMonths: '12',    type: 'GOAL',   currentDollars: 4446.87 },
  { rawName: '07-Other-04-All-4Yr-House-150000',                sortOrder: 15, category: 'Other',       groupOrder: 4, who: 'All',  frequency: '4-YEAR',    description: 'House',      goalDollars: 150000,    rateMonths: 48, dueMonths: '',      type: 'GOAL',   currentDollars: 14842.59 },
  { rawName: '07-Other-05-All-1Yr-Child 1-75000',               sortOrder: 16, category: 'Other',       groupOrder: 5, who: 'All',  frequency: '1-YEAR',    description: 'Child 1',    goalDollars: 75000,     rateMonths: 12, dueMonths: '',      type: 'GOAL',   currentDollars: 20776.35 },
  { rawName: '07-Other-06-All-2Yr-Child 2-75000',               sortOrder: 17, category: 'Other',       groupOrder: 6, who: 'All',  frequency: '2-YEAR',    description: 'Child 2',    goalDollars: 75000,     rateMonths: 24, dueMonths: '',      type: 'GOAL',   currentDollars: 6401.33 },
  { rawName: '07-Other-10-Mal-Monthly-Kickback-Vary',           sortOrder: 18, category: 'Other',       groupOrder: 10, who: 'Mal', frequency: 'MONTHLY',   description: 'Kickback',   goalDollars: 1,         rateMonths: 1,  dueMonths: '',      type: 'VARIABLE', currentDollars: 2041.86 },
  { rawName: '07-Other-11-ABG-Monthly-Kickback-Vary',           sortOrder: 19, category: 'Other',       groupOrder: 11, who: 'ABG', frequency: 'MONTHLY',   description: 'Kickback',   goalDollars: 1,         rateMonths: 1,  dueMonths: '',      type: 'VARIABLE', currentDollars: 4.63 },
  { rawName: '07-Other-12-All-Monthly-Hold/Temp-Vary',          sortOrder: 20, category: 'Other',       groupOrder: 12, who: 'All', frequency: 'MONTHLY',   description: 'Hold/Temp',  goalDollars: 1,         rateMonths: 1,  dueMonths: '',      type: 'VARIABLE', currentDollars: 0 },
];
