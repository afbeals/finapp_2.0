import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStepNav } from '@/lib/useStepNav';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '42' }),
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
}));

const mockSetCurrentStep = vi.fn();
const mockUpdateStepStatus = vi.fn();

vi.mock('@/lib/store', () => ({
  useReviewStore: () => ({
    state: {
      activeReview: { id: 42, type: 'MONTHLY', status: 'IN_PROGRESS' },
      isEditMode: false,
    },
    actions: {
      setCurrentStep: mockSetCurrentStep,
      updateStepStatus: mockUpdateStepStatus,
    },
  }),
}));

// Use a permissive fetch mock; each test overrides as needed
const mockFetch = vi.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
);
global.fetch = mockFetch as unknown as typeof fetch;

beforeEach(() => {
  mockPush.mockClear();
  mockSetCurrentStep.mockClear();
  mockUpdateStepStatus.mockClear();
  mockFetch.mockClear();
});

describe('useStepNav', () => {
  describe('goNext (MONTHLY order: expense→monthly→savings→investments→vaults→finalize)', () => {
    it('marks current step COMPLETE and navigates to next step', async () => {
      const { result } = renderHook(() => useStepNav('expense'));
      await act(() => result.current.goNext());

      const calls = mockFetch.mock.calls as unknown as [string, RequestInit][];

      // Should PATCH the step status
      const stepCall = calls.find((c) => c[0].includes('/steps/expense'));
      expect(stepCall).toBeTruthy();
      const stepBody = JSON.parse(stepCall![1].body as string);
      expect(stepBody.status).toBe('COMPLETE');

      // Should PATCH the review currentStep
      const reviewCall = calls.find((c) => c[0].match(/\/api\/reviews\/42$/));
      expect(reviewCall).toBeTruthy();
      const reviewBody = JSON.parse(reviewCall![1].body as string);
      expect(reviewBody.currentStep).toBe('monthly');

      // Should navigate
      expect(mockPush).toHaveBeenCalledWith('/review/42/monthly');
    });

    it('calls setCurrentStep with the next step key', async () => {
      const { result } = renderHook(() => useStepNav('savings'));
      await act(() => result.current.goNext());
      expect(mockSetCurrentStep).toHaveBeenCalledWith('investments');
    });
  });

  describe('goSkip', () => {
    it('marks current step SKIPPED', async () => {
      const { result } = renderHook(() => useStepNav('monthly'));
      await act(() => result.current.goSkip());

      const calls = mockFetch.mock.calls as unknown as [string, RequestInit][];
      const stepCall = calls.find((c) => c[0].includes('/steps/monthly'));
      const body = JSON.parse(stepCall![1].body as string);
      expect(body.status).toBe('SKIPPED');
      expect(mockPush).toHaveBeenCalledWith('/review/42/savings');
    });
  });

  describe('goBack', () => {
    it('PATCHes currentStep with the previous step key', async () => {
      const { result } = renderHook(() => useStepNav('savings'));
      await act(() => result.current.goBack());

      const calls = mockFetch.mock.calls as unknown as [string, RequestInit][];
      const reviewCall = calls.find((c) => c[0].match(/\/api\/reviews\/42$/));
      expect(reviewCall).toBeTruthy();
      const body = JSON.parse(reviewCall![1].body as string);
      expect(body.currentStep).toBe('monthly');
      expect(mockPush).toHaveBeenCalledWith('/review/42/monthly');
    });

    it('navigates to /dashboard when on the first step', async () => {
      const { result } = renderHook(() => useStepNav('expense'));
      await act(() => result.current.goBack());
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('derived values', () => {
    it('isLast is true only for finalize step', () => {
      const { result: finalize } = renderHook(() => useStepNav('finalize'));
      expect(finalize.current.isLast).toBe(true);

      const { result: vaults } = renderHook(() => useStepNav('vaults'));
      expect(vaults.current.isLast).toBe(false);
    });

    it('prevKey is null for the first step', () => {
      const { result } = renderHook(() => useStepNav('expense'));
      expect(result.current.prevKey).toBeNull();
    });

    it('nextKey is null for the finalize step', () => {
      const { result } = renderHook(() => useStepNav('finalize'));
      expect(result.current.nextKey).toBeNull();
    });
  });
});
