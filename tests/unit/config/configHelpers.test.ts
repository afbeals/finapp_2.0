import { describe, it, expect } from 'vitest';
import { accountTypeLabel, badgeColors, ACCOUNT_TYPES } from '@/app/(app)/config/configHelpers';

// ─── accountTypeLabel ─────────────────────────────────────────────────────────

describe('accountTypeLabel', () => {
  it('returns "Taxable Brokerage" for TAXABLE', () => {
    expect(accountTypeLabel('TAXABLE')).toBe('Taxable Brokerage');
  });

  it('returns "Traditional 401(k)" for TRADITIONAL_401K', () => {
    expect(accountTypeLabel('TRADITIONAL_401K')).toBe('Traditional 401(k)');
  });

  it('returns "Roth 401(k)" for ROTH_401K', () => {
    expect(accountTypeLabel('ROTH_401K')).toBe('Roth 401(k)');
  });

  it('returns "Traditional IRA" for TRADITIONAL_IRA', () => {
    expect(accountTypeLabel('TRADITIONAL_IRA')).toBe('Traditional IRA');
  });

  it('returns "Roth IRA" for ROTH_IRA', () => {
    expect(accountTypeLabel('ROTH_IRA')).toBe('Roth IRA');
  });

  it('returns "HSA" for HSA', () => {
    expect(accountTypeLabel('HSA')).toBe('HSA');
  });

  it('returns "Other" for OTHER', () => {
    expect(accountTypeLabel('OTHER')).toBe('Other');
  });

  it('falls back to the raw type string for unknown values', () => {
    expect(accountTypeLabel('CRYPTO')).toBe('CRYPTO');
    expect(accountTypeLabel('')).toBe('');
    expect(accountTypeLabel('UNKNOWN_TYPE')).toBe('UNKNOWN_TYPE');
  });

  it('covers all entries in ACCOUNT_TYPES', () => {
    for (const { value, label } of ACCOUNT_TYPES) {
      expect(accountTypeLabel(value)).toBe(label);
    }
  });
});

// ─── badgeColors ──────────────────────────────────────────────────────────────

describe('badgeColors', () => {
  it('returns bg with "22" alpha suffix appended', () => {
    const result = badgeColors('#3B82F6');
    expect(result.bg).toBe('#3B82F622');
  });

  it('returns fg equal to the original hex', () => {
    const result = badgeColors('#3B82F6');
    expect(result.fg).toBe('#3B82F6');
  });

  it('works with a 3-digit hex color', () => {
    const result = badgeColors('#fff');
    expect(result.bg).toBe('#fff22');
    expect(result.fg).toBe('#fff');
  });

  it('works with a dark color', () => {
    const result = badgeColors('#000000');
    expect(result.bg).toBe('#00000022');
    expect(result.fg).toBe('#000000');
  });

  it('works with a pink color', () => {
    const result = badgeColors('#EC4899');
    expect(result.bg).toBe('#EC489922');
    expect(result.fg).toBe('#EC4899');
  });

  it('returns object with only bg and fg keys', () => {
    const result = badgeColors('#aabbcc');
    expect(Object.keys(result).sort()).toEqual(['bg', 'fg']);
  });
});
