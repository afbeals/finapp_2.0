import { describe, it, expect } from 'vitest';
import {
  MONTH_NAMES_SHORT,
  MONTH_NAMES_LONG,
  payoffDateStr,
  monthlyPayment,
  amortizationSchedule,
  totalInterest,
  futureValue,
  yearsToFire,
  fireNumber,
  buildProjection,
} from '@/lib/fire';

describe('MONTH_NAMES_SHORT', () => {
  it('has exactly 12 entries', () => {
    expect(MONTH_NAMES_SHORT).toHaveLength(12);
  });

  it('starts with Jan', () => {
    expect(MONTH_NAMES_SHORT[0]).toBe('Jan');
  });

  it('ends with Dec', () => {
    expect(MONTH_NAMES_SHORT[11]).toBe('Dec');
  });

  it('contains Jul in position 6', () => {
    expect(MONTH_NAMES_SHORT[6]).toBe('Jul');
  });
});

describe('MONTH_NAMES_LONG', () => {
  it('has exactly 12 entries', () => {
    expect(MONTH_NAMES_LONG).toHaveLength(12);
  });

  it('starts with January', () => {
    expect(MONTH_NAMES_LONG[0]).toBe('January');
  });

  it('ends with December', () => {
    expect(MONTH_NAMES_LONG[11]).toBe('December');
  });

  it('contains July in position 6', () => {
    expect(MONTH_NAMES_LONG[6]).toBe('July');
  });
});

describe('payoffDateStr', () => {
  // Use mid-month dates (15th) to avoid UTC-midnight-to-local-time month boundary shifts
  it('returns formatted month and year when 0 payments and 0 remaining', () => {
    expect(payoffDateStr('2020-01-15', 0, 0)).toBe('Jan 2020');
  });

  it('advances month correctly across a year boundary', () => {
    // Starting Jan 2020, 6 payments made, 6 rem months → Jan 2021
    expect(payoffDateStr('2020-01-15', 6, 6)).toBe('Jan 2021');
  });

  it('wraps year when month advances past December', () => {
    // Starting Nov 2020, 0 payments, 2 rem months → Jan 2021
    expect(payoffDateStr('2020-11-15', 0, 2)).toBe('Jan 2021');
  });

  it('returns the correct mid-year month', () => {
    // Starting Jun 2020, 3 payments, 0 rem → Sep 2020
    expect(payoffDateStr('2020-06-15', 3, 0)).toBe('Sep 2020');
  });
});

describe('monthlyPayment', () => {
  it('computes payment for a standard loan', () => {
    // $200,000 loan at 6% annual, 360 months ≈ $1,199/mo
    const payment = monthlyPayment(20000000, 0.06, 360);
    expect(payment).toBeGreaterThan(119800);
    expect(payment).toBeLessThan(120100);
  });

  it('handles 0% interest rate (returns principal / term)', () => {
    expect(monthlyPayment(12000, 0, 12)).toBe(1000);
  });

  it('handles a 1-month term', () => {
    // Single payment = entire principal (plus tiny rounding)
    expect(monthlyPayment(100000, 0.06, 1)).toBe(100500);
  });
});

describe('amortizationSchedule', () => {
  it('returns the correct number of rows (may be fewer with extra payments)', () => {
    const rows = amortizationSchedule(100000, 0.06, 12);
    // Exact 12 rows for standard loan
    expect(rows).toHaveLength(12);
  });

  it('first row has correct structure', () => {
    const rows = amortizationSchedule(100000, 0.06, 12);
    const first = rows[0];
    expect(first).toHaveProperty('month', 1);
    expect(first).toHaveProperty('payment');
    expect(first).toHaveProperty('principal');
    expect(first).toHaveProperty('interest');
    expect(first).toHaveProperty('balance');
  });

  it('balance reaches 0 at the end', () => {
    const rows = amortizationSchedule(100000, 0.06, 12);
    expect(rows[rows.length - 1].balance).toBe(0);
  });

  it('extra monthly payments shorten the schedule', () => {
    const withoutExtra = amortizationSchedule(100000, 0.06, 12);
    const withExtra = amortizationSchedule(100000, 0.06, 12, 10000);
    expect(withExtra.length).toBeLessThan(withoutExtra.length);
  });

  it('handles 0% interest', () => {
    const rows = amortizationSchedule(12000, 0, 12);
    expect(rows[0].interest).toBe(0);
  });
});

