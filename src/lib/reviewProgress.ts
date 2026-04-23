import type { ReviewStep } from '@/lib/store';

export interface ReviewProgress {
  stepNum: number;
  total: number;
  complete: number;
  pct: number;
}

export function reviewProgress(steps: ReviewStep[], currentStep: string): ReviewProgress {
  const idx = steps.findIndex((s) => s.stepKey === currentStep);
  const stepNum = idx >= 0 ? idx + 1 : 1;
  const total = steps.length;
  const complete = steps.filter((s) => s.status === 'COMPLETE').length;
  const pct = total ? Math.round((complete / total) * 100) : 0;
  return { stepNum, total, complete, pct };
}
