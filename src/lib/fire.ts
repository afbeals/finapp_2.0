/**
 * Financial math utilities:
 * - Loan amortization
 * - Compound growth
 * - FIRE projections
 */

export const MONTH_NAMES_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const;
export const MONTH_NAMES_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'] as const;

/** Format a date as "Mon YYYY" given a start date + payments made + remaining months */
export function payoffDateStr(startDate: string, paymentsMade: number, remMonths: number): string {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + paymentsMade + remMonths);
  return `${MONTH_NAMES_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

/** Monthly payment for a standard amortizing loan */
export function monthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  if (annualRate === 0) return Math.round(principal / termMonths);
  const r = annualRate / 12;
  const payment = (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
  return Math.round(payment);
}

export interface AmortizationRow {
  month: number;
  payment: number;      // cents
  principal: number;   // cents
  interest: number;    // cents
  balance: number;     // cents
}

/** Full amortization schedule (cents throughout) */
export function amortizationSchedule(
  principal: number,
  annualRate: number,
  termMonths: number,
  extraMonthly = 0
): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  let balance = principal;
  const r = annualRate / 12;

  for (let month = 1; month <= termMonths; month++) {
    if (balance <= 0) break;
    const interest = Math.round(balance * r);
    const basePayment = monthlyPayment(principal, annualRate, termMonths);
    const principalPaid = Math.min(balance, Math.round(basePayment - interest + extraMonthly));
    balance = Math.max(0, balance - principalPaid);

    rows.push({ month, payment: basePayment + extraMonthly, principal: principalPaid, interest, balance });
  }

  return rows;
}

/** Total interest paid over life of loan (cents) */
export function totalInterest(
  principal: number,
  annualRate: number,
  termMonths: number,
  extraMonthly = 0
): number {
  return amortizationSchedule(principal, annualRate, termMonths, extraMonthly)
    .reduce((sum, row) => sum + row.interest, 0);
}

/**
 * Returns the payment number (1-based) at which the loan balance first drops to or below
 * targetBalance (cents). Returns -1 if the balance never reaches the target within the term.
 */
export function pmiDropMonth(
  principal: number,
  annualRate: number,
  termMonths: number,
  targetBalance: number,
): number {
  const schedule = amortizationSchedule(principal, annualRate, termMonths);
  const row = schedule.find((r) => r.balance <= targetBalance);
  return row ? row.month : -1;
}

/**
 * Projection schedule starting from a known remaining balance rather than
 * original principal. Used to correctly forecast payoff date / total interest
 * after partial payments have already been made.
 */
export function projectedScheduleFrom(
  currentBalance: number,
  annualRate: number,
  monthsRemaining: number,
  extraMonthly = 0,
): AmortizationRow[] {
  if (currentBalance <= 0 || monthsRemaining <= 0) return [];
  const rows: AmortizationRow[] = [];
  let balance = currentBalance;
  const r = annualRate / 12;
  const basePayment = r > 0
    ? Math.round((currentBalance * r * Math.pow(1 + r, monthsRemaining)) / (Math.pow(1 + r, monthsRemaining) - 1))
    : Math.round(currentBalance / monthsRemaining);

  for (let month = 1; month <= monthsRemaining; month++) {
    if (balance <= 0) break;
    const interest = Math.round(balance * r);
    const principalPaid = Math.min(balance, Math.round(basePayment - interest + extraMonthly));
    balance = Math.max(0, balance - principalPaid);
    rows.push({ month, payment: basePayment + extraMonthly, principal: principalPaid, interest, balance });
  }
  return rows;
}

/**
 * Future value of a lump sum + recurring contributions compounded monthly
 * @param presentValue - current portfolio value (cents)
 * @param monthlyContribution - monthly addition (cents)
 * @param annualReturn - expected annual return as decimal (e.g. 0.07)
 * @param years - projection horizon
 */
export function futureValue(
  presentValue: number,
  monthlyContribution: number,
  annualReturn: number,
  years: number
): number {
  const r = annualReturn / 12;
  const n = years * 12;

  if (r === 0) return presentValue + monthlyContribution * n;

  const fvLump = presentValue * Math.pow(1 + r, n);
  const fvContributions = monthlyContribution * ((Math.pow(1 + r, n) - 1) / r);
  return Math.round(fvLump + fvContributions);
}

/**
 * Years to FIRE target given current portfolio, monthly savings, and expected return
 * Returns Infinity if never reached
 */
export function yearsToFire(
  currentPortfolio: number,
  monthlyContribution: number,
  annualReturn: number,
  fireTarget: number
): number {
  if (currentPortfolio >= fireTarget) return 0;

  const r = annualReturn / 12;
  let balance = currentPortfolio;

  for (let month = 1; month <= 1200; month++) {
    balance = balance * (1 + r) + monthlyContribution;
    if (balance >= fireTarget) return month / 12;
  }

  return Infinity;
}

/**
 * FIRE number: annual expenses × 25 (4% withdrawal rate)
 * @param annualExpenses - cents
 */
export function fireNumber(annualExpenses: number): number {
  return annualExpenses * 25;
}

/**
 * Build a year-by-year projection array for charting
 */
export interface ProjectionPoint {
  year: number;
  portfolioValue: number; // cents
  contributions: number;  // cents cumulative
}

export function buildProjection(
  currentPortfolio: number,
  monthlyContribution: number,
  annualReturn: number,
  years = 30
): ProjectionPoint[] {
  const points: ProjectionPoint[] = [];
  let balance = currentPortfolio;
  let totalContributions = 0;

  for (let year = 1; year <= years; year++) {
    balance = futureValue(balance, monthlyContribution, annualReturn, 1);
    totalContributions += monthlyContribution * 12;
    points.push({ year, portfolioValue: balance, contributions: totalContributions });
  }

  return points;
}
