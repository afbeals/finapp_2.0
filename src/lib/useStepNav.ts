'use client';

import { useCallback, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useReviewStore } from '@/lib/store';
import { MONTHLY_STEP_ORDER, QUARTERLY_STEP_ORDER } from '@/lib/reviewProgress';

const MONTHLY_ORDER: string[] = [...MONTHLY_STEP_ORDER];
const QUARTERLY_ORDER: string[] = [...QUARTERLY_STEP_ORDER];

export function useStepNav(currentKey: string) {
  const router = useRouter();
  const params = useParams();
  const reviewId = params.id as string;
  const { state, actions } = useReviewStore();
  const [saving, setSaving] = useState(false);

  const steps = state.activeReview?.type === 'QUARTERLY' ? QUARTERLY_ORDER : MONTHLY_ORDER;
  const currentIndex = steps.indexOf(currentKey);
  const nextKey = steps[currentIndex + 1] ?? null;
  const prevKey = steps[currentIndex - 1] ?? null;
  const isLast = currentKey === 'finalize';

  const markStep = useCallback(
    async (status: 'COMPLETE' | 'SKIPPED') => {
      if (!reviewId) return;
      await fetch(`/api/reviews/${reviewId}/steps/${currentKey}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      actions.updateStepStatus(currentKey, status);
    },
    [reviewId, currentKey, actions],
  );

  const goNext = useCallback(
    async () => {
      setSaving(true);
      await markStep('COMPLETE');
      if (nextKey) {
        actions.setCurrentStep(nextKey);
        await fetch(`/api/reviews/${reviewId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentStep: nextKey }),
        });
        router.push(`/review/${reviewId}/${nextKey}`);
      }
      setSaving(false);
    },
    [markStep, nextKey, reviewId, router, actions],
  );

  const goSkip = useCallback(
    async () => {
      setSaving(true);
      await markStep('SKIPPED');
      if (nextKey) {
        actions.setCurrentStep(nextKey);
        await fetch(`/api/reviews/${reviewId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentStep: nextKey }),
        });
        router.push(`/review/${reviewId}/${nextKey}`);
      }
      setSaving(false);
    },
    [markStep, nextKey, reviewId, router, actions],
  );

  const goBack = useCallback(async () => {
    if (prevKey) {
      actions.setCurrentStep(prevKey);
      await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStep: prevKey }),
      }).catch(() => null);
      router.push(`/review/${reviewId}/${prevKey}`);
    } else {
      router.push('/dashboard');
    }
  }, [prevKey, reviewId, router, actions]);

  return { nextKey, prevKey, isLast, saving, goNext, goSkip, goBack };
}
