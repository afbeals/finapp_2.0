'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StepIndicator } from '@/components/review/StepIndicator';
import { ReviewModeBanner } from '@/components/review/ReviewModeBanner';
import { EnableEditModal } from '@/components/modals/EnableEditModal';
import { useReviewStore } from '@/lib/store';
import { apiGet } from '@/lib/api';
import type { ActiveReview } from '@/lib/store';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const reviewId = params.id as string;
  const { state, actions } = useReviewStore();
  const [showEnableEdit, setShowEnableEdit] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (state.activeReview?.id === Number(reviewId)) {
      setLoaded(true);
      return;
    }

    apiGet<{ review: ActiveReview }>(`/api/reviews/${reviewId}`)
      .then((data) => {
        actions.setActiveReview(data.review);
        setLoaded(true);
      })
      .catch(() => router.replace('/dashboard'));
  }, [reviewId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) {
    return <LoadingState centered />;
  }

  return (
    <>
      <ReviewModeBanner onEnableEdit={() => setShowEnableEdit(true)} />
      <StepIndicator />
      <ErrorBoundary>{children}</ErrorBoundary>

      <EnableEditModal
        isOpen={showEnableEdit}
        onClose={() => setShowEnableEdit(false)}
        onConfirm={() => actions.setIsEditMode(true)}
      />
    </>
  );
}
