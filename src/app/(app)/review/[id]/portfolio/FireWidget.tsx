'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { formatDollarsWhole, toCents, toDollars, toNumber } from '@/lib/money';
import { fireNumber, yearsToFire } from '@/lib/fire';
import { colors, semanticColors, font, spacing, radius } from '@/styles/tokens';
import { ProgressBar } from '@/components/ui/ProgressBar';

// ─── FIRE Calculator styled components ───────────────────────────────────────

const FireGrid = styled.div`display: grid; grid-template-columns: 1fr 1px 1fr; gap: 0;`;
const Divider = styled.div`background: ${colors.border}; align-self: stretch;`;
const FireLeft = styled.div`padding: 0 18px 0 0;`;
const FireRight = styled.div`padding: 0 0 0 18px;`;

const ToggleGroup = styled.div`
  display: flex; background: ${colors.bg}; border-radius: ${radius.md}; padding: 3px; margin-bottom: 14px;
`;
const ToggleBtn = styled.button.withConfig({ shouldForwardProp: (p) => p !== 'active' })<{ active: boolean }>`
  flex: 1; padding: 6px; font-size: ${font.size.xs}; font-weight: ${font.weight.semibold};
  border: none; border-radius: ${radius.sm}; cursor: pointer; transition: all 120ms;
  background: ${({ active }) => active ? colors.surface : 'transparent'};
  color: ${({ active }) => active ? colors.textPrimary : colors.textMuted};
  box-shadow: ${({ active }) => active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'};
`;

const FireInputGroup = styled.div`margin-bottom: 12px;`;
const FireLabel = styled.label`display: block; font-size: ${font.size.xs}; font-weight: ${font.weight.semibold}; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;`;
const FireInput = styled.input`
  width: 100%; padding: 8px 10px; font-size: ${font.size.sm}; font-family: inherit;
  border: 1.5px solid ${colors.primary}; border-radius: ${radius.md};
  background: ${colors.surface}; color: ${colors.textPrimary}; outline: none;
  &:disabled { border-color: ${colors.border}; color: ${colors.textMuted}; background: ${colors.bg}; }
  &:focus { box-shadow: 0 0 0 3px ${colors.primaryLight}; }
`;

const FireResultsTitle = styled.p`font-size: ${font.size.xs}; font-weight: ${font.weight.bold}; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 14px;`;
const FireTarget = styled.div`margin-bottom: 12px;`;
const FireTargetLabel = styled.p`font-size: ${font.size.xs}; color: ${colors.textMuted}; margin-bottom: 2px;`;
const FireTargetValue = styled.p`font-size: ${font.size['2xl']}; font-weight: ${font.weight.bold}; color: ${colors.warning};`;

const ProgressBox = styled.div`
  background: ${semanticColors.successBg}; border: 1px solid ${colors.successLight}; border-radius: ${radius.md};
  padding: 10px 12px; margin-bottom: 12px;
`;
const ProgressBoxValue = styled.p`font-size: ${font.size.lg}; font-weight: ${font.weight.bold}; color: ${colors.textPrimary}; margin-bottom: 3px;`;
const ProgressBoxSub = styled.p`font-size: ${font.size.xs}; color: ${colors.success};`;

const YearsToFireBox = styled.div`
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border: 1px solid ${colors.border}; border-radius: ${radius.md};
`;
const YearsIcon = styled.span`font-size: 20px;`;
const YearsValue = styled.p`font-size: ${font.size['2xl']}; font-weight: ${font.weight.bold}; color: ${semanticColors.successTextDark};`;
const YearsSub = styled.p`font-size: ${font.size.xs}; color: ${semanticColors.successBright};`;

// ─── Props ────────────────────────────────────────────────────────────────────