describe('totalInterest', () => {
  it('returns a positive value for interest-bearing loan', () => {
    const interest = totalInterest(100000, 0.06, 12);
    expect(interest).toBeGreaterThan(0);
  });

  it('returns 0 for 0% interest loan', () => {
    expect(totalInterest(100000, 0, 12)).toBe(0);
  });

  it('extra payments reduce total interest paid', () => {
    const withoutExtra = totalInterest(100000, 0.06, 12);
    const withExtra = totalInterest(100000, 0.06, 12, 10000);
    expect(withExtra).toBeLessThan(withoutExtra);
  });
});

describe('futureValue', () => {
  it('returns presentValue when 0 contribution and 0% return over any period', () => {
    expect(futureValue(100000, 0, 0, 10)).toBe(100000);
  });

  it('adds contributions correctly with 0% return', () => {
    // $1000/mo for 12 months = $12,000 added to $0
    expect(futureValue(0, 1000, 0, 1)).toBe(12000);
  });

  it('grows a lump sum with compound interest', () => {
    const fv = futureValue(100000, 0, 0.12, 1);
    // ~$112,682 after 1 year at 12% compounded monthly
    expect(fv).toBeGreaterThan(112000);
    expect(fv).toBeLessThan(113000);
  });

  it('is larger with contributions than without', () => {
    const noContrib = futureValue(100000, 0, 0.07, 10);
    const withContrib = futureValue(100000, 500, 0.07, 10);
    expect(withContrib).toBeGreaterThan(noContrib);
  });
});

describe('yearsToFire', () => {
  it('returns 0 when already at or above FIRE target', () => {
    expect(yearsToFire(1000000, 5000, 0.07, 500000)).toBe(0);
    expect(yearsToFire(1000000, 5000, 0.07, 1000000)).toBe(0);
  });

  it('returns a finite number when reachable', () => {
    const years = yearsToFire(0, 100000, 0.07, 3000000);
    expect(Number.isFinite(years)).toBe(true);
    expect(years).toBeGreaterThan(0);
  });

  it('returns Infinity when target is unreachable (no contribution, no return)', () => {
    // $0 portfolio, $0 monthly contribution, 0% return, $1M target → never
    expect(yearsToFire(0, 0, 0, 1000000)).toBe(Infinity);
  });

  it('returns fewer years with higher monthly contribution', () => {
    const slow = yearsToFire(0, 10000, 0.07, 1000000);
    const fast = yearsToFire(0, 50000, 0.07, 1000000);
    expect(fast).toBeLessThan(slow);
  });
});

describe('fireNumber', () => {
  it('returns annual expenses × 25', () => {
    expect(fireNumber(100000)).toBe(2500000);
  });

  it('returns 0 for 0 expenses', () => {
    expect(fireNumber(0)).toBe(0);
  });

  it('handles large expense amounts', () => {
    expect(fireNumber(600000)).toBe(15000000);
  });
});

describe('buildProjection', () => {
  it('returns an array with the given number of years', () => {
    const points = buildProjection(0, 10000, 0.07, 10);
    expect(points).toHaveLength(10);
  });

  it('defaults to 30 years when no years argument given', () => {
    const points = buildProjection(0, 10000, 0.07);
    expect(points).toHaveLength(30);
  });

  it('each point has year, portfolioValue, contributions fields', () => {
    const points = buildProjection(1000, 500, 0.05, 2);
    expect(points[0]).toHaveProperty('year', 1);
    expect(points[0]).toHaveProperty('portfolioValue');
    expect(points[0]).toHaveProperty('contributions');
  });

  it('portfolio value grows over time with positive return', () => {
    const points = buildProjection(100000, 5000, 0.07, 5);
    for (let i = 1; i < points.length; i++) {
      expect(points[i].portfolioValue).toBeGreaterThan(points[i - 1].portfolioValue);
    }
  });

  it('cumulative contributions increase by monthlyContribution × 12 each year', () => {
    const monthly = 1000;
    const points = buildProjection(0, monthly, 0.07, 3);
    expect(points[0].contributions).toBe(monthly * 12);
    expect(points[1].contributions).toBe(monthly * 24);
    expect(points[2].contributions).toBe(monthly * 36);
  });

  it('returns empty array for 0 years', () => {
    expect(buildProjection(100000, 1000, 0.07, 0)).toHaveLength(0);
  });
});
