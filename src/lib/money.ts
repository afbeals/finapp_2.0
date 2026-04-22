/** Convert dollar amount to integer cents */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Convert cents to dollars (float) */
export function toDollars(cents: number): number {
  return cents / 100;
}

/** Format cents as "$1,234.56" */
export function formatDollars(cents: number, opts?: { compact?: boolean }): string {
  const dollars = cents / 100;

  if (opts?.compact && Math.abs(dollars) >= 1000) {
    if (Math.abs(dollars) >= 1_000_000) {
      return `$${(dollars / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(dollars) >= 1000) {
      return `$${(dollars / 1000).toFixed(1)}k`;
    }
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/** Format cents as "$1,234" (no cents) */
export function formatDollarsWhole(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/** Format as a percentage, e.g. 0.1234 → "12.3%" */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/** Format a rate like 0.0625 → "6.25%" */
export function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

/** Parse a dollar string like "$1,234.56" to cents */
export function parseDollarsToCents(input: string): number {
  const cleaned = input.replace(/[$,\s]/g, '');
  const dollars = parseFloat(cleaned);
  if (isNaN(dollars)) return 0;
  return Math.round(dollars * 100);
}
