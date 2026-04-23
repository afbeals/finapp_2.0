'use client';

import React from 'react';
import { theme } from '@/styles/tokens';
import { SubNav, SubNavInner, TitleBlock, StepTitle, StepSubtitle, Content } from './StepShell.styles';
import { Button } from '@/components/ui/Button';

const { spacing } = theme;

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
