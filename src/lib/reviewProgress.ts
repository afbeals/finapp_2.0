import type { ReviewStep } from '@/lib/store';

export const MONTHLY_STEP_ORDER = ['expense', 'monthly', 'savings', 'loans', 'investments', 'vaults', 'finalize'] as const;
export const QUARTERLY_STEP_ORDER = ['expense', 'monthly', 'savings', 'loans', 'investments', 'portfolio', 'vaults', 'finalize'] as const;

export interface ReviewProgress {
  stepNum: number;
  total: number;
  complete: number;
  pct: number;
}

export function reviewProgress(
  steps: ReviewStep[],
  currentStep: string,
  orderedKeys?: string[],
): ReviewProgress {
  // Use canonical key order when provided so DB insertion order doesn't corrupt step numbering
  const ordered = orderedKeys
    ? orderedKeys.map((k) => steps.find((s) => s.stepKey === k)).filter(Boolean) as ReviewStep[]
    : steps;
  const idx = ordered.findIndex((s) => s.stepKey === currentStep);
  const stepNum = idx >= 0 ? idx + 1 : 1;
  const total = ordered.length;
  const complete = ordered.filter((s) => s.status === 'COMPLETE').length;
  const pct = total ? Math.round((complete / total) * 100) : 0;
  return { stepNum, total, complete, pct };
}
