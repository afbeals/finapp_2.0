'use client';

import React, { useState } from 'react';
import { formatDollars, toCents, toDollars } from '@/lib/money';
import {
  monthlyPayment,
  payoffDateStr,
  amortizationSchedule,
  projectedScheduleFrom,
  pmiDropMonth,
  MONTH_NAMES_SHORT,
} from '@/lib/fire';
import { KpiGrid, KpiCard } from '@/components/shared/KpiGrid';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { Button } from '@/components/ui/Button';
import { theme } from '@/styles/tokens';

const { colors, semanticColors, font, spacing } = theme;
import type { Loan, LoanSnapshot } from '@/types/entities';
import {
  ProgressWrap, ProgressLabel, ProgressTrack, ProgressFill,
  SplitBar, SplitSegment, SplitLegend, SplitDot, PiCardWrap,
  PaymentCard, PaymentCardTitle, PaymentRow, FieldGroup, FieldLabel, FieldInput,
  PmiCard, PmiTitle, GearBtn, ActionsRow, PaidOffBtn,
} from './MortgageSection.styles';
import { MortgageSettingsPanel } from './MortgageSettingsPanel';

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
  onDeleteLoan?: (loanId: number) => void;
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
  onDeleteLoan,
}: MortgageSectionProps) {
  const [showSettings, setShowSettings] = useState(false);
  // Applied extra principal: only updates when Submit is clicked, so the
  // amortization schedule doesn't recompute on every keystroke.
  const [extraPrincipalApplied, setExtraPrincipalApplied] = useState(snap.extraPayment);

  // ── Derived amortization math ──────────────────────────────────────────────
  // Use actual recorded balance when available. Fall back to schedule-derived when:
  // - no payments made yet, OR
  // - balance was never persisted (old snapshots have balance=0 with paymentsMade>0)
  const scheduleForBalance = amortizationSchedule(loan.principal, loan.rate, loan.termMonths, 0);
  const schedDerivedBalance = scheduleForBalance[Math.min(snap.paymentsMade, scheduleForBalance.length - 1)]?.balance ?? loan.principal;
  const observedBalance = snap.paymentsMade > 0 && snap.balance > 0 ? snap.balance : snap.paymentsMade === 0 ? loan.principal : schedDerivedBalance;
  const remMonths = Math.max(0, loan.termMonths - snap.paymentsMade);

  // Projection schedule: starts from the observed balance, not original principal
  const projSchedule = projectedScheduleFrom(observedBalance, loan.rate, remMonths, extraPrincipalApplied);
  const totalInterestLife = projSchedule.reduce((s, r) => s + r.interest, 0)
    + (snap.interestPaid ?? 0); // add already-paid interest for lifetime total

  // Last payment breakdown — derived from actual paid amounts + interest on pre-payment balance
  const lastPaymentBreakdown = snap.paymentsMade > 0 && snap.paymentAmount > 0
    ? (() => {
        // Pre-payment balance = current balance + principal paid this period
        const interestPortion = Math.round((observedBalance + snap.principalAmount) * (loan.rate / 12));
        const principalPortion = Math.max(0, snap.paymentAmount + snap.extraPayment - interestPortion);
        return {
          payment: snap.paymentAmount + snap.extraPayment,
          principal: principalPortion,
          interest: interestPortion,
        };
      })()
    : null;

  const basePmt = monthlyPayment(loan.principal, loan.rate, loan.termMonths);
  const pct = Math.min(100, ((loan.principal - observedBalance) / loan.principal) * 100);
  const payoffStr = payoffDateStr(loan.startDate, snap.paymentsMade, projSchedule.length);

  // ── Monthly totals ─────────────────────────────────────────────────────────
  const pmi = loan.mortgageInsurance ?? 0;
  const hasFeeBreakdown = (loan.propertyTax ?? 0) + (loan.hoa ?? 0) + (loan.homeownersInsurance ?? 0) > 0;
  const monthlyFees = hasFeeBreakdown
    ? (loan.propertyTax ?? 0) + (loan.hoa ?? 0) + (loan.homeownersInsurance ?? 0)
    : (loan.otherFees ?? 0);
  const totalMonthly = basePmt + pmi + monthlyFees;

  // ── LTV + PMI drop ─────────────────────────────────────────────────────────
  const homeValue = loan.homeValue ?? null;
  const ltv = homeValue && homeValue > 0 ? (observedBalance / homeValue) * 100 : null;
  const showPmiDrop = pmi > 0 && homeValue !== null;
  const pmiTarget = loan.pmiDropBalance ?? (homeValue ? Math.round(homeValue * 0.80) : null);
  const pmiDropPmt = pmiTarget !== null
    ? pmiDropMonth(loan.principal, loan.rate, loan.termMonths, pmiTarget)
    : -1;
  const pmiDropStr = pmiDropPmt > 0
    ? monthIndexToDate(loan.startDate, 0, pmiDropPmt)
    : 'Already eligible';
  const pmiToGo = pmiTarget !== null ? Math.max(0, observedBalance - pmiTarget) : 0;
  const pmiPct = pmiTarget !== null && homeValue !== null
    ? Math.min(100, ((homeValue - observedBalance) / (homeValue - pmiTarget)) * 100)
    : 0;

  return (
    <>
      <SectionHeader
        title={`🏠 Mortgage — ${loan.name}`}
        actions={
          <ActionsRow>
            {!readOnly && (
              <PaidOffBtn
                active={loan.paidOff}
                onClick={() => onSaveLoanField(loan.id, { paidOff: !loan.paidOff })}
              >
                {loan.paidOff ? '↩ Reopen' : '✓ Mark Paid Off'}
              </PaidOffBtn>
            )}
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
      {!readOnly && !loan.paidOff && (
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
              onClick={() => {
                setExtraPrincipalApplied(toCents(parseFloat(extraPaymentDraft) || 0));
                onSaveMortgagePayment(loan);
              }}
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
          onDelete={onDeleteLoan}
        />
      )}

      {/* ── Remaining Balance (full width) ── */}
      <KpiGrid cols={1} style={{ marginBottom: spacing[3] }}>
        <KpiCard
          label="Remaining Balance"
          tone="primary"
          largeValue
          value={formatDollars(observedBalance)}
          sub={`Payment #${snap.paymentsMade} of ${loan.termMonths}`}
        />
      </KpiGrid>

      {/* ── Last Payment P/I Split (full width) ── */}
      {lastPaymentBreakdown && (
        <PiCardWrap style={{ marginBottom: spacing[3] }}>
          <p style={{ fontSize: font.size.xs, fontWeight: font.weight.semibold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>
            Last Payment Breakdown
          </p>
          <p style={{ fontSize: font.size.sm, color: colors.textPrimary, marginBottom: 4 }}>
            <strong>{formatDollars(lastPaymentBreakdown.payment)}</strong> total &mdash;{' '}
            <span style={{ color: semanticColors.successText }}>{formatDollars(lastPaymentBreakdown.principal)} principal</span>
            {' · '}
            <span style={{ color: colors.danger }}>{formatDollars(lastPaymentBreakdown.interest)} interest</span>
          </p>
          <SplitBar>
            <SplitSegment
              pct={(lastPaymentBreakdown.principal / lastPaymentBreakdown.payment) * 100}
              bg={semanticColors.successTextMedium}
            />
            <SplitSegment
              pct={(lastPaymentBreakdown.interest / lastPaymentBreakdown.payment) * 100}
              bg={colors.danger}
            />
          </SplitBar>
          <SplitLegend>
            <SplitDot bg={semanticColors.successTextMedium}>
              Principal {((lastPaymentBreakdown.principal / lastPaymentBreakdown.payment) * 100).toFixed(1)}%
            </SplitDot>
            <SplitDot bg={colors.danger}>
              Interest {((lastPaymentBreakdown.interest / lastPaymentBreakdown.payment) * 100).toFixed(1)}%
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
