// Shared helpers used by multiple config section components

export const ACCOUNT_TYPES = [
  { value: 'TAXABLE', label: 'Taxable Brokerage' },
  { value: 'TRADITIONAL_401K', label: 'Traditional 401(k)' },
  { value: 'ROTH_401K', label: 'Roth 401(k)' },
  { value: 'TRADITIONAL_IRA', label: 'Traditional IRA' },
  { value: 'ROTH_IRA', label: 'Roth IRA' },
  { value: 'HSA', label: 'HSA' },
  { value: 'OTHER', label: 'Other' },
];

export function accountTypeLabel(type: string) {
  return ACCOUNT_TYPES.find((t) => t.value === type)?.label ?? type;
}

// Derive badge colors from a hex color
export function badgeColors(hex: string) {
  return { bg: hex + '22', fg: hex };
}
