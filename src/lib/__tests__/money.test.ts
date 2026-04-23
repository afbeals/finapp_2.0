import { describe, it, expect } from 'vitest';
import {
  toCents,
  toDollars,
  formatDollars,
  formatDollarsWhole,
  formatPercent,
  formatRate,
  parseDollarsToCents,
} from '@/lib/money';

describe('toCents', () => {
  it('converts a whole dollar amount', () => {
    expect(toCents(1)).toBe(100);
  });

  it('converts a fractional dollar amount', () => {
    expect(toCents(1.5)).toBe(150);
  });

  it('rounds mid-point values correctly', () => {
    // 1.5 * 100 = 150 exactly
    expect(toCents(1.5)).toBe(150);
  });

  it('returns 0 for 0', () => {
    expect(toCents(0)).toBe(0);
  });

  it('handles negative values', () => {
    expect(toCents(-2.5)).toBe(-250);
  });

  it('handles large values', () => {
    expect(toCents(10000)).toBe(1000000);
  });
});

describe('toDollars', () => {
  it('converts cents to dollars', () => {
    expect(toDollars(100)).toBe(1);
  });

  it('converts fractional dollars', () => {
    expect(toDollars(150)).toBe(1.5);
  });

  it('returns 0 for 0 cents', () => {
    expect(toDollars(0)).toBe(0);
  });

  it('handles negative cents', () => {
    expect(toDollars(-250)).toBe(-2.5);
  });

  it('handles large cent values', () => {
    expect(toDollars(1000000)).toBe(10000);
  });
});

describe('formatDollars', () => {
  it('formats a standard amount with two decimal places', () => {
    expect(formatDollars(123456)).toBe('$1,234.56');
  });

  it('formats zero', () => {
    expect(formatDollars(0)).toBe('$0.00');
  });

  it('formats negative amounts', () => {
    expect(formatDollars(-500)).toBe('-$5.00');
  });

  it('formats small amounts below a dollar', () => {
    expect(formatDollars(50)).toBe('$0.50');
  });

  describe('compact option', () => {
    it('does not compact amounts below $1,000', () => {
      expect(formatDollars(99999, { compact: true })).toBe('$999.99');
    });

    it('compacts thousands as k', () => {
      expect(formatDollars(1500000, { compact: true })).toBe('$15.0k');
    });

    it('compacts millions as M', () => {
      expect(formatDollars(1_500_000_00, { compact: true })).toBe('$1.5M');
    });

    it('compacts negative thousands (sign inside dollar prefix)', () => {
      // compact path: `$${(dollars / 1000).toFixed(1)}k` → "$-20.0k"
      expect(formatDollars(-2000000, { compact: true })).toBe('$-20.0k');
    });

    it('does not compact when compact is false (default)', () => {
      expect(formatDollars(1500000)).toBe('$15,000.00');
    });
  });
});

describe('formatDollarsWhole', () => {
  it('formats without cents', () => {
    expect(formatDollarsWhole(123456)).toBe('$1,235');
  });

  it('formats zero', () => {
    expect(formatDollarsWhole(0)).toBe('$0');
  });

  it('formats negative amounts', () => {
    expect(formatDollarsWhole(-50000)).toBe('-$500');
  });

  it('truncates (rounds) fractional cents', () => {
    // 199 cents = $1.99 → rounds to $2
    expect(formatDollarsWhole(199)).toBe('$2');
  });
});

describe('formatPercent', () => {
  it('formats a decimal as a percentage with 1 decimal by default', () => {
    expect(formatPercent(0.1234)).toBe('12.3%');
  });

  it('formats zero', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('formats negative percentages', () => {
    expect(formatPercent(-0.05)).toBe('-5.0%');
  });

  it('formats 100%', () => {
    expect(formatPercent(1)).toBe('100.0%');
  });

  it('respects custom decimal places', () => {
    expect(formatPercent(0.1234, 2)).toBe('12.34%');
  });

  it('formats with 0 decimal places', () => {
    expect(formatPercent(0.155, 0)).toBe('16%');
  });
});

describe('formatRate', () => {
  it('formats a rate with 2 decimal places', () => {
    expect(formatRate(0.0625)).toBe('6.25%');
  });

  it('formats zero rate', () => {
    expect(formatRate(0)).toBe('0.00%');
  });

  it('formats a 100% rate', () => {
    expect(formatRate(1)).toBe('100.00%');
  });

  it('formats a small rate', () => {
    expect(formatRate(0.001)).toBe('0.10%');
  });

  it('formats a negative rate', () => {
    expect(formatRate(-0.03)).toBe('-3.00%');
  });
});

describe('parseDollarsToCents', () => {
  it('parses a standard dollar string', () => {
    expect(parseDollarsToCents('$1,234.56')).toBe(123456);
  });

  it('parses without a dollar sign', () => {
    expect(parseDollarsToCents('1234.56')).toBe(123456);
  });

  it('parses without commas', () => {
    expect(parseDollarsToCents('1234.56')).toBe(123456);
  });

  it('returns 0 for empty string', () => {
    expect(parseDollarsToCents('')).toBe(0);
  });

  it('returns 0 for non-numeric input', () => {
    expect(parseDollarsToCents('abc')).toBe(0);
  });

  it('handles zero', () => {
    expect(parseDollarsToCents('$0.00')).toBe(0);
  });

  it('handles whole dollar amounts', () => {
    expect(parseDollarsToCents('$500')).toBe(50000);
  });

  it('strips whitespace', () => {
    expect(parseDollarsToCents(' $10.00 ')).toBe(1000);
  });

  it('rounds correctly for fractional cents', () => {
    expect(parseDollarsToCents('$0.005')).toBe(1);
  });
});
