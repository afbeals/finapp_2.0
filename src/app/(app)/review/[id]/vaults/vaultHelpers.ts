import { toDollars } from '@/lib/money';
import { updateVault } from '@/lib/api';
import { semanticColors, colors } from '@/styles/tokens';
import type { Vault, VaultOwner } from '@/types/entities';

// ─── Raw-name derivation ──────────────────────────────────────────────────────

// Group order = position of category in CAT_ORDER (1-based)
export const CAT_ORDER = ['Bills', 'Personal', 'Pre-Pay', 'Replenish', 'Investments'];
export const CAT_GROUPS: Record<string, number> = Object.fromEntries(CAT_ORDER.map((c, i) => [c, i + 1]));

// Frequency abbreviation: "MONTHLY" → "Monthly", "SEMI-ANN" → "SemiAnn", "1-YEAR" → "1Yr", etc.
export const FREQ_ABBR: Record<string, string> = {
  'MONTHLY':  'Monthly',
  '2-MONTH':  '2Mo',
  '3-MONTH':  'Quarterly',
  '4-MONTH':  '4Mo',
  '6-MONTH':  'SemiAnn',
  '1-YEAR':   '1Yr',
  '2-YEAR':   '2Yr',
  '3-YEAR':   '3Yr',
  'GOAL':     'Goal',
};

export const FREQ_MONTHS: Record<string, number> = {
  'MONTHLY': 1, '2-MONTH': 2, '3-MONTH': 3, '4-MONTH': 4,
  '6-MONTH': 6, '1-YEAR': 12, '2-YEAR': 24, '3-YEAR': 36, 'GOAL': 1,
};

export const FREQUENCIES = ['MONTHLY', '2-MONTH', '3-MONTH', '4-MONTH', '6-MONTH', '1-YEAR', '2-YEAR', '3-YEAR', 'GOAL'];

export function buildFreqPart(frequency: string, dueMonths: string): string {
  const abbr = FREQ_ABBR[frequency] ?? frequency;
  const months = dueMonths.trim();
  if (months) return `${abbr}(${months})`;
  return abbr;
}

export function buildRawName(vault: Vault, innerOrder: number, groupOrder: number): string {
  const grp = String(groupOrder).padStart(2, '0');
  const inner = String(innerOrder).padStart(2, '0');
  const who = vault.owner?.name ? vault.owner.name.replace(/\s+/g, '') : 'All';
  const freqPart = buildFreqPart(vault.frequency, vault.dueMonths);
  const desc = vault.description.trim() || vault.name.replace(/\s+/g, '');
  const goal = vault.target != null ? String(Math.round(toDollars(vault.target))) : '0';
  const cat = (vault.category || 'Other').replace(/[\s-]+/g, '');
  return `${grp}-${cat}-${inner}-${who}-${freqPart}-${desc}-${goal}`;
}

export function buildTreasuryRawName(vault: Vault, innerOrder: number): string {
  const inner = String(innerOrder).padStart(2, '0');
  const who = vault.owner?.name ? vault.owner.name.replace(/\s+/g, '') : 'All';
  const desc = vault.description.trim() || vault.name.replace(/\s+/g, '');
  const goal = vault.target != null ? String(Math.round(toDollars(vault.target))) : 'Variable';
  return `T-${inner}-${who}-${desc}-${goal}`;
}

// ─── Category palette ─────────────────────────────────────────────────────────

export const CAT_COLORS: Record<string, { bg: string; border: string; header: string; text: string; subtext: string }> = {
  Bills:       { bg: semanticColors.warningBg, border: semanticColors.warningBorder, header: colors.warningLight, text: semanticColors.amberText, subtext: semanticColors.warningText },
  Personal:    { bg: semanticColors.purpleBg, border: semanticColors.purpleBorder, header: semanticColors.purpleLight, text: semanticColors.purpleTextDark, subtext: semanticColors.purpleTextMedium },
  'Pre-Pay':   { bg: semanticColors.primaryBg, border: semanticColors.primaryBorder, header: colors.primaryLight, text: semanticColors.primaryTextDark, subtext: colors.primaryHover },
  Replenish:   { bg: semanticColors.successBg, border: semanticColors.successBorder, header: colors.successLight, text: semanticColors.successTextDark, subtext: semanticColors.successTextMedium },
  Investments: { bg: semanticColors.tealBg, border: semanticColors.tealBorder, header: semanticColors.tealLight, text: semanticColors.tealText, subtext: semanticColors.tealTextMedium },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function monthlyAmount(vault: Vault): number {
  if (!vault.target || vault.rateMonths <= 0) return 0;
  return Math.round(vault.target / vault.rateMonths);
}

export function ownerBadgeColors(owner: VaultOwner | null): { bg: string; fg: string } {
  if (!owner) return { bg: colors.bg, fg: semanticColors.neutralText };
  return { bg: owner.color + '22', fg: owner.color };
}

export function patchApi(id: number, data: Partial<Vault>) {
  return updateVault(id, data);
}
