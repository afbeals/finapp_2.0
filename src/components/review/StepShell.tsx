'use client';

import React from 'react';
import styled from 'styled-components';
import { colors, font, spacing } from '@/styles/tokens';
import { Button } from '@/components/ui/Button';

// ─── Sub-nav bar (sits flush below the stepper) ───────────────────────────────

const SubNav = styled.div`
  background: ${colors.surface};
  border-bottom: 1px solid ${colors.border};
  padding: 0 ${spacing[6]};
`;

const SubNavInner = styled.div`
  max-width: 960px;
  margin: 0 auto;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TitleBlock = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${spacing[3]};
`;

const StepTitle = styled.h1`
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
`;

const StepSubtitle = styled.p`
  font-size: ${font.size.sm};
  color: ${colors.textMuted};
`;

// ─── Page content area ────────────────────────────────────────────────────────

const Content = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: ${spacing[8]} ${spacing[6]};
`;

interface StepShellProps {
  title: string;
  subtitle?: string;
  stepName: string;
  children: React.ReactNode;
  onBack?: () => void;
  onSkip?: () => void;
  onNext: () => void;
  nextLabel?: string;
  saving?: boolean;
  readOnly?: boolean;
  extraActions?: React.ReactNode;
}

export function StepShell({
  title,
  subtitle,
  stepName: _stepName,
  children,
  onBack: _onBack,
  onSkip: _onSkip,
  onNext,
  nextLabel = 'Next Step →',
  saving = false,
  readOnly = false,
  extraActions,
}: StepShellProps) {
  return (
    <>
      <SubNav>
        <SubNavInner>
          <TitleBlock>
            <StepTitle>{title}</StepTitle>
            {subtitle && <StepSubtitle>{subtitle}</StepSubtitle>}
          </TitleBlock>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing[2] }}>
            {extraActions}
            {!readOnly && (
              <Button onClick={onNext} disabled={saving}>
                {saving ? 'Saving…' : nextLabel}
              </Button>
            )}
          </div>
        </SubNavInner>
      </SubNav>

      <Content>
        {children}
      </Content>
    </>
  );
}
