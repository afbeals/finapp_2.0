'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { StepShell } from '@/components/review/StepShell';
import { useStepNav } from '@/lib/useStepNav';
import { useReviewStore } from '@/lib/store';
import { toCents, toDollars } from '@/lib/money';
import { getReviewLoans, patchLoanSnapshot, patchLoan as apiPatchLoan } from '@/lib/api';
import { colors } from '@/styles/tokens';
import { LoadingState } from '@/components/shared/LoadingState';
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
  const [amorLoan, setAmorLoan] = useState<Loan | null>(null);

  const [mortgageDrafts, setMortgageDrafts] = useState<Record<number, { paymentAmount: string; principalAmount: string }>>({});
  const [insuranceDrafts, setInsuranceDrafts] = useState<Record<number, { mortgageInsurance: string; otherFees: string }>>({});
  const [savingMortgage, setSavingMortgage] = useState<number | null>(null);
  const [savingInsurance, setSavingInsurance] = useState<number | null>(null);

  useEffect(() => {
    getReviewLoans(reviewId)
      .then(({ loans: ls, snapshots: snaps }) => {
        setLoans(ls ?? []);
        const map: Record<number, LoanSnapshot> = {};
        for (const s of snaps ?? []) map[s.loanId] = s;
        for (const l of ls ?? []) {
          if (!map[l.id]) map[l.id] = { loanId: l.id, balance: l.principal, paymentsMade: 0, interestPaid: 0, extraPayment: 0, paymentAmount: 0, principalAmount: 0 };
        }
        setSnapshots(map);
        const md: Record<number, { paymentAmount: string; principalAmount: string }> = {};
        const id2: Record<number, { mortgageInsurance: string; otherFees: string }> = {};
        for (const l of ls ?? []) {
          if (l.category === 'MORTGAGE') {
            const s = map[l.id];
            md[l.id] = {
              paymentAmount: s?.paymentAmount ? toDollars(s.paymentAmount).toFixed(2) : '',
              principalAmount: s?.principalAmount ? toDollars(s.principalAmount).toFixed(2) : '',
            };
            id2[l.id] = {
              mortgageInsurance: l.mortgageInsurance ? toDollars(l.mortgageInsurance).toFixed(2) : '',
              otherFees: l.otherFees ? toDollars(l.otherFees).toFixed(2) : '',
            };
          }
        }
        setMortgageDrafts(md);
        setInsuranceDrafts(id2);
      })
      .finally(() => setLoading(false));
  }, [reviewId]);

  const patchSnapshot = useCallback(async (loanId: number, fields: Partial<Omit<LoanSnapshot, 'loanId'>>) => {
    const { snapshot } = await patchLoanSnapshot(reviewId, loanId, fields);
    setSnapshots((prev) => ({ ...prev, [loanId]: { ...prev[loanId], ...snapshot } }));
  }, [reviewId]);

  const patchLoan = useCallback(async (loanId: number, fields: Partial<Pick<Loan, 'name' | 'rate' | 'paidOff' | 'mortgageInsurance' | 'otherFees'>>) => {
    const { loan } = await apiPatchLoan(loanId, fields);
    setLoans((prev) => prev.map((l) => l.id === loanId ? { ...l, ...loan } : l));
  }, []);

  const handleMortDraftChange = useCallback((loanId: number, field: 'paymentAmount' | 'principalAmount', value: string) => {
    setMortgageDrafts((p) => ({ ...p, [loanId]: { ...p[loanId], [field]: value } }));
  }, []);

  const handleInsDraftChange = useCallback((loanId: number, field: 'mortgageInsurance' | 'otherFees', value: string) => {
    setInsuranceDrafts((p) => ({ ...p, [loanId]: { ...p[loanId], [field]: value } }));
  }, []);

  const saveMortgagePayment = useCallback(async (loan: Loan) => {
    setSavingMortgage(loan.id);
    const draft = mortgageDrafts[loan.id] ?? { paymentAmount: '', principalAmount: '' };
    const payAmt = toCents(parseFloat(draft.paymentAmount) || 0);
    const prinAmt = toCents(parseFloat(draft.principalAmount) || 0);
    const snap = snapshots[loan.id];
    const newPayments = (snap?.paymentsMade ?? 0) + (payAmt > 0 ? 1 : 0);
    await patchSnapshot(loan.id, { paymentAmount: payAmt, principalAmount: prinAmt, paymentsMade: newPayments });
    setSavingMortgage(null);
  }, [mortgageDrafts, snapshots, patchSnapshot]);

  const saveInsuranceSettings = useCallback(async (loan: Loan) => {
    setSavingInsurance(loan.id);
    const draft = insuranceDrafts[loan.id] ?? { mortgageInsurance: '', otherFees: '' };
    await patchLoan(loan.id, {
      mortgageInsurance: toCents(parseFloat(draft.mortgageInsurance) || 0),
      otherFees: toCents(parseFloat(draft.otherFees) || 0),
    });
    setSavingInsurance(null);
  }, [insuranceDrafts, patchLoan]);

  const schoolLoans = useMemo(() => loans.filter((l) => l.category === 'SCHOOL'), [loans]);
  const mortgageLoans = useMemo(() => loans.filter((l) => l.category === 'MORTGAGE'), [loans]);

  if (loading) return <LoadingState centered />;

  return (
    <StepShell
      title="💳 Loans & Credit"
      subtitle="Quarterly review of school loans and mortgage"
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
          mortDraft={mortgageDrafts[loan.id] ?? { paymentAmount: '', principalAmount: '' }}
          insDraft={insuranceDrafts[loan.id] ?? { mortgageInsurance: '', otherFees: '' }}
          readOnly={readOnly}
          savingMortgage={savingMortgage}
          savingInsurance={savingInsurance}
          onPatchSnapshot={patchSnapshot}
          onMortDraftChange={handleMortDraftChange}
          onInsDraftChange={handleInsDraftChange}
          onSaveMortgagePayment={saveMortgagePayment}
          onSaveInsuranceSettings={saveInsuranceSettings}
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
