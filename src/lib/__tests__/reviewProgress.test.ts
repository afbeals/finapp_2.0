import { describe, it, expect } from 'vitest';
import {
  reviewProgress,
  MONTHLY_STEP_ORDER,
  QUARTERLY_STEP_ORDER,
} from '@/lib/reviewProgress';
import type { ReviewStep } from '@/lib/store';

function makeSteps(keys: string[], completeKeys: string[] = []): ReviewStep[] {
  return keys.map((k) => ({
    stepKey: k,
    status: completeKeys.includes(k) ? 'COMPLETE' : 'PENDING',
  } as ReviewStep));
}

describe('MONTHLY_STEP_ORDER', () => {
  it('has 6 entries', () => {
    expect(MONTHLY_STEP_ORDER).toHaveLength(6);
  });

  it('starts with expense', () => {
    expect(MONTHLY_STEP_ORDER[0]).toBe('expense');
  });

  it('ends with finalize', () => {
    expect(MONTHLY_STEP_ORDER[MONTHLY_STEP_ORDER.length - 1]).toBe('finalize');
  });

  it('does not include loans or portfolio', () => {
    expect(MONTHLY_STEP_ORDER).not.toContain('loans');
    expect(MONTHLY_STEP_ORDER).not.toContain('portfolio');
  });
});

describe('QUARTERLY_STEP_ORDER', () => {
  it('has 8 entries', () => {
    expect(QUARTERLY_STEP_ORDER).toHaveLength(8);
  });

  it('includes loans and portfolio', () => {
    expect(QUARTERLY_STEP_ORDER).toContain('loans');
    expect(QUARTERLY_STEP_ORDER).toContain('portfolio');
  });

  it('starts with expense', () => {
    expect(QUARTERLY_STEP_ORDER[0]).toBe('expense');
  });

  it('ends with finalize', () => {
    expect(QUARTERLY_STEP_ORDER[QUARTERLY_STEP_ORDER.length - 1]).toBe('finalize');
  });
});

describe('reviewProgress', () => {
  describe('without orderedKeys (insertion order)', () => {
    it('returns stepNum based on DB insertion order', () => {
      // Bug scenario: steps inserted out-of-canonical-order
      const steps = makeSteps(['finalize', 'expense', 'savings']);
      const result = reviewProgress(steps, 'savings');
      // 'savings' is at index 2 in insertion order → stepNum 3
      expect(result.stepNum).toBe(3);
    });

    it('returns total equal to number of steps', () => {
      const steps = makeSteps(['expense', 'savings', 'finalize']);
      expect(reviewProgress(steps, 'expense').total).toBe(3);
    });

    it('returns pct as 0 when no steps complete', () => {
      const steps = makeSteps(['expense', 'savings', 'finalize']);
      expect(reviewProgress(steps, 'expense').pct).toBe(0);
    });

    it('returns pct as 100 when all steps complete', () => {
      const steps = makeSteps(['expense', 'savings', 'finalize'], ['expense', 'savings', 'finalize']);
      expect(reviewProgress(steps, 'finalize').pct).toBe(100);
    });

    it('computes partial pct rounded', () => {
      // 2 of 3 complete = 66.7 → rounds to 67
      const steps = makeSteps(['expense', 'savings', 'finalize'], ['expense', 'savings']);
      expect(reviewProgress(steps, 'finalize').pct).toBe(67);
    });
  });

  describe('with orderedKeys (canonical order)', () => {
    it('corrects stepNum for out-of-order DB steps', () => {
      // Bug fix: DB insertion order is wrong, canonical order restores correct stepNum
      const steps = makeSteps(['finalize', 'expense', 'savings']);
      const result = reviewProgress(steps, 'savings', ['expense', 'savings', 'finalize']);
      expect(result.stepNum).toBe(2);
    });

    it('returns stepNum=1 for the first canonical step', () => {
      const steps = makeSteps(['savings', 'expense', 'finalize']);
      const result = reviewProgress(steps, 'expense', ['expense', 'savings', 'finalize']);
      expect(result.stepNum).toBe(1);
    });

    it('returns stepNum=3 for the last of 3 canonical steps', () => {
      const steps = makeSteps(['expense', 'savings', 'finalize']);
      const result = reviewProgress(steps, 'finalize', ['expense', 'savings', 'finalize']);
      expect(result.stepNum).toBe(3);
    });

    it('returns total based on canonical key count', () => {
      const steps = makeSteps(['finalize', 'expense', 'savings']);
      const result = reviewProgress(steps, 'expense', ['expense', 'savings', 'finalize']);
      expect(result.total).toBe(3);
    });

    it('returns stepNum=1 when currentStep is missing from orderedKeys (graceful fallback)', () => {
      const steps = makeSteps(['expense', 'savings', 'finalize']);
      const result = reviewProgress(steps, 'loans', ['expense', 'savings', 'finalize']);
      expect(result.stepNum).toBe(1);
    });

    it('computes pct correctly using only canonical steps', () => {
      const steps = makeSteps(
        ['finalize', 'expense', 'savings'],
        ['expense'],
      );
      const result = reviewProgress(steps, 'savings', ['expense', 'savings', 'finalize']);
      // 1 of 3 complete = 33%
      expect(result.pct).toBe(33);
    });
  });
});