interface FireWidgetProps {
  totalPortfolioValue: number;
  actualYearlyExpenses: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FireWidget({ totalPortfolioValue, actualYearlyExpenses }: FireWidgetProps) {
  const [useActual, setUseActual] = useState(false);
  const [estimatedExpenses, setEstimatedExpenses] = useState('75000');
  const [fireMonthlyContrib, setFireMonthlyContrib] = useState('3000');
  const [fireAnnualReturn, setFireAnnualReturn] = useState('7');

  const fireExpenses = useActual ? actualYearlyExpenses : toCents(toNumber(estimatedExpenses));
  const fireTarget = fireNumber(fireExpenses);
  const firePct = Math.min(100, (totalPortfolioValue / Math.max(1, fireTarget)) * 100);
  const ytf = totalPortfolioValue > 0 && fireTarget > 0
    ? yearsToFire(totalPortfolioValue, toCents(toNumber(fireMonthlyContrib)), toNumber(fireAnnualReturn) / 100, fireTarget)
    : Infinity;

  return (
    <FireGrid>
      <FireLeft>
        <ToggleGroup>
          <ToggleBtn active={useActual} onClick={() => setUseActual(true)}>Use Actual</ToggleBtn>
          <ToggleBtn active={!useActual} onClick={() => setUseActual(false)}>Use Estimated</ToggleBtn>
        </ToggleGroup>

        <FireInputGroup>
          <FireLabel style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Current Yearly Expenses (from Monthly)
            {useActual && <span style={{ background: colors.primaryLight, color: semanticColors.primaryText, fontSize: font.size.micro, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>ACTIVE</span>}
          </FireLabel>
          <FireInput
            disabled
            value={`$${toDollars(actualYearlyExpenses).toFixed(2)}`}
            style={{ opacity: useActual ? 1 : 0.5 }}
          />
        </FireInputGroup>

        <FireInputGroup>
          <FireLabel style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            Estimated Yearly Expense
            {!useActual && <span style={{ background: colors.primaryLight, color: semanticColors.primaryText, fontSize: font.size.micro, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>ACTIVE</span>}
          </FireLabel>
          <FireInput
            type="number"
            value={estimatedExpenses}
            onChange={(e) => setEstimatedExpenses(e.target.value)}
            placeholder="75000"
            style={{ opacity: useActual ? 0.5 : 1 }}
          />
        </FireInputGroup>

        <FireInputGroup>
          <FireLabel>Monthly Contribution ($)</FireLabel>
          <FireInput
            type="number"
            value={fireMonthlyContrib}
            onChange={(e) => setFireMonthlyContrib(e.target.value)}
            placeholder="3000"
          />
        </FireInputGroup>

        <FireInputGroup>
          <FireLabel>Expected Annual Return (%)</FireLabel>
          <FireInput
            type="number"
            step="0.1"
            value={fireAnnualReturn}
            onChange={(e) => setFireAnnualReturn(e.target.value)}
            placeholder="7"
          />
        </FireInputGroup>
      </FireLeft>

      <Divider />

      <FireRight>
        <FireResultsTitle>Results</FireResultsTitle>

        <FireTarget>
          <FireTargetLabel>FIRE Target (25× expenses)</FireTargetLabel>
          <FireTargetValue>{formatDollarsWhole(fireTarget)}</FireTargetValue>
        </FireTarget>

        <ProgressBox>
          <FireTargetLabel>Current Progress</FireTargetLabel>
          <ProgressBoxValue>{formatDollarsWhole(totalPortfolioValue)}</ProgressBoxValue>
          <ProgressBoxSub>{firePct.toFixed(1)}% complete</ProgressBoxSub>
          <div style={{ marginTop: 6 }}><ProgressBar value={firePct} color={colors.success} height={6} /></div>
        </ProgressBox>

        <YearsToFireBox>
          <YearsIcon>⏱️</YearsIcon>
          <div>
            <FireTargetLabel style={{ marginBottom: 2 }}>Estimated Years to FIRE</FireTargetLabel>
            {ytf === Infinity ? (
              <>
                <YearsValue style={{ color: colors.textMuted }}>&gt; 100 yrs</YearsValue>
                <YearsSub style={{ color: colors.textMuted }}>increase contribution or return rate</YearsSub>
              </>
            ) : (
              <>
                <YearsValue>{ytf.toFixed(1)} years</YearsValue>
                <YearsSub>at current rate</YearsSub>
              </>
            )}
          </div>
        </YearsToFireBox>
      </FireRight>
    </FireGrid>
  );
}
