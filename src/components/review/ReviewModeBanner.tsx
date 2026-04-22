'use client';

import React from 'react';
import styled from 'styled-components';
import { colors, font, spacing, semanticColors } from '@/styles/tokens';
import { Button } from '@/components/ui/Button';
import { useReviewStore } from '@/lib/store';

const Banner = styled.div<{ $editing: boolean }>`
  background: ${({ $editing }) => $editing ? colors.warningLight : semanticColors.infoBg};
  border-bottom: 1px solid ${({ $editing }) => $editing ? semanticColors.warningBorderStrong : semanticColors.infoBorder};
  padding: 10px ${spacing[6]};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Inner = styled.div`
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Text = styled.span`
  font-size: ${font.size.sm};
  color: ${colors.textSecondary};
`;

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
