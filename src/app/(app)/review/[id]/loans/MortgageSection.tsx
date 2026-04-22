'use client';

import React from 'react';
import styled from 'styled-components';
import { formatDollars, toCents, toDollars } from '@/lib/money';
import { monthlyPayment, totalInterest, payoffDateStr } from '@/lib/fire';
import { InlineEdit } from '@/components/shared/InlineEdit';
import { KpiGrid, KpiCard } from '@/components/shared/KpiGrid';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { colors, semanticColors, font, spacing, radius } from '@/styles/tokens';
import type { Loan, LoanSnapshot } from '@/types/entities';


const ProgressWrap = styled.div`margin-bottom: ${spacing[4]};`;
const ProgressLabel = styled.div`font-size: ${font.size.xs}; color: ${colors.textMuted}; margin-bottom: 6px;`;
const ProgressTrack = styled.div`height: 10px; background: ${colors.border}; border-radius: ${radius.full}; overflow: hidden;`;
const ProgressFill = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'pct' })<{ pct: number }>`
  height: 100%; width: ${({ pct }) => pct}%; background: ${colors.primary};
  border-radius: ${radius.full}; transition: width 400ms ease;
`;

const PaymentCard = styled.div`
  background: ${colors.primaryLight}; border: 1px solid ${colors.border}; border-radius: ${radius.lg};
  padding: ${spacing[4]} ${spacing[5]}; margin-bottom: ${spacing[4]};
`;
const PaymentCardTitle = styled.p`
  font-size: ${font.size.sm}; font-weight: ${font.weight.bold}; color: ${semanticColors.primaryTextDark}; margin-bottom: 12px;
`;
const PaymentFields = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: ${spacing[3]};
`;
const FieldGroup = styled.div`display: flex; flex-direction: column; gap: 4px;`;
const FieldLabel = styled.label`
  font-size: ${font.size.xs}; font-weight: ${font.weight.semibold}; color: ${colors.textMuted};
  text-transform: uppercase; letter-spacing: 0.04em;
`;
const FieldInput = styled.input`
  padding: 7px 10px; font-size: ${font.size.sm}; font-family: inherit;
  border: 1px solid ${colors.border}; border-radius: ${radius.md};
  background: ${colors.surface}; color: ${colors.textPrimary}; outline: none;
  text-align: right;
  &:focus { border-color: ${colors.primary}; box-shadow: 0 0 0 2px ${colors.primaryLight}; }
  &:disabled { opacity: 0.5; background: ${colors.bg}; }
`;
const PaymentSaveBtn = styled.button`
  margin-top: 12px; padding: 8px 20px; background: ${colors.primary}; color: ${colors.surface};
  border: none; border-radius: ${radius.md}; font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold}; cursor: pointer;
  &:hover { background: ${colors.primaryHover}; }
  &:disabled { opacity: 0.5; cursor: default; }
`;
const InsuranceSettingsCard = styled.div`
  background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: ${radius.lg};
  padding: 14px 18px; margin-bottom: ${spacing[4]};
`;
const InsuranceSettingsTitle = styled.p`
  font-size: ${font.size.sm}; font-weight: ${font.weight.semibold}; color: ${colors.textPrimary}; margin-bottom: 10px;
`;
const InsuranceFields = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: ${spacing[3]};
`;
const CalcTotal = styled.div`
  margin-top: 10px; padding: 8px 12px; background: ${colors.surface};
  border: 1px solid ${colors.border}; border-radius: ${radius.md};
  font-size: ${font.size.sm}; color: ${colors.textPrimary};
  display: flex; justify-content: space-between; align-items: center;
`;

interface MortgageSectionProps {
  loan: Loan;
  snap: LoanSnapshot;
  mortDraft: { paymentAmount: string; principalAmount: string };
  insDraft: { mortgageInsurance: string; otherFees: string };
  readOnly: boolean;
  savingMortgage: number | null;
  savingInsurance: number | null;
  onPatchSnapshot: (loanId: number, fields: Partial<Omit<LoanSnapshot, 'loanId'>>) => Promise<void>;
  onMortDraftChange: (loanId: number, field: 'paymentAmount' | 'principalAmount', value: string) => void;
  onInsDraftChange: (loanId: number, field: 'mortgageInsurance' | 'otherFees', value: string) => void;
  onSaveMortgagePayment: (loan: Loan) => void;
  onSaveInsuranceSettings: (loan: Loan) => void;
  onShowAmortization: (loan: Loan) => void;
}

