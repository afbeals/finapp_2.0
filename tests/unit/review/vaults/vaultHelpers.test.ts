import { describe, it, expect, vi } from 'vitest';
import {
  buildFreqPart,
  buildRawName,
  buildTreasuryRawName,
  monthlyAmount,
  ownerBadgeColors,
  CAT_ORDER,
  CAT_GROUPS,
  FREQUENCIES,
} from '@/app/(app)/review/[id]/vaults/vaultHelpers';
import { colors, semanticColors } from '@/styles/tokens';
import type { Vault, VaultOwner } from '@/types/entities';

// Note: `patchApi` is a side-effectful wrapper around updateVault (an API call).
// It is intentionally not covered here — it has no testable logic of its own
// and would require mocking the network/API layer.

// ─── Stub factory ─────────────────────────────────────────────────────────────

function makeVault(overrides: Partial<Vault> = {}): Vault {
  return {
    id: 1,
    name: 'Emergency Fund',
    type: 'FIXED',
    category: 'Personal',
    owner: null,
    ownerMemberId: null,
    target: 100000, // 100000 cents = $1,000
    frequency: 'MONTHLY',
    rateMonths: 1,
    currentBalance: 50000,
    treasuryPct: 0,
    sortOrder: 1,
    description: 'EmergencyFund',
    dueMonths: '',
    ...overrides,
  };
}

// ─── CAT_ORDER ────────────────────────────────────────────────────────────────

describe('CAT_ORDER', () => {
  it('has 5 categories in the expected order', () => {
    expect(CAT_ORDER).toEqual(['Bills', 'Personal', 'Pre-Pay', 'Replenish', 'Investments']);
  });
});

// ─── CAT_GROUPS ───────────────────────────────────────────────────────────────

describe('CAT_GROUPS', () => {
  it('maps each category to a 1-based index', () => {
    expect(CAT_GROUPS['Bills']).toBe(1);
    expect(CAT_GROUPS['Personal']).toBe(2);
    expect(CAT_GROUPS['Pre-Pay']).toBe(3);
    expect(CAT_GROUPS['Replenish']).toBe(4);
    expect(CAT_GROUPS['Investments']).toBe(5);
  });

  it('has the same number of keys as CAT_ORDER', () => {
    expect(Object.keys(CAT_GROUPS)).toHaveLength(CAT_ORDER.length);
  });
});

// ─── FREQUENCIES ──────────────────────────────────────────────────────────────

describe('FREQUENCIES', () => {
  it('contains MONTHLY', () => {
    expect(FREQUENCIES).toContain('MONTHLY');
  });

  it('contains GOAL', () => {
    expect(FREQUENCIES).toContain('GOAL');
  });

  it('has 9 entries', () => {
    expect(FREQUENCIES).toHaveLength(9);
  });
});

// ─── buildFreqPart ────────────────────────────────────────────────────────────

describe('buildFreqPart', () => {
  it('returns abbreviation alone when dueMonths is empty', () => {
    expect(buildFreqPart('MONTHLY', '')).toBe('Monthly');
  });

  it('wraps dueMonths in parentheses when present', () => {
    expect(buildFreqPart('MONTHLY', 'Jan')).toBe('Monthly(Jan)');
  });

  it('trims whitespace from dueMonths', () => {
    expect(buildFreqPart('3-MONTH', ' Mar ')).toBe('Quarterly(Mar)');
  });

  it('falls back to raw frequency key when not in FREQ_ABBR', () => {
    expect(buildFreqPart('UNKNOWN_FREQ', '')).toBe('UNKNOWN_FREQ');
  });

  it('maps 6-MONTH to SemiAnn', () => {
    expect(buildFreqPart('6-MONTH', '')).toBe('SemiAnn');
  });

  it('maps 1-YEAR to 1Yr', () => {
    expect(buildFreqPart('1-YEAR', '')).toBe('1Yr');
  });

  it('maps GOAL to Goal', () => {
    expect(buildFreqPart('GOAL', '')).toBe('Goal');
  });
});

// ─── buildRawName ─────────────────────────────────────────────────────────────

