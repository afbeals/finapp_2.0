'use client';

import React, { useState } from 'react';
import { formatDollarsWhole, toCents, toDollars, toNumber } from '@/lib/money';
import { fireNumber, yearsToFire } from '@/lib/fire';
import { theme } from '@/styles/tokens';

const { colors, semanticColors, font } = theme;
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  FireGrid, Divider, FireLeft, FireRight, ToggleGroup, ToggleBtn,
  FireInputGroup, FireLabel, FireInput, FireResultsTitle, FireTarget,
  FireTargetLabel, FireTargetValue, ProgressBox, ProgressBoxValue, ProgressBoxSub,
  YearsToFireBox, YearsIcon, YearsValue, YearsSub,
} from './FireWidget.styles';

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