export const MortgageSection = React.memo(function MortgageSection({
  loan, snap, mortDraft, insDraft, readOnly,
  savingMortgage, savingInsurance,
  onPatchSnapshot, onMortDraftChange, onInsDraftChange,
  onSaveMortgagePayment, onSaveInsuranceSettings, onShowAmortization,
}: MortgageSectionProps) {
  const pct = Math.min(100, ((loan.principal - snap.balance) / loan.principal) * 100);
  const remMonths = Math.max(0, loan.termMonths - snap.paymentsMade);
  const basePmt = monthlyPayment(loan.principal, loan.rate, loan.termMonths);
  const principalPaid = loan.principal - snap.balance;
  const interestPaidEst = Math.max(0, snap.paymentsMade * basePmt - principalPaid);
  const totalInterestLife = totalInterest(loan.principal, loan.rate, loan.termMonths);
  const payoffStr = payoffDateStr(loan.startDate, snap.paymentsMade, remMonths);
  const ins = loan.mortgageInsurance ?? 0;
  const fees = loan.otherFees ?? 0;
  const totalMonthlyPmt = basePmt + ins + fees;

  return (
    <>
      <SectionHeader title={`🏠 Mortgage — ${loan.name}`} />

      <KpiGrid cols={4}>
        <KpiCard
          label="Remaining Balance"
          tone="primary"
          span2
          largeValue
          value={
            <InlineEdit
              value={toDollars(snap.balance).toFixed(2)}
              onSave={(v) => onPatchSnapshot(loan.id, { balance: toCents(parseFloat(v) || 0) })}
              color={colors.primary}
              readOnly={readOnly}
            />
          }
          sub={`Payment #${snap.paymentsMade} of ${loan.termMonths}`}
        />
        <KpiCard label="Original Loan" value={formatDollars(loan.principal)} />
        <KpiCard label="Interest Rate" tone="success" value={`${(loan.rate * 100).toFixed(3)}%`} />
        <KpiCard label="P&I Payment" value={formatDollars(basePmt)} />
        <KpiCard label="Total Monthly (w/ fees)" tone="success" value={formatDollars(totalMonthlyPmt)} sub="P&I + MI + Other" />
        <KpiCard label="Principal Paid" tone="primary" value={formatDollars(Math.max(0, principalPaid))} />
        <KpiCard label="Interest Paid (Est.)" tone="warning" value={formatDollars(interestPaidEst)} />
        <KpiCard label="Term Remaining" value={`${remMonths} months`} />
        <KpiCard label="Payoff Date" value={payoffStr} />
        <KpiCard label="Total Interest (Life)" tone="danger" value={formatDollars(totalInterestLife)} />
      </KpiGrid>

      <ProgressWrap>
        <ProgressLabel>
          Loan Progress: {pct.toFixed(0)}% Complete ({snap.paymentsMade} of {loan.termMonths} payments)
        </ProgressLabel>
        <ProgressTrack><ProgressFill pct={pct} /></ProgressTrack>
      </ProgressWrap>

      {!readOnly && (
        <InsuranceSettingsCard>
          <InsuranceSettingsTitle>Monthly Fee Settings</InsuranceSettingsTitle>
          <InsuranceFields>
            <FieldGroup>
              <FieldLabel>Mortgage Insurance (PMI/MIP)</FieldLabel>
              <FieldInput
                type="number" step="0.01" placeholder="0.00"
                value={insDraft.mortgageInsurance}
                onChange={(e) => onInsDraftChange(loan.id, 'mortgageInsurance', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Other Fees (HOA, Taxes Escrow, etc.)</FieldLabel>
              <FieldInput
                type="number" step="0.01" placeholder="0.00"
                value={insDraft.otherFees}
                onChange={(e) => onInsDraftChange(loan.id, 'otherFees', e.target.value)}
              />
            </FieldGroup>
          </InsuranceFields>
          <CalcTotal>
            <span style={{ color: colors.textMuted }}>Auto-calculated total</span>
            <span style={{ fontWeight: font.weight.bold }}>
              {formatDollars(basePmt)} P&amp;I
              {' + '}{formatDollars(toCents(parseFloat(insDraft.mortgageInsurance) || 0))} MI
              {' + '}{formatDollars(toCents(parseFloat(insDraft.otherFees) || 0))} other
              {' = '}<span style={{ color: colors.success }}>
                {formatDollars(basePmt + toCents(parseFloat(insDraft.mortgageInsurance) || 0) + toCents(parseFloat(insDraft.otherFees) || 0))}
              </span>/mo
            </span>
          </CalcTotal>
          <button
            onClick={() => onSaveInsuranceSettings(loan)}
            disabled={savingInsurance === loan.id}
            style={{
              marginTop: 10, padding: '6px 16px', background: colors.surface,
              border: `1px solid ${colors.border}`, borderRadius: radius.md,
              fontSize: font.size.sm, cursor: 'pointer', color: colors.textPrimary,
            }}
          >
            {savingInsurance === loan.id ? 'Saving…' : 'Save Fee Settings'}
          </button>
        </InsuranceSettingsCard>
      )}

      {!readOnly && (
        <PaymentCard>
          <PaymentCardTitle>📅 Record This Month's Payment</PaymentCardTitle>
          <PaymentFields>
            <FieldGroup>
              <FieldLabel>Total Payment Made</FieldLabel>
              <FieldInput
                type="number" step="0.01"
                placeholder={`${toDollars(totalMonthlyPmt).toFixed(2)}`}
                value={mortDraft.paymentAmount}
                onChange={(e) => onMortDraftChange(loan.id, 'paymentAmount', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Principal Portion (optional)</FieldLabel>
              <FieldInput
                type="number" step="0.01" placeholder="Auto-calculated if blank"
                value={mortDraft.principalAmount}
                onChange={(e) => onMortDraftChange(loan.id, 'principalAmount', e.target.value)}
              />
            </FieldGroup>
          </PaymentFields>
          <PaymentSaveBtn
            onClick={() => onSaveMortgagePayment(loan)}
            disabled={!mortDraft.paymentAmount || savingMortgage === loan.id}
          >
            {savingMortgage === loan.id ? 'Saving…' : '+ Record Payment (adds 1 to payment count)'}
          </PaymentSaveBtn>
        </PaymentCard>
      )}

      <div style={{ marginBottom: spacing[4] }}>
        <button
          onClick={() => onShowAmortization(loan)}
          style={{
            padding: '8px 16px', background: colors.primary, color: colors.surface,
            border: 'none', borderRadius: radius.md, cursor: 'pointer',
            fontSize: font.size.sm, fontWeight: font.weight.semibold,
          }}
        >
          📈 View Amortization Schedule
        </button>
      </div>
    </>
  );
});
