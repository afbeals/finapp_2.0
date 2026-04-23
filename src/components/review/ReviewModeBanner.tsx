'use client';

import React from 'react';
import { Banner, Inner, Text } from './ReviewModeBanner.styles';
import { Button } from '@/components/ui/Button';
import { useReviewStore } from '@/lib/store';

export function ReviewModeBanner({ onEnableEdit }: { onEnableEdit: () => void }) {
  const { state } = useReviewStore();
  const { activeReview, isEditMode } = state;

  if (!activeReview || activeReview.status === 'IN_PROGRESS') return null;

  return (
    <Banner $editing={isEditMode}>
      <Inner>
        <Text>
          {isEditMode
            ? '✏️ You are editing a completed review. Changes are saved automatically.'
            : '👁️ Viewing completed review (read-only).'}
        </Text>
        {!isEditMode && (
          <Button size="sm" variant="secondary" onClick={onEnableEdit}>
            Enable Editing
          </Button>
        )}
      </Inner>
    </Banner>
  );
}
