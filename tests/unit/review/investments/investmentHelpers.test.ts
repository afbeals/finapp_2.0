import { describe, it, expect } from 'vitest';
import {
  buildPositions,
  buildCategoryColorMap,
  categoryColorFromMap,
  acctBadge,
  fmtGain,
  fmtPct,
  portPct,
} from '@/app/(app)/review/[id]/investments/investmentHelpers';
import { theme } from '@/styles/tokens';

const { colors, semanticColors } = theme;
import type { InvestmentAccount, InvestmentCategory, Purchase } from '@/types/entities';

// ─── Minimal stub factories ────────────────────────────────────────────────────

function makePurchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    id: 1,
    accountId: 1,
    ticker: 'AAPL',
    name: 'Apple Inc.',
    category: 'US Stock',
    purchaseDate: '2022-01-01',
    pricePerShare: 10000, // cents
    shares: 10,
    ...overrides,
  };
}

function makeAccount(overrides: Partial<InvestmentAccount> = {}): InvestmentAccount {
  return {
    id: 1,
    name: 'Brokerage',
    type: 'TAXABLE',
    institution: 'Fidelity',
    ownerMemberId: null,
    owner: null,
    purchases: [],
    ...overrides,
  };
}

// ─── buildPositions ────────────────────────────────────────────────────────────

describe('buildPositions', () => {
  it('returns empty array for empty accounts', () => {
    expect(buildPositions([], {})).toEqual([]);
  });

  it('returns empty array when accounts have no purchases', () => {
    const acct = makeAccount({ purchases: [] });
    expect(buildPositions([acct], {})).toEqual([]);
  });

  it('builds a position from a single purchase', () => {
    const purchase = makePurchase({ ticker: 'AAPL', shares: 5, pricePerShare: 10000 });
    const acct = makeAccount({ purchases: [purchase] });
    const [pos] = buildPositions([acct], { AAPL: 12000 });

    expect(pos.ticker).toBe('AAPL');
    expect(pos.totalShares).toBe(5);
    expect(pos.totalCostBasis).toBe(50000); // 5 * 10000
    expect(pos.currentPrice).toBe(12000);
    expect(pos.currentValue).toBe(60000); // 5 * 12000
    expect(pos.gainLoss).toBe(10000); // 60000 - 50000
  });

  it('aggregates multiple lots of the same ticker', () => {
    const p1 = makePurchase({ id: 1, ticker: 'AAPL', shares: 5, pricePerShare: 10000, purchaseDate: '2022-01-01' });
    const p2 = makePurchase({ id: 2, ticker: 'AAPL', shares: 10, pricePerShare: 15000, purchaseDate: '2023-01-01' });
    const acct = makeAccount({ purchases: [p1, p2] });
    const [pos] = buildPositions([acct], { AAPL: 20000 });

    expect(pos.totalShares).toBe(15);
    // costBasis: round(5*10000) + round(10*15000) = 50000 + 150000 = 200000
    expect(pos.totalCostBasis).toBe(200000);
  });

  it('aggregates the same ticker across multiple accounts', () => {
    const p1 = makePurchase({ id: 1, accountId: 1, ticker: 'VTSAX', shares: 100, pricePerShare: 5000 });
    const p2 = makePurchase({ id: 2, accountId: 2, ticker: 'VTSAX', shares: 50, pricePerShare: 5000 });
    const acct1 = makeAccount({ id: 1, purchases: [p1] });
    const acct2 = makeAccount({ id: 2, purchases: [p2] });
    const [pos] = buildPositions([acct1, acct2], { VTSAX: 6000 });

    expect(pos.totalShares).toBe(150);
    expect(pos.accountIds).toContain(1);
    expect(pos.accountIds).toContain(2);
  });

  it('computes growthPct correctly', () => {
    const purchase = makePurchase({ shares: 1, pricePerShare: 10000 });
    const acct = makeAccount({ purchases: [purchase] });
    const [pos] = buildPositions([acct], { AAPL: 11000 });

    // costBasis=10000, currentValue=11000, gain=1000, growthPct=0.1
    expect(pos.growthPct).toBeCloseTo(0.1);
  });

  it('uses 0 growthPct when costBasis is 0 (edge: 0 shares)', () => {
    const purchase = makePurchase({ shares: 0, pricePerShare: 10000 });
    const acct = makeAccount({ purchases: [purchase] });
    const [pos] = buildPositions([acct], { AAPL: 10000 });
    expect(pos.growthPct).toBe(0);
  });

  it('uses 0 as currentPrice when ticker not in livePrices', () => {
    const purchase = makePurchase({ ticker: 'XYZ' });
    const acct = makeAccount({ purchases: [purchase] });
    const [pos] = buildPositions([acct], {});
    expect(pos.currentPrice).toBe(0);
    expect(pos.currentValue).toBe(0);
  });

  it('sorts lots by purchaseDate ascending', () => {
    const p1 = makePurchase({ id: 1, purchaseDate: '2023-06-01' });
    const p2 = makePurchase({ id: 2, purchaseDate: '2022-01-01' });
    const acct = makeAccount({ purchases: [p1, p2] });
    const [pos] = buildPositions([acct], { AAPL: 10000 });

    expect(pos.lots[0].purchaseDate).toBe('2022-01-01');
    expect(pos.lots[1].purchaseDate).toBe('2023-06-01');
  });

  it('returns separate positions for different tickers', () => {
    const pApple = makePurchase({ id: 1, ticker: 'AAPL', name: 'Apple' });
    const pGoogle = makePurchase({ id: 2, ticker: 'GOOGL', name: 'Google' });
    const acct = makeAccount({ purchases: [pApple, pGoogle] });
    const positions = buildPositions([acct], { AAPL: 15000, GOOGL: 25000 });

    expect(positions).toHaveLength(2);
    const tickers = positions.map((p) => p.ticker).sort();
    expect(tickers).toEqual(['AAPL', 'GOOGL']);
  });
});

