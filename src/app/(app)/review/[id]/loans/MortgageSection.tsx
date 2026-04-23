'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { formatDollars, toCents, toDollars } from '@/lib/money';
import {
  monthlyPayment,
  totalInterest,
  payoffDateStr,
  amortizationSchedule,
  pmiDropMonth,
  MONTH_NAMES_SHORT,
} from '@/lib/fire';
import { KpiGrid, KpiCard } from '@/components/shared/KpiGrid';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Button } from '@/components/ui/Button';
import { theme } from '@/styles/tokens';

const { colors, semanticColors, font, spacing, radius } = theme;
import type { Loan, LoanSnapshot } from '@/types/entities';
import { MortgageSettingsPanel } from './MortgageSettingsPanel';

// ─── Styled components ────────────────────────────────────────────────────────

const ProgressWrap = styled.div`margin-bottom: ${spacing[3]};`;
const ProgressLabel = styled.div`font-size: ${font.size.xs}; color: ${colors.textMuted}; margin-bottom: 6px;`;
const ProgressTrack = styled.div`height: 10px; background: ${colors.border}; border-radius: ${radius.full}; overflow: hidden;`;
const ProgressFill = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'pct' && p !== 'color' })<{ pct: number; color: string }>`
  height: 100%; width: ${({ pct }) => pct}%; background: ${({ color }) => color};
  border-radius: ${radius.full}; transition: width 400ms ease;
`;

// ── P/I Split bar (two-tone, no gaps) ─────────────────────────────────────
const SplitBar = styled.div`display: flex; height: 10px; border-radius: ${radius.full}; overflow: hidden; margin: 6px 0 4px;`;
const SplitSegment = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'pct' && p !== 'bg' })<{ pct: number; bg: string }>`
  width: ${({ pct }) => pct}%;
  background: ${({ bg }) => bg};
  transition: width 400ms ease;
`;
const SplitLegend = styled.div`display: flex; gap: 14px; font-size: ${font.size.xs}; color: ${colors.textMuted};`;
const SplitDot = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'bg' })<{ bg: string }>`
  display: inline-flex; align-items: center; gap: 4px;
  &::before { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 2px; background: ${({ bg }) => bg}; }
`;
const PiCardWrap = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: ${spacing[3]} ${spacing[4]};
`;

const PaymentCard = styled.div`
  background: ${colors.primaryLight};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: ${spacing[4]} ${spacing[5]};
  margin-bottom: ${spacing[4]};
`;

const PaymentCardTitle = styled.p`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${semanticColors.primaryTextDark};
  margin-bottom: ${spacing[3]};
`;

const PaymentRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${spacing[3]};
  flex-wrap: wrap;
`;

const FieldGroup = styled.div`display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 160px;`;
const FieldLabel = styled.label`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;
const FieldInput = styled.input`
  padding: 8px 12px;
  font-size: ${font.size.base};
  font-family: inherit;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface};
  color: ${colors.textPrimary};
  outline: none;
  &:focus { border-color: ${colors.primary}; box-shadow: 0 0 0 2px ${colors.primaryLight}; }
  &:disabled { opacity: 0.5; background: ${colors.bg}; }
`;

const PmiCard = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: ${spacing[3]} ${spacing[4]};
  margin-bottom: ${spacing[4]};
`;

const PmiTitle = styled.p`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${colors.textPrimary};
  margin-bottom: ${spacing[2]};
`;

const GearBtn = styled.button`
  background: none;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  padding: 4px 10px;
  font-size: 15px;
  cursor: pointer;
  color: ${colors.textMuted};
  &:hover { background: ${colors.bg}; color: ${colors.textPrimary}; }
`;

const ActionsRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[2]};
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monthIndexToDate(startDate: string, paymentsMade: number, offsetMonths: number): string {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + paymentsMade + offsetMonths);
  return `${MONTH_NAMES_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface MortgageSectionProps {
  loan: Loan;
  snap: LoanSnapshot;
  paymentDraft: string;
  extraPaymentDraft: string;
  readOnly: boolean;
  savingMortgage: number | null;
  onPaymentDraftChange: (loanId: number, value: string) => void;
  onExtraPaymentDraftChange: (loanId: number, value: string) => void;
  onSaveMortgagePayment: (loan: Loan) => void;
  onSaveLoanField: (loanId: number, fields: Partial<Loan>) => Promise<void>;
  onShowAmortization: (loan: Loan) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MortgageSection = React.memo(function MortgageSection({
  loan,
  snap,
  paymentDraft,
  extraPaymentDraft,
  readOnly,
  savingMortgage,
  onPaymentDraftChange,
  onExtraPaymentDraftChange,
  onSaveMortgagePayment,
  onSaveLoanField,
  onShowAmortization,
}: MortgageSectionProps) {
  const [showSettings, setShowSettings] = useState(false);

  const extraPrincipalCents = toCents(parseFloat(extraPaymentDraft) || 0);

  // ── Derived amortization math ──────────────────────────────────────────────
  const schedule = amortizationSchedule(loan.principal, loan.rate, loan.termMonths, extraPrincipalCents);
  const pmtIdx = Math.min(snap.paymentsMade, schedule.length) - 1; // last payment row (0-based)
  const currentRow = schedule[Math.min(snap.paymentsMade, schedule.length - 1)] ?? schedule[schedule.length - 1];
  const lastPaymentRow = pmtIdx >= 0 ? schedule[pmtIdx] : null;

  const derivedBalance = currentRow?.balance ?? loan.principal;
  const scheduledRemMonths = schedule.filter((_, i) => i >= snap.paymentsMade).length;
  const remMonths = Math.max(0, scheduledRemMonths);
  const basePmt = monthlyPayment(loan.principal, loan.rate, loan.termMonths);
  const totalInterestLife = schedule.reduce((s, r) => s + r.interest, 0);
  const pct = Math.min(100, ((loan.principal - derivedBalance) / loan.principal) * 100);
  const payoffStr = payoffDateStr(loan.startDate, snap.paymentsMade, remMonths);

  // ── Monthly totals ─────────────────────────────────────────────────────────
  const pmi = loan.mortgageInsurance ?? 0;
  const hasFeeBreakdown = (loan.propertyTax ?? 0) + (loan.hoa ?? 0) + (loan.homeownersInsurance ?? 0) > 0;
  const monthlyFees = hasFeeBreakdown
    ? (loan.propertyTax ?? 0) + (loan.hoa ?? 0) + (loan.homeownersInsurance ?? 0)
    : (loan.otherFees ?? 0);
  const totalMonthly = basePmt + pmi + monthlyFees;

  // ── LTV + PMI drop ─────────────────────────────────────────────────────────
  const homeValue = loan.homeValue ?? null;
  const ltv = homeValue && homeValue > 0 ? (derivedBalance / homeValue) * 100 : null;
  const showPmiDrop = pmi > 0 && homeValue !== null;
  const pmiTarget = loan.pmiDropBalance ?? (homeValue ? Math.round(homeValue * 0.80) : null);
  const pmiDropPmt = pmiTarget !== null
    ? pmiDropMonth(loan.principal, loan.rate, loan.termMonths, pmiTarget)
    : -1;
  const pmiDropStr = pmiDropPmt > 0
    ? monthIndexToDate(loan.startDate, 0, pmiDropPmt)
    : 'Already eligible';
  const pmiToGo = pmiTarget !== null ? Math.max(0, derivedBalance - pmiTarget) : 0;
  const pmiPct = pmiTarget !== null && homeValue !== null
    ? Math.min(100, ((homeValue - derivedBalance) / (homeValue - pmiTarget)) * 100)
    : 0;

  return (
    <>
      <SectionHeader
        title={`🏠 Mortgage — ${loan.name}`}
        actions={
          <ActionsRow>
            <GearBtn
              onClick={() => setShowSettings((v) => !v)}
              title="Loan settings"
            >
              ⚙️
            </GearBtn>
          </ActionsRow>
        }
      />

      {/* ── Record Payment ── */}
      {!readOnly && (
        <PaymentCard>
          <PaymentCardTitle>📅 Record This Month&apos;s Payment</PaymentCardTitle>
          <PaymentRow>
            <FieldGroup>
              <FieldLabel>Total Payment Made ($)</FieldLabel>
              <FieldInput
                type="number"
                step="0.01"
                placeholder={toDollars(totalMonthly).toFixed(2)}
                value={paymentDraft}
                onChange={(e) => onPaymentDraftChange(loan.id, e.target.value)}
              />
            </FieldGroup>
            <FieldGroup style={{ maxWidth: 180 }}>
              <FieldLabel>Extra Principal ($) <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>optional</span></FieldLabel>
              <FieldInput
                type="number"
                step="0.01"
                placeholder="0.00"
                value={extraPaymentDraft}
                onChange={(e) => onExtraPaymentDraftChange(loan.id, e.target.value)}
              />
            </FieldGroup>
            <Button
              onClick={() => onSaveMortgagePayment(loan)}
              disabled={!paymentDraft || savingMortgage === loan.id}
            >
              {savingMortgage === loan.id ? 'Saving…' : 'Submit Payment'}
            </Button>
          </PaymentRow>
        </PaymentCard>
      )}

      {/* ── Settings Panel (opens directly below payment input) ── */}
      {showSettings && (
        <MortgageSettingsPanel
          loan={loan}
          readOnly={readOnly}
          onSaveLoanField={onSaveLoanField}
        />
      )}

      {/* ── Remaining Balance (full width) ── */}
      <KpiGrid cols={1} style={{ marginBottom: spacing[3] }}>
        <KpiCard
          label="Remaining Balance"
          tone="primary"
          largeValue
          value={formatDollars(derivedBalance)}
          sub={`Payment #${snap.paymentsMade} of ${loan.termMonths}`}
        />
      </KpiGrid>

      {/* ── Last Payment P/I Split (full width) ── */}
      {lastPaymentRow && (
        <PiCardWrap style={{ marginBottom: spacing[3] }}>
          <p style={{ fontSize: font.size.xs, fontWeight: font.weight.semibold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
            Last Payment Breakdown
          </p>
          <p style={{ fontSize: font.size.sm, color: colors.textPrimary, marginBottom: 4 }}>
            <strong>{formatDollars(lastPaymentRow.payment)}</strong> total &mdash;{' '}
            <span style={{ color: semanticColors.successText }}>{formatDollars(lastPaymentRow.principal)} principal</span>
            {' · '}
            <span style={{ color: colors.danger }}>{formatDollars(lastPaymentRow.interest)} interest</span>
          </p>
          <SplitBar>
            <SplitSegment
              pct={(lastPaymentRow.principal / lastPaymentRow.payment) * 100}
              bg={semanticColors.successTextMedium}
            />
            <SplitSegment
              pct={(lastPaymentRow.interest / lastPaymentRow.payment) * 100}
              bg={colors.danger}
            />
          </SplitBar>
          <SplitLegend>
            <SplitDot bg={semanticColors.successTextMedium}>
              Principal {((lastPaymentRow.principal / lastPaymentRow.payment) * 100).toFixed(1)}%
            </SplitDot>
            <SplitDot bg={colors.danger}>
              Interest {((lastPaymentRow.interest / lastPaymentRow.payment) * 100).toFixed(1)}%
            </SplitDot>
          </SplitLegend>
        </PiCardWrap>
      )}

      {/* ── Remaining KPIs (4 across) ── */}
      <KpiGrid cols={4}>
        <KpiCard label="Payoff Date" value={payoffStr} />
        <KpiCard label="Total Monthly" value={formatDollars(totalMonthly)} sub="P&I + PMI + fees" />
        <KpiCard label="P&I Payment" value={formatDollars(basePmt)} />
        <KpiCard label="Total Interest (Life)" tone="danger" value={formatDollars(totalInterestLife)} />
        {ltv !== null && (
          <KpiCard label="LTV" value={`${ltv.toFixed(1)}%`} sub={ltv < 80 ? 'PMI eligible to drop' : ''} tone={ltv < 80 ? 'success' : undefined} />
        )}
      </KpiGrid>

      {/* ── Loan Progress Bar ── */}
      <ProgressWrap>
        <ProgressLabel>
          Loan Progress: {pct.toFixed(0)}% paid off · {snap.paymentsMade} of {loan.termMonths} payments
        </ProgressLabel>
        <ProgressTrack>
          <ProgressFill pct={pct} color={colors.primary} />
        </ProgressTrack>
      </ProgressWrap>

      {/* ── PMI Drop Progress ── */}
      {showPmiDrop && pmiTarget !== null && (
        <PmiCard>
          <PmiTitle>🏷️ PMI Removal Progress</PmiTitle>
          {pmiToGo > 0 ? (
            <>
              <p style={{ fontSize: font.size.sm, color: colors.textPrimary, marginBottom: spacing[2] }}>
                <strong>{formatDollars(pmiToGo)}</strong> away from dropping PMI · estimated{' '}
                <strong>{pmiDropStr}</strong>
              </p>
              <ProgressTrack>
                <ProgressFill pct={pmiPct} color={semanticColors.successTextMedium} />
              </ProgressTrack>
              <p style={{ fontSize: font.size.xs, color: colors.textMuted, marginTop: 6 }}>
                Target balance: {formatDollars(pmiTarget)} (LTV 80%)
              </p>
            </>
          ) : (
            <p style={{ fontSize: font.size.sm, color: semanticColors.successText, fontWeight: font.weight.semibold }}>
              ✅ Your balance is at or below the PMI drop threshold. Contact your lender to remove PMI.
            </p>
          )}
        </PmiCard>
      )}

      {/* ── Amortization Button ── */}
      <div style={{ marginBottom: spacing[4] }}>
        <Button variant="secondary" onClick={() => onShowAmortization(loan)}>
          📈 View Amortization Schedule
        </Button>
      </div>
    </>
  );
});