describe('buildRawName', () => {
  it('builds a raw name with the expected format', () => {
    const vault = makeVault({
      category: 'Personal',
      owner: null,
      frequency: 'MONTHLY',
      dueMonths: '',
      description: 'EmergencyFund',
      target: 100000, // $1,000 in cents
    });
    const name = buildRawName(vault, 3, 2);
    // grp=02, cat=Personal, inner=03, who=All, freqPart=Monthly, desc=EmergencyFund, goal=1000
    expect(name).toBe('02-Personal-03-All-Monthly-EmergencyFund-1000');
  });

  it('zero-pads single-digit group and inner orders', () => {
    const vault = makeVault({ description: 'Test', target: 0 });
    const name = buildRawName(vault, 1, 1);
    expect(name).toMatch(/^01-.*-01-/);
  });

  it('uses owner name (spaces removed) when owner is set', () => {
    const vault = makeVault({
      owner: { id: 1, name: 'John Doe', color: '#fff' },
      description: 'Gym',
      target: 5000,
    });
    const name = buildRawName(vault, 1, 1);
    expect(name).toContain('JohnDoe');
  });

  it('falls back to "All" when owner is null', () => {
    const vault = makeVault({ owner: null, description: 'Test', target: 0 });
    expect(buildRawName(vault, 1, 1)).toContain('-All-');
  });

  it('uses vault name (spaces removed) when description is empty', () => {
    const vault = makeVault({ description: '   ', name: 'Gym Membership', target: 0 });
    const name = buildRawName(vault, 1, 1);
    expect(name).toContain('GymMembership');
  });

  it('uses "0" as goal when target is null', () => {
    const vault = makeVault({ target: null, description: 'Test' });
    const name = buildRawName(vault, 1, 1);
    expect(name).toMatch(/-0$/);
  });

  it('rounds target to whole dollars in the goal field', () => {
    // 150 cents = $1.50 → rounds to 2 in the name (via Math.round(toDollars(150)))
    const vault = makeVault({ target: 150, description: 'Test' });
    const name = buildRawName(vault, 1, 1);
    expect(name).toMatch(/-2$/);
  });
});

// ─── buildTreasuryRawName ─────────────────────────────────────────────────────

describe('buildTreasuryRawName', () => {
  it('builds a treasury name with T- prefix', () => {
    const vault = makeVault({ description: 'TaxBill', target: 500000, owner: null });
    const name = buildTreasuryRawName(vault, 1);
    expect(name).toMatch(/^T-01-All-TaxBill-5000$/);
  });

  it('zero-pads single-digit inner order', () => {
    const vault = makeVault({ description: 'Test', target: 0 });
    expect(buildTreasuryRawName(vault, 5)).toMatch(/^T-05-/);
  });

  it('includes owner name without spaces', () => {
    const vault = makeVault({
      owner: { id: 2, name: 'Mary Jane', color: '#fff' },
      description: 'Savings',
      target: 200000,
    });
    const name = buildTreasuryRawName(vault, 2);
    expect(name).toContain('MaryJane');
  });

  it('uses "Variable" when target is null', () => {
    const vault = makeVault({ target: null, description: 'Fund' });
    const name = buildTreasuryRawName(vault, 1);
    expect(name).toMatch(/-Variable$/);
  });

  it('uses vault name (spaces removed) when description is blank', () => {
    const vault = makeVault({ description: '', name: 'Tax Fund', target: 0 });
    const name = buildTreasuryRawName(vault, 1);
    expect(name).toContain('TaxFund');
  });
});

// ─── monthlyAmount ────────────────────────────────────────────────────────────

describe('monthlyAmount', () => {
  it('divides target by rateMonths and rounds', () => {
    const vault = makeVault({ target: 120000, rateMonths: 12 });
    expect(monthlyAmount(vault)).toBe(10000);
  });

  it('returns 0 when target is null', () => {
    const vault = makeVault({ target: null, rateMonths: 1 });
    expect(monthlyAmount(vault)).toBe(0);
  });

  it('returns 0 when rateMonths is 0 (avoid division by zero)', () => {
    const vault = makeVault({ target: 100000, rateMonths: 0 });
    expect(monthlyAmount(vault)).toBe(0);
  });

  it('returns 0 when rateMonths is negative', () => {
    const vault = makeVault({ target: 100000, rateMonths: -1 });
    expect(monthlyAmount(vault)).toBe(0);
  });

  it('rounds the result', () => {
    // 10 / 3 = 3.33... → rounds to 3
    const vault = makeVault({ target: 10, rateMonths: 3 });
    expect(monthlyAmount(vault)).toBe(3);
  });
});

// ─── ownerBadgeColors ─────────────────────────────────────────────────────────

describe('ownerBadgeColors', () => {
  it('returns default neutral colors when owner is null', () => {
    expect(ownerBadgeColors(null)).toEqual({
      bg: colors.bg,
      fg: semanticColors.neutralText,
    });
  });

  it('derives bg from owner color with 22 alpha suffix', () => {
    const owner: VaultOwner = { id: 1, name: 'Alice', color: '#FF0000' };
    const result = ownerBadgeColors(owner);
    expect(result.bg).toBe('#FF000022');
    expect(result.fg).toBe('#FF0000');
  });

  it('passes owner color through as fg unchanged', () => {
    const owner: VaultOwner = { id: 2, name: 'Bob', color: '#3B82F6' };
    const result = ownerBadgeColors(owner);
    expect(result.fg).toBe('#3B82F6');
  });
});
