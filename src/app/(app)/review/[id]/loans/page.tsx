'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { StepShell } from '@/components/review/StepShell';
import { STEP_META } from '@/components/review/stepMetadata';
import { useStepNav } from '@/lib/useStepNav';
import { useReviewStore } from '@/lib/store';
import { toCents, toDollars } from '@/lib/money';
import { amortizationSchedule } from '@/lib/fire';
import { getReviewLoans, patchLoanSnapshot, patchLoan as apiPatchLoan } from '@/lib/api';
import { theme } from '@/styles/tokens';

const { colors } = theme;
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { AmortizationModal } from '@/components/shared/AmortizationModal';
import { SchoolLoansTable } from './SchoolLoansTable';
import { MortgageSection } from './MortgageSection';
import type { Loan, LoanSnapshot } from '@/types/entities';

export default function LoansPage() {
  const params = useParams();
  const reviewId = params.id as string;
  const { state: reviewState } = useReviewStore();
  const { goNext, goBack, goSkip, saving } = useStepNav('loans');
  const readOnly = reviewState.activeReview?.status === 'COMPLETE' && !reviewState.isEditMode;

  const [loans, setLoans] = useState<Loan[]>([]);
  const [snapshots, setSnapshots] = useState<Record<number, LoanSnapshot>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [amorLoan, setAmorLoan] = useState<Loan | null>(null);

  // Per-review: payment amount + optional extra principal per mortgage
  const [paymentDrafts, setPaymentDrafts] = useState<Record<number, string>>({});
  const [extraPaymentDrafts, setExtraPaymentDrafts] = useState<Record<number, string>>({});
  const [savingMortgage, setSavingMortgage] = useState<number | null>(null);

  useEffect(() => {
    getReviewLoans(reviewId)
      .then(({ loans: ls, snapshots: snaps }) => {
        setLoans(ls ?? []);
        const map: Record<number, LoanSnapshot> = {};
        for (const s of snaps ?? []) map[s.loanId] = s;
        for (const l of ls ?? []) {
          if (!map[l.id]) {
            map[l.id] = { loanId: l.id, balance: l.principal, paymentsMade: 0, interestPaid: 0, extraPayment: 0, paymentAmount: 0, principalAmount: 0 };
          }
        }
        setSnapshots(map);
        const drafts: Record<number, string> = {};
        for (const l of ls ?? []) {
          if (l.category === 'MORTGAGE') {
            const s = map[l.id];
            drafts[l.id] = s?.paymentAmount ? toDollars(s.paymentAmount).toFixed(2) : '';
          }
        }
        setPaymentDrafts(drafts);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [reviewId]);

  const patchSnapshot = useCallback(async (loanId: number, fields: Partial<Omit<LoanSnapshot, 'loanId'>>) => {
    const { snapshot } = await patchLoanSnapshot(reviewId, loanId, fields);
    setSnapshots((prev) => ({ ...prev, [loanId]: { ...prev[loanId], ...snapshot } }));
  }, [reviewId]);

  const patchLoan = useCallback(async (loanId: number, fields: Partial<Loan>) => {
    const { loan } = await apiPatchLoan(loanId, fields);
    setLoans((prev) => prev.map((l) => l.id === loanId ? { ...l, ...loan } : l));
  }, []);

  const handlePaymentDraftChange = useCallback((loanId: number, value: string) => {
    setPaymentDrafts((p) => ({ ...p, [loanId]: value }));
  }, []);

  const handleExtraPaymentDraftChange = useCallback((loanId: number, value: string) => {
    setExtraPaymentDrafts((p) => ({ ...p, [loanId]: value }));
  }, []);

  const saveMortgagePayment = useCallback(async (loan: Loan) => {
    setSavingMortgage(loan.id);
    const draft = paymentDrafts[loan.id] ?? '';
    const extraDraft = extraPaymentDrafts[loan.id] ?? '';
    const payAmt = toCents(parseFloat(draft) || 0);
    const extraAmt = toCents(parseFloat(extraDraft) || 0);
    const snap = snapshots[loan.id];
    // For old snapshots where balance was never persisted (balance=0 with payments>0),
    // derive from amortization schedule
    const snapBalance = snap?.balance ?? 0;
    const paymentsAlreadyMade = snap?.paymentsMade ?? 0;
    const currentBalance = snapBalance > 0
      ? snapBalance
      : paymentsAlreadyMade === 0
        ? loan.principal
        : (() => {
            const sched = amortizationSchedule(loan.principal, loan.rate, loan.termMonths, 0);
            return sched[Math.min(paymentsAlreadyMade, sched.length - 1)]?.balance ?? loan.principal;
          })();
    const newPayments = (snap?.paymentsMade ?? 0) + (payAmt > 0 ? 1 : 0);
    // Compute actual principal/interest split from the current balance
    const interestThisPeriod = Math.round(currentBalance * (loan.rate / 12));
    const principalThisPeriod = Math.max(0, payAmt + extraAmt - interestThisPeriod);
    const newBalance = Math.max(0, currentBalance - principalThisPeriod);
    await patchSnapshot(loan.id, {
      paymentAmount: payAmt,
      extraPayment: extraAmt,
      paymentsMade: newPayments,
      balance: newBalance,
      interestPaid: (snap?.interestPaid ?? 0) + interestThisPeriod,
      principalAmount: principalThisPeriod,
    });
    setSavingMortgage(null);
  }, [paymentDrafts, extraPaymentDrafts, snapshots, patchSnapshot]);

  const schoolLoans = useMemo(() => loans.filter((l) => l.category === 'SCHOOL'), [loans]);
  const mortgageLoans = useMemo(() => loans.filter((l) => l.category === 'MORTGAGE'), [loans]);

  if (loading) return <LoadingState centered />;
  if (loadError) return <ErrorState centered message="Couldn't load loans — please refresh." />;

  return (
    <StepShell
      title={STEP_META.loans.title}
      subtitle={STEP_META.loans.subtitle}
      stepName="Loans"
      onBack={goBack}
      onSkip={goSkip}
      onNext={goNext}
      saving={saving}
      readOnly={readOnly}
    >
      <SectionHeader title="🎓 School Loans" />
      <SchoolLoansTable
        loans={schoolLoans}
        snapshots={snapshots}
        readOnly={readOnly}
        onPatchSnapshot={patchSnapshot}
        onPatchLoan={patchLoan}
      />

      {mortgageLoans.map((loan) => (
        <MortgageSection
          key={loan.id}
          loan={loan}
          snap={snapshots[loan.id] ?? { loanId: loan.id, balance: loan.principal, paymentsMade: 0, interestPaid: 0, extraPayment: 0, paymentAmount: 0, principalAmount: 0 }}
          paymentDraft={paymentDrafts[loan.id] ?? ''}
          extraPaymentDraft={extraPaymentDrafts[loan.id] ?? ''}
          readOnly={readOnly}
          savingMortgage={savingMortgage}
          onPaymentDraftChange={handlePaymentDraftChange}
          onExtraPaymentDraftChange={handleExtraPaymentDraftChange}
          onSaveMortgagePayment={saveMortgagePayment}
          onSaveLoanField={patchLoan}
          onShowAmortization={setAmorLoan}
        />
      ))}

      {mortgageLoans.length === 0 && (
        <>
          <SectionHeader title="🏠 Mortgage" />
          <p style={{ color: colors.textDisabled, fontStyle: 'italic' }}>No mortgage configured.</p>
        </>
      )}

      <AmortizationModal
        isOpen={!!amorLoan}
        onClose={() => setAmorLoan(null)}
        loanName={amorLoan?.name ?? ''}
        principal={amorLoan?.principal ?? 0}
        rate={amorLoan?.rate ?? 0}
        termMonths={amorLoan?.termMonths ?? 0}
        startDate={amorLoan?.startDate ?? ''}
        paymentsMade={amorLoan ? (snapshots[amorLoan.id]?.paymentsMade ?? 0) : 0}
      />
    </StepShell>
  );
}
