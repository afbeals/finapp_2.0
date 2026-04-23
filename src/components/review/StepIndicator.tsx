'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { theme } from '@/styles/tokens';
import {
  Wrapper, Inner, TitleRow, ProgressTitle, ProgressCounter, ContentRow,
  StepsArea, StepCol, BadgeArea, QuarterlyBadge, Circle, StepLabel, LabelLine,
  ConnectorWrapper, ConnectorLine, Legend, LegendTitle, LegendRow, LegendDot,
  LegendLabel, LegendSkipBtn, type CircleStatus,
} from './StepIndicator.styles';
import { MONTH_NAMES_SHORT } from '@/lib/fire';
import { useReviewStore } from '@/lib/store';
import { SkipStepModal } from '@/components/modals/SkipStepModal';
import { useStepNav } from '@/lib/useStepNav';

const { colors, semanticColors } = theme;

const STEP_LINE1: Record<string, string> = {
  expense: 'Expense', monthly: 'Monthly', savings: 'Savings',
  loans: 'Loans', investments: 'Invest.', portfolio: 'Portfolio',
  vaults: 'Vaults', finalize: 'Finalize',
};

const STEP_LINE2: Record<string, string> = {
  expense: 'Entry', monthly: 'Review', savings: 'Accts',
  loans: '', investments: '', portfolio: '',
  vaults: '', finalize: '',
};

const QUARTERLY_KEYS = new Set(['loans', 'portfolio']);
const MONTHLY_STEPS = ['expense', 'monthly', 'savings', 'investments', 'vaults', 'finalize'];
const QUARTERLY_STEPS = ['expense', 'monthly', 'savings', 'loans', 'investments', 'portfolio', 'vaults', 'finalize'];

export function StepIndicator() {
  const router = useRouter();
  const params = useParams();
  const reviewId = params.id as string;
  const { state } = useReviewStore();
  const { activeReview, isEditMode } = state;
  const [showSkip, setShowSkip] = useState(false);
  const { goSkip } = useStepNav(activeReview?.currentStep ?? 'expense');

  if (!activeReview) return null;

  const steps = activeReview.type === 'QUARTERLY' ? QUARTERLY_STEPS : MONTHLY_STEPS;
  const stepObjects = steps.map((key) => {
    const found = activeReview.steps.find((s) => s.stepKey === key);
    return { key, status: found?.status ?? 'PENDING' };
  });

  const currentIndex = steps.indexOf(activeReview.currentStep);
  const doneCount = stepObjects.filter((s) => s.status !== 'PENDING').length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const stepNum = currentIndex >= 0 ? currentIndex + 1 : doneCount + 1;
  const periodLabel = `${MONTH_NAMES_SHORT[activeReview.periodMonth - 1]} ${activeReview.periodYear} ${activeReview.type === 'QUARTERLY' ? 'Quarterly' : 'Monthly'} Review Progress`;

  function handleClick(key: string, idx: number) {
    const step = stepObjects[idx];
    if (step.status === 'PENDING' && idx > currentIndex && !isEditMode) return;
    router.push(`/review/${reviewId}/${key}`);
  }

  return (
    <Wrapper>
      <Inner>
        <TitleRow>
          <ProgressTitle>{periodLabel}</ProgressTitle>
          <ProgressCounter>Step {stepNum} of {steps.length} · {pct}%</ProgressCounter>
        </TitleRow>

        <ContentRow>
          <StepsArea>
            {stepObjects.map((step, idx) => {
              const isCurrent = step.key === activeReview.currentStep;
              const isQuarterly = QUARTERLY_KEYS.has(step.key);
              const clickable = step.status !== 'PENDING' || idx <= currentIndex || isEditMode;

              const circleStatus: CircleStatus =
                isCurrent ? 'current' :
                step.status === 'COMPLETE' ? 'complete' :
                step.status === 'SKIPPED' ? 'skipped' :
                isQuarterly ? 'quarterly' :
                'pending';

              const isDashed = idx > 0 && (
                QUARTERLY_KEYS.has(steps[idx - 1]) || QUARTERLY_KEYS.has(steps[idx])
              );

              return (
                <React.Fragment key={step.key}>
                  {idx > 0 && (
                    <ConnectorWrapper>
                      <ConnectorLine dashed={isDashed} />
                    </ConnectorWrapper>
                  )}
                  <StepCol>
                    <BadgeArea>
                      {isQuarterly && <QuarterlyBadge>Q</QuarterlyBadge>}
                    </BadgeArea>
                    <Circle
                      status={circleStatus}
                      clickable={clickable}
                      onClick={() => handleClick(step.key, idx)}
                    >
                      {step.status === 'COMPLETE' ? '✓' : step.status === 'SKIPPED' ? '—' : idx + 1}
                    </Circle>
                    <StepLabel>
                      <LabelLine muted={!isCurrent}>{STEP_LINE1[step.key]}</LabelLine>
                      {STEP_LINE2[step.key] && (
                        <LabelLine muted>{STEP_LINE2[step.key]}</LabelLine>
                      )}
                    </StepLabel>
                  </StepCol>
                </React.Fragment>
              );
            })}
          </StepsArea>

          <Legend>
            <LegendTitle>Legend</LegendTitle>
            <LegendRow>
              <LegendDot fill={colors.primary} />
              <LegendLabel>Current</LegendLabel>
            </LegendRow>
            <LegendRow>
              <LegendDot fill={colors.success} />
              <LegendLabel>Complete</LegendLabel>
            </LegendRow>
            <LegendRow>
              <LegendDot fill={colors.surface} stroke={colors.borderStrong} />
              <LegendLabel>Pending</LegendLabel>
            </LegendRow>
            <LegendRow>
              <LegendDot fill={semanticColors.warningBg} stroke={colors.warning} />
              <LegendLabel>Quarterly</LegendLabel>
            </LegendRow>
          </Legend>

          {activeReview.status !== 'COMPLETE' && (
            <LegendSkipBtn onClick={() => setShowSkip(true)}>Skip Step →</LegendSkipBtn>
          )}
        </ContentRow>
      </Inner>

      <SkipStepModal
        isOpen={showSkip}
        stepName={activeReview.currentStep}
        onClose={() => setShowSkip(false)}
        onConfirm={goSkip}
      />
    </Wrapper>
  );
}
