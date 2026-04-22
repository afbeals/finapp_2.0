'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styled from 'styled-components';
import { colors, font, radius, spacing, semanticColors } from '@/styles/tokens';
import { MONTH_NAMES_SHORT } from '@/lib/fire';
import { useReviewStore } from '@/lib/store';
import { SkipStepModal } from '@/components/modals/SkipStepModal';
import { useStepNav } from '@/lib/useStepNav';

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

// ─── Wrapper ─────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  background: ${colors.surface};
  border-bottom: 1px solid ${colors.border};
  padding: ${spacing[4]} ${spacing[6]};
`;

const Inner = styled.div`
  max-width: 960px;
  margin: 0 auto;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${spacing[3]};
  margin-bottom: ${spacing[3]};
`;

const ProgressTitle = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
`;

const ProgressCounter = styled.span`
  font-size: ${font.size.xs};
  color: ${colors.textMuted};
`;

const ContentRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${spacing[4]};
`;

// ─── Steps ────────────────────────────────────────────────────────────────────

const StepsArea = styled.div`
  flex: 1;
  display: flex;
  align-items: flex-start;
  min-width: 0;
`;

const BADGE_H = 20;
const CIRCLE_SIZE = 36;

const StepCol = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  width: 56px;
`;

const BadgeArea = styled.div`
  height: ${BADGE_H}px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  margin-bottom: 4px;
`;

const QuarterlyBadge = styled.div`
  background: ${colors.warning};
  color: ${colors.surface};
  font-size: 8px;
  font-weight: ${font.weight.bold};
  letter-spacing: 0.04em;
  padding: 2px 5px;
  border-radius: 3px;
`;

type CircleStatus = 'current' | 'complete' | 'skipped' | 'pending' | 'quarterly';

const Circle = styled.button.withConfig({
  shouldForwardProp: (prop) => !['status', 'clickable'].includes(prop),
})<{ status: CircleStatus; clickable: boolean }>`
  width: ${CIRCLE_SIZE}px;
  height: ${CIRCLE_SIZE}px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  cursor: ${({ clickable }) => clickable ? 'pointer' : 'default'};
  transition: opacity 120ms ease;
  flex-shrink: 0;

  background: ${({ status }) =>
    status === 'current' ? colors.primary :
    status === 'complete' ? colors.success :
    status === 'skipped' ? colors.textDisabled :
    status === 'quarterly' ? semanticColors.warningBg :
    colors.surface};

  border: 2px solid ${({ status }) =>
    status === 'current' ? colors.primary :
    status === 'complete' ? colors.success :
    status === 'skipped' ? colors.textDisabled :
    status === 'quarterly' ? colors.warning :
    colors.borderStrong};

  color: ${({ status }) =>
    status === 'current' ? colors.surface :
    status === 'complete' ? colors.surface :
    status === 'skipped' ? colors.surface :
    status === 'quarterly' ? colors.warning :
    colors.textMuted};

  &:hover {
    opacity: ${({ clickable }) => clickable ? 0.85 : 1};
  }
`;

const StepLabel = styled.div`
  margin-top: 6px;
  text-align: center;
`;

const LabelLine = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'muted',
})<{ muted?: boolean }>`
  display: block;
  font-size: 10px;
  font-weight: ${({ muted }) => muted ? font.weight.normal : font.weight.medium};
  color: ${({ muted }) => muted ? colors.textMuted : colors.textSecondary};
  line-height: 1.3;
`;

// ─── Connectors ──────────────────────────────────────────────────────────────

const ConnectorWrapper = styled.div`
  flex: 1;
  min-width: 8px;
  padding-top: ${BADGE_H + 4 + CIRCLE_SIZE / 2 - 1}px;
  align-self: flex-start;
`;

const ConnectorLine = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'dashed',
})<{ dashed: boolean }>`
  height: 2px;
  width: 100%;
  background: ${({ dashed }) => dashed
    ? `repeating-linear-gradient(to right, ${colors.border} 0, ${colors.border} 4px, transparent 4px, transparent 8px)`
    : colors.border};
`;

// ─── Legend ───────────────────────────────────────────────────────────────────

const Legend = styled.div`
  flex-shrink: 0;
  background: ${semanticColors.surfaceMuted};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 140px;
`;

const LegendTitle = styled.p`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  color: ${colors.textMuted};
  margin-bottom: 2px;
`;

const LegendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const LegendDot = styled.div.withConfig({
  shouldForwardProp: (prop) => !['fill', 'stroke'].includes(prop),
})<{ fill: string; stroke?: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ fill }) => fill};
  border: 1.5px solid ${({ stroke, fill }) => stroke ?? fill};
  flex-shrink: 0;
`;

const LegendLabel = styled.span`
  font-size: 10px;
  color: ${colors.textMuted};
`;

const LegendSkipBtn = styled.button`
  flex-shrink: 0;
  align-self: center;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${colors.danger};
  background: ${colors.surface};
  border: 1px solid ${colors.danger};
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  white-space: nowrap;
  &:hover { background: ${colors.dangerLight}; }
`;

// ─── Component ────────────────────────────────────────────────────────────────

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
