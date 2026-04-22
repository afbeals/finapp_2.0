import { formatDollars } from '@/lib/money';
import { colors, semanticColors } from '@/styles/tokens';
import type { Purchase, InvestmentAccount, InvestmentCategory } from '@/types/entities';

// A position = all purchase lots for one ticker within a section, aggregated
export interface Position {
  ticker: string;
  name: string;
  category: string;
  lots: Purchase[];
  totalShares: number;
  totalCostBasis: number; // cents (sum of pricePerShare × shares per lot)
  avgCostPerShare: number; // cents
  currentPrice: number; // cents, from live API
  currentValue: number; // cents
  gainLoss: number; // cents
  growthPct: number; // decimal
  accountIds: number[]; // for retirement — which accounts hold this ticker
}

export const TAXABLE_TYPES = new Set(['TAXABLE']);
export const RETIREMENT_TYPES = new Set(['TRADITIONAL_401K', 'ROTH_401K', 'TRADITIONAL_IRA', 'ROTH_IRA', 'HSA', 'OTHER']);

export const AccountTypeLabel: Record<string, string> = {
  TAXABLE: 'Brokerage',
  TRADITIONAL_401K: '401(k)',
  ROTH_401K: 'Roth 401(k)',
  TRADITIONAL_IRA: 'Traditional IRA',
  ROTH_IRA: 'Roth IRA',
  HSA: 'HSA',
  OTHER: 'Other',
};

// ─── Aggregation helper ───────────────────────────────────────────────────────

export function buildPositions(
  accounts: InvestmentAccount[],
  livePrices: Record<string, number>
): Position[] {
  // Group all purchases by ticker across given accounts
  const byTicker = new Map<string, { purchases: Purchase[]; name: string; category: string; accountIds: Set<number> }>();

  for (const acct of accounts) {
    for (const p of acct.purchases) {
      const key = p.ticker;
      if (!byTicker.has(key)) {
        byTicker.set(key, { purchases: [], name: p.name, category: p.category, accountIds: new Set() });
      }
      const entry = byTicker.get(key)!;
      entry.purchases.push(p);
      entry.accountIds.add(acct.id);
      // Use the most recent lot's name/category
      if (new Date(p.purchaseDate) > new Date(entry.purchases[0].purchaseDate)) {
        entry.name = p.name;
        entry.category = p.category;
      }
    }
  }

  return Array.from(byTicker.entries()).map(([ticker, { purchases, name, category, accountIds }]) => {
    const totalShares = purchases.reduce((s, p) => s + p.shares, 0);
    const totalCostBasis = purchases.reduce((s, p) => s + Math.round(p.shares * p.pricePerShare), 0);
    const avgCostPerShare = totalShares > 0 ? totalCostBasis / totalShares : 0;
    const currentPrice = livePrices[ticker] ?? 0;
    const currentValue = Math.round(totalShares * currentPrice);
    const gainLoss = currentValue - totalCostBasis;
    const growthPct = totalCostBasis > 0 ? gainLoss / totalCostBasis : 0;

    return {
      ticker,
      name,
      category,
      lots: purchases.sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()),
      totalShares,
      totalCostBasis,
      avgCostPerShare,
      currentPrice,
      currentValue,
      gainLoss,
      growthPct,
      accountIds: Array.from(accountIds),
    };
  });
}

// ─── Category color map ───────────────────────────────────────────────────────

export function buildCategoryColorMap(cats: InvestmentCategory[]): Record<string, { bg: string; fg: string }> {
  const map: Record<string, { bg: string; fg: string }> = {};
  for (const c of cats) map[c.name] = { bg: c.color + '22', fg: c.color };
  return map;
}

export function categoryColorFromMap(map: Record<string, { bg: string; fg: string }>, cat: string): { bg: string; fg: string } {
  return map[cat] ?? { bg: colors.bg, fg: semanticColors.neutralText };
}

const BADGE_PALETTE = [
  { bg: colors.primaryLight, fg: semanticColors.primaryTextDark },
  { bg: colors.successLight, fg: semanticColors.successTextDark },
  { bg: colors.warningLight, fg: semanticColors.amberText },
  { bg: semanticColors.pinkBg, fg: semanticColors.pinkTextDark },
  { bg: semanticColors.purpleLight, fg: semanticColors.purpleTextDark },
  { bg: semanticColors.tealLight, fg: semanticColors.tealText },
  { bg: semanticColors.amberBg, fg: semanticColors.orangeTextDark },
];
export function acctBadge(i: number) { return BADGE_PALETTE[i % BADGE_PALETTE.length]; }

// ─── Format helpers ───────────────────────────────────────────────────────────

export function fmtGain(v: number) { return (v >= 0 ? '+' : '') + formatDollars(v); }
export function fmtPct(v: number) { return (v >= 0 ? '+' : '') + (v * 100).toFixed(2) + '%'; }
export function portPct(val: number, total: number) {
  if (total === 0) return '—';
  return ((val / total) * 100).toFixed(1) + '%';
}