// ─── buildCategoryColorMap ─────────────────────────────────────────────────────

describe('buildCategoryColorMap', () => {
  it('returns empty object for empty input', () => {
    expect(buildCategoryColorMap([])).toEqual({});
  });

  it('maps category name to bg/fg colors', () => {
    const cats: InvestmentCategory[] = [
      { id: 1, name: 'US Stock', color: '#3B82F6', sortOrder: 1 },
    ];
    const map = buildCategoryColorMap(cats);
    expect(map['US Stock']).toEqual({ bg: '#3B82F622', fg: '#3B82F6' });
  });

  it('handles multiple categories', () => {
    const cats: InvestmentCategory[] = [
      { id: 1, name: 'US Stock', color: '#3B82F6', sortOrder: 1 },
      { id: 2, name: 'Bonds', color: '#22C55E', sortOrder: 2 },
    ];
    const map = buildCategoryColorMap(cats);
    expect(Object.keys(map)).toHaveLength(2);
    expect(map['Bonds'].fg).toBe('#22C55E');
  });
});

// ─── categoryColorFromMap ──────────────────────────────────────────────────────

describe('categoryColorFromMap', () => {
  const colorMap = { 'US Stock': { bg: '#DBEAFE', fg: '#1E40AF' } };

  it('returns the mapped colors when category exists', () => {
    expect(categoryColorFromMap(colorMap, 'US Stock')).toEqual({ bg: '#DBEAFE', fg: '#1E40AF' });
  });

  it('returns default neutral colors for unknown category', () => {
    const result = categoryColorFromMap(colorMap, 'Unknown');
    expect(result).toEqual({ bg: colors.bg, fg: semanticColors.neutralText });
  });

  it('returns defaults for empty map', () => {
    const result = categoryColorFromMap({}, 'Anything');
    expect(result).toEqual({ bg: colors.bg, fg: semanticColors.neutralText });
  });
});

// ─── acctBadge ────────────────────────────────────────────────────────────────

describe('acctBadge', () => {
  it('returns an object with bg and fg keys', () => {
    const badge = acctBadge(0);
    expect(badge).toHaveProperty('bg');
    expect(badge).toHaveProperty('fg');
  });

  it('wraps around the palette (index 0 === index 7 for a 7-item palette)', () => {
    expect(acctBadge(0)).toEqual(acctBadge(7));
  });

  it('does not throw for large indices', () => {
    expect(() => acctBadge(1000)).not.toThrow();
  });

  it('returns different colors for consecutive indices (not all the same)', () => {
    expect(acctBadge(0)).not.toEqual(acctBadge(1));
  });
});

// ─── fmtGain ──────────────────────────────────────────────────────────────────

describe('fmtGain', () => {
  it('prefixes positive gain with +', () => {
    expect(fmtGain(1000)).toMatch(/^\+/);
  });

  it('does not add + prefix for negative gain', () => {
    expect(fmtGain(-500)).not.toMatch(/^\+/);
  });

  it('formats zero with +', () => {
    expect(fmtGain(0)).toMatch(/^\+/);
  });

  it('includes dollar-formatted value', () => {
    expect(fmtGain(100000)).toBe('+$1,000.00');
  });

  it('negative gain includes minus sign from currency format', () => {
    expect(fmtGain(-50000)).toBe('-$500.00');
  });
});

// ─── fmtPct ───────────────────────────────────────────────────────────────────

describe('fmtPct', () => {
  it('prefixes positive value with +', () => {
    expect(fmtPct(0.1)).toMatch(/^\+/);
  });

  it('does not add + for negative value', () => {
    expect(fmtPct(-0.05)).not.toMatch(/^\+/);
  });

  it('formats to 2 decimal places', () => {
    expect(fmtPct(0.1234)).toBe('+12.34%');
  });

  it('formats zero', () => {
    expect(fmtPct(0)).toBe('+0.00%');
  });

  it('formats negative percentage', () => {
    expect(fmtPct(-0.25)).toBe('-25.00%');
  });
});

// ─── portPct ──────────────────────────────────────────────────────────────────

describe('portPct', () => {
  it('returns "—" when total is 0', () => {
    expect(portPct(500, 0)).toBe('—');
  });

  it('calculates percentage correctly', () => {
    expect(portPct(250, 1000)).toBe('25.0%');
  });

  it('returns 100.0% when val equals total', () => {
    expect(portPct(1000, 1000)).toBe('100.0%');
  });

  it('handles very small fraction', () => {
    expect(portPct(1, 10000)).toBe('0.0%');
  });

  it('returns 1 decimal place', () => {
    expect(portPct(1, 3)).toBe('33.3%');
  });
});
