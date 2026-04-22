'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import styled from 'styled-components';
import { StepShell } from '@/components/review/StepShell';
import { useStepNav } from '@/lib/useStepNav';
import { useReviewStore } from '@/lib/store';
import { formatDollars, toCents, toDollars } from '@/lib/money';
import { amortizationSchedule, monthlyPayment, totalInterest } from '@/lib/fire';
import { colors, font, spacing, radius } from '@/styles/tokens';

interface Loan {
  id: number; name: string; category: string;
  principal: number; rate: number; termMonths: number; startDate: string;
  paidOff: boolean; mortgageInsurance: number; otherFees: number;
}
interface LoanSnapshot {
  loanId: number; balance: number; paymentsMade: number; interestPaid: number;
  extraPayment: number; paymentAmount: number; principalAmount: number;
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Section header ───────────────────────────────────────────────────────────

const SectionHeader = styled.div`
  display: flex; align-items: center; gap: ${spacing[3]};
  margin: ${spacing[6]} 0 ${spacing[3]};
`;
const SectionTitle = styled.h2`
  font-size: ${font.size.lg}; font-weight: ${font.weight.bold};
  color: ${colors.textPrimary}; white-space: nowrap;
`;
const SectionLine = styled.div`flex: 1; height: 1px; background: ${colors.border};`;

// ─── Horizontally-scrollable table ────────────────────────────────────────────

const TableScroll = styled.div`
  overflow-x: auto;
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  margin-bottom: ${spacing[5]};
  scrollbar-width: thin;
  scrollbar-color: ${colors.border} transparent;
  &::-webkit-scrollbar { height: 6px; }
  &::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 3px; }
`;
const Table = styled.table`width: max-content; min-width: 100%; border-collapse: collapse;`;
const Thead = styled.thead`background: #F1F5F9; position: sticky; top: 0; z-index: 1;`;
const Th = styled.th.withConfig({ shouldForwardProp: (p) => p !== 'w' })<{ w?: number }>`
  padding: 8px 12px;
  font-size: ${font.size.xs}; font-weight: ${font.weight.semibold};
  color: ${colors.textMuted}; text-align: right;
  border-bottom: 1px solid ${colors.border}; white-space: nowrap;
  ${({ w }) => w ? `width: ${w}px; min-width: ${w}px;` : ''}
  &:first-child { text-align: left; position: sticky; left: 0; background: #F1F5F9; z-index: 2; }
`;
const Tr = styled.tr.withConfig({
  shouldForwardProp: (p) => !['highlight', 'isTotal', 'paidOff'].includes(p),
})<{ highlight?: boolean; isTotal?: boolean; paidOff?: boolean }>`
  background: ${({ isTotal, highlight, paidOff }) =>
    isTotal ? '#EDE9FE' : paidOff ? '#F8FAFC' : highlight ? '#FEF2F2' : colors.surface};
  opacity: ${({ paidOff }) => paidOff ? 0.55 : 1};
  border-left: ${({ highlight }) => highlight ? '3px solid #EF4444' : '3px solid transparent'};
  &:not(:last-child) td { border-bottom: 1px solid ${colors.border}; }
  &:nth-child(even) { background: ${({ isTotal, highlight, paidOff }) =>
    isTotal ? '#EDE9FE' : paidOff ? '#F8FAFC' : highlight ? '#FEF2F2' : '#F8FAFC'}; }
`;
const Td = styled.td`
  padding: 10px 12px; font-size: ${font.size.sm};
  color: ${colors.textPrimary}; text-align: right; white-space: nowrap; vertical-align: middle;
  &:first-child { text-align: left; position: sticky; left: 0; background: inherit; z-index: 1; }
`;

// ─── Badges ───────────────────────────────────────────────────────────────────

const DateBadge = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'variant' })<{ variant?: 'blue' | 'green' }>`
  display: inline-block; font-size: 10px; font-weight: ${font.weight.semibold};
  padding: 2px 7px; border-radius: ${radius.full};
  background: ${({ variant }) => variant === 'green' ? '#DCFCE7' : '#DBEAFE'};
  color: ${({ variant }) => variant === 'green' ? '#166534' : '#1D4ED8'};
`;
const HighBadge = styled.span`
  display: inline-block; font-size: 10px; font-weight: ${font.weight.semibold};
  padding: 2px 6px; border-radius: ${radius.full};
  background: #FEE2E2; color: #991B1B; margin-left: 6px;
`;
const PaidBadge = styled.span`
  display: inline-block; font-size: 10px; font-weight: ${font.weight.semibold};
  padding: 2px 6px; border-radius: ${radius.full};
  background: #F1F5F9; color: ${colors.textMuted}; margin-left: 6px;
`;
const PaidOffBtn = styled.button.withConfig({ shouldForwardProp: (p) => p !== 'active' })<{ active: boolean }>`
  font-size: 10px; font-weight: ${font.weight.semibold};
  padding: 2px 8px; border-radius: ${radius.full}; cursor: pointer;
  border: 1px solid ${({ active }) => active ? '#D1FAE5' : colors.border};
  background: ${({ active }) => active ? '#D1FAE5' : colors.surface};
  color: ${({ active }) => active ? '#065F46' : colors.textMuted};
  margin-left: 6px;
  &:hover { opacity: 0.8; }
`;

// ─── Mortgage KPI grid ────────────────────────────────────────────────────────

const MortgageGrid = styled.div`
  display: grid; grid-template-columns: repeat(4, 1fr); gap: ${spacing[3]};
  margin-bottom: ${spacing[4]};
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
`;
const MortgageKpi = styled.div`
  background: ${colors.surface}; border: 1px solid ${colors.border};
  border-radius: ${radius.md}; padding: 12px 14px;
`;
const MkLabel = styled.p`
  font-size: ${font.size.xs}; font-weight: ${font.weight.semibold}; color: ${colors.textMuted};
  text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;
`;
const MkValue = styled.p.withConfig({ shouldForwardProp: (p) => p !== 'tc' })<{ tc?: string }>`
  font-size: ${font.size.xl}; font-weight: ${font.weight.bold};
  color: ${({ tc }) => tc ?? colors.textPrimary}; line-height: 1;
`;
const MkSub = styled.p`font-size: ${font.size.xs}; color: ${colors.textMuted}; margin-top: 3px;`;

// ─── Progress bar ─────────────────────────────────────────────────────────────

const ProgressWrap = styled.div`margin-bottom: ${spacing[4]};`;
const ProgressLabel = styled.div`font-size: ${font.size.xs}; color: ${colors.textMuted}; margin-bottom: 6px;`;
const ProgressTrack = styled.div`height: 10px; background: #E2E8F0; border-radius: ${radius.full}; overflow: hidden;`;
const ProgressFill = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'pct' })<{ pct: number }>`
  height: 100%; width: ${({ pct }) => pct}%; background: ${colors.primary};
  border-radius: ${radius.full}; transition: width 400ms ease;
`;

// ─── Mortgage payment entry ───────────────────────────────────────────────────

const PaymentCard = styled.div`
  background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: ${radius.lg};
  padding: 16px 20px; margin-bottom: ${spacing[4]};
`;
const PaymentCardTitle = styled.p`
  font-size: ${font.size.sm}; font-weight: ${font.weight.bold}; color: #1E40AF; margin-bottom: 12px;
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
  &:focus { border-color: ${colors.primary}; box-shadow: 0 0 0 2px #BFDBFE; }
  &:disabled { opacity: 0.5; background: ${colors.bg}; }
`;
const PaymentSaveBtn = styled.button`
  margin-top: 12px; padding: 8px 20px; background: ${colors.primary}; color: #fff;
  border: none; border-radius: ${radius.md}; font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold}; cursor: pointer;
  &:hover { background: #2563EB; }
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

// ─── Amortization modal ───────────────────────────────────────────────────────

const ModalOverlay = styled.div`
  position: fixed; inset: 0; background: rgba(15,23,42,0.45); z-index: 300;
  display: flex; align-items: center; justify-content: center; padding: ${spacing[4]};
`;
const ModalBox = styled.div`
  background: ${colors.surface}; border-radius: ${radius.xl};
  width: 900px; max-width: 95vw; height: 80vh;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 80px rgba(0,0,0,0.22);
`;
const ModalHeader = styled.div`
  padding: 18px 24px 14px; border-bottom: 1px solid ${colors.border};
  display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
`;
const ModalTitle = styled.h2`font-size: ${font.size.xl}; font-weight: ${font.weight.bold}; color: ${colors.textPrimary};`;
const ModalClose = styled.button`
  background: ${colors.bg}; border: 1px solid ${colors.border}; border-radius: ${radius.full};
  width: 32px; height: 32px; cursor: pointer; font-size: 16px; color: ${colors.textMuted};
  display: flex; align-items: center; justify-content: center;
  &:hover { background: ${colors.border}; }
`;
const ModalScrollBody = styled.div`overflow-y: auto; flex: 1;`;
const AmorTable = styled.table`width: 100%; border-collapse: collapse; font-size: ${font.size.xs};`;
const AmorTh = styled.th`
  padding: 7px 10px; text-align: right; font-weight: ${font.weight.semibold};
  color: ${colors.textMuted}; border-bottom: 1px solid ${colors.border};
  background: #F1F5F9; white-space: nowrap; position: sticky; top: 0; z-index: 1;
  &:first-child { text-align: center; }
`;
const AmorTr = styled.tr.withConfig({ shouldForwardProp: (p) => p !== 'isCurrent' })<{ isCurrent: boolean }>`
  background: ${({ isCurrent }) => isCurrent ? '#DBEAFE' : 'transparent'};
  font-weight: ${({ isCurrent }) => isCurrent ? font.weight.semibold : 'normal'};
  &:nth-child(even) { background: ${({ isCurrent }) => isCurrent ? '#DBEAFE' : '#F8FAFC'}; }
  &:last-child td { border-bottom: none; }
`;
const AmorTd = styled.td`
  padding: 7px 10px; text-align: right; border-bottom: 1px solid ${colors.border};
  font-variant-numeric: tabular-nums; white-space: nowrap;
  &:first-child { text-align: center; }
`;

// ─── Inline edit ──────────────────────────────────────────────────────────────

function InlineEdit({
  value, onSave, color, readOnly, isText, width,
}: { value: string; onSave: (v: string) => void; color?: string; readOnly?: boolean; isText?: boolean; width?: number }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) { setDraft(value); ref.current?.select(); } }, [editing, value]);

  if (readOnly) return <span style={{ color }}>{value}</span>;

  return editing ? (
    <input
      ref={ref}
      type={isText ? 'text' : 'number'}
      value={draft}
      step={isText ? undefined : '0.01'}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { setEditing(false); if (draft !== value) onSave(draft); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { setEditing(false); if (draft !== value) onSave(draft); }
        if (e.key === 'Escape') setEditing(false);
      }}
      style={{
        width: width ?? (isText ? 140 : 90), fontSize: font.size.sm, fontFamily: 'inherit',
        textAlign: isText ? 'left' : 'right',
        border: `1.5px solid ${colors.primary}`, borderRadius: 4, padding: '2px 6px',
        background: colors.surface, color: colors.textPrimary, outline: 'none',
      }}
    />
  ) : (
    <span
      onClick={() => setEditing(true)}
      style={{ cursor: 'text', color: color ?? colors.textPrimary, borderRadius: 4, padding: '2px 5px', display: 'inline-block' }}
      title="Click to edit"
    >
      {value}
      <span style={{ fontSize: 10, color: colors.textMuted, opacity: 0.5, marginLeft: 3 }}>✎</span>
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function payoffDateStr(startDate: string, paymentsMade: number, remMonths: number): string {
  const d = new Date(startDate);
  d.setMonth(d.getMonth() + paymentsMade + remMonths);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  // Mortgage payment entry local state (keyed by loanId)
  const [mortgageDrafts, setMortgageDrafts] = useState<Record<number, { paymentAmount: string; principalAmount: string }>>({});
  const [insuranceDrafts, setInsuranceDrafts] = useState<Record<number, { mortgageInsurance: string; otherFees: string }>>({});
  const [savingMortgage, setSavingMortgage] = useState<number | null>(null);
  const [savingInsurance, setSavingInsurance] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/reviews/${reviewId}/loans`)
      .then((r) => r.json())
      .then(({ loans: ls, snapshots: snaps }) => {
        setLoans(ls ?? []);
        const map: Record<number, LoanSnapshot> = {};
        for (const s of snaps ?? []) map[s.loanId] = s;
        for (const l of ls ?? []) {
          if (!map[l.id]) map[l.id] = { loanId: l.id, balance: l.principal, paymentsMade: 0, interestPaid: 0, extraPayment: 0, paymentAmount: 0, principalAmount: 0 };
        }
        setSnapshots(map);

        // Init mortgage drafts from existing snapshots
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

  async function patchSnapshot(loanId: number, fields: Partial<Omit<LoanSnapshot, 'loanId'>>) {
    const res = await fetch(`/api/reviews/${reviewId}/loans`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loanId, ...fields }),
    });
    if (res.ok) {
      const data = await res.json();
      setSnapshots((prev) => ({ ...prev, [loanId]: { ...prev[loanId], ...data.snapshot } }));
    }
  }

  async function patchLoan(loanId: number, fields: Partial<Pick<Loan, 'name' | 'rate' | 'paidOff' | 'mortgageInsurance' | 'otherFees'>>) {
    const res = await fetch(`/api/loans/${loanId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    if (res.ok) {
      const data = await res.json();
      setLoans((prev) => prev.map((l) => l.id === loanId ? { ...l, ...data.loan } : l));
    }
  }

  async function saveMortgagePayment(loan: Loan) {
    setSavingMortgage(loan.id);
    const draft = mortgageDrafts[loan.id] ?? { paymentAmount: '', principalAmount: '' };
    const payAmt = toCents(parseFloat(draft.paymentAmount) || 0);
    const prinAmt = toCents(parseFloat(draft.principalAmount) || 0);
    const snap = snapshots[loan.id];
    const newPayments = (snap?.paymentsMade ?? 0) + (payAmt > 0 ? 1 : 0);
    await patchSnapshot(loan.id, {
      paymentAmount: payAmt,
      principalAmount: prinAmt,
      paymentsMade: newPayments,
    });
    setSavingMortgage(null);
  }

  async function saveInsuranceSettings(loan: Loan) {
    setSavingInsurance(loan.id);
    const draft = insuranceDrafts[loan.id] ?? { mortgageInsurance: '', otherFees: '' };
    await patchLoan(loan.id, {
      mortgageInsurance: toCents(parseFloat(draft.mortgageInsurance) || 0),
      otherFees: toCents(parseFloat(draft.otherFees) || 0),
    });
    setSavingInsurance(null);
  }

  const schoolLoans = loans.filter((l) => l.category === 'SCHOOL');
  const mortgageLoans = loans.filter((l) => l.category === 'MORTGAGE');
  const highestRateSchool = schoolLoans
    .filter((l) => !l.paidOff)
    .reduce<Loan | null>((h, l) => !h || l.rate > h.rate ? l : h, null);

  if (loading) return <p style={{ color: colors.textMuted }}>Loading…</p>;

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
      {/* ══ SCHOOL LOANS ═══════════════════════════════════════════════════════ */}
      <SectionHeader>
        <SectionTitle>🎓 School Loans</SectionTitle>
        <SectionLine />
      </SectionHeader>

      <TableScroll>
        <Table>
          <Thead>
            <tr>
              <Th w={190}>Loan Name</Th>
              <Th w={110}>Balance</Th>
              <Th w={80}>Rate</Th>
              <Th w={70}>Term Left</Th>
              <Th w={90}>Min Pmt</Th>
              <Th w={110}>Extra Pmt</Th>
              <Th w={120}>Total Interest</Th>
              <Th w={120}>Interest Saved</Th>
              <Th w={80}>Time Saved</Th>
              <Th w={100}>Payoff Date</Th>
              <Th w={90}>Status</Th>
            </tr>
          </Thead>
          <tbody>
            {schoolLoans.map((loan) => {
              const snap = snapshots[loan.id] ?? { loanId: loan.id, balance: loan.principal, paymentsMade: 0, interestPaid: 0, extraPayment: 0, paymentAmount: 0, principalAmount: 0 };
              const isHighest = loan.id === highestRateSchool?.id;
              const remMonths = Math.max(0, loan.termMonths - snap.paymentsMade);
              const minPmt = monthlyPayment(loan.principal, loan.rate, loan.termMonths);
              const totInt = totalInterest(snap.balance, loan.rate, remMonths);
              const totIntWithExtra = snap.extraPayment > 0 ? totalInterest(snap.balance, loan.rate, remMonths, snap.extraPayment) : totInt;
              const saved = Math.max(0, totInt - totIntWithExtra);
              const schedWithExtra = snap.extraPayment > 0 ? amortizationSchedule(snap.balance, loan.rate, remMonths, snap.extraPayment) : null;
              const timeSavedMo = schedWithExtra ? remMonths - schedWithExtra.length : 0;
              const basePayoffStr = payoffDateStr(loan.startDate, snap.paymentsMade, remMonths);
              const extraPayoffStr = schedWithExtra ? payoffDateStr(loan.startDate, snap.paymentsMade, schedWithExtra.length) : null;

              return (
                <Tr key={loan.id} highlight={isHighest && !loan.paidOff} paidOff={loan.paidOff}>
                  <Td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <InlineEdit
                        value={loan.name}
                        onSave={(v) => patchLoan(loan.id, { name: v })}
                        color={isHighest && !loan.paidOff ? '#991B1B' : colors.textPrimary}
                        readOnly={readOnly}
                        isText
                        width={120}
                      />
                      {isHighest && !loan.paidOff && <HighBadge>Highest Rate</HighBadge>}
                      {loan.paidOff && <PaidBadge>✓ Paid Off</PaidBadge>}
                    </div>
                  </Td>
                  <Td style={{ color: isHighest && !loan.paidOff ? '#991B1B' : colors.textPrimary }}>
                    <InlineEdit
                      value={toDollars(snap.balance).toFixed(2)}
                      onSave={(v) => patchSnapshot(loan.id, { balance: toCents(parseFloat(v) || 0) })}
                      color={isHighest && !loan.paidOff ? '#991B1B' : undefined}
                      readOnly={readOnly || loan.paidOff}
                    />
                  </Td>
                  <Td>
                    <InlineEdit
                      value={(loan.rate * 100).toFixed(2)}
                      onSave={(v) => patchLoan(loan.id, { rate: (parseFloat(v) || 0) / 100 })}
                      color={isHighest && !loan.paidOff ? colors.danger : colors.textPrimary}
                      readOnly={readOnly || loan.paidOff}
                    />
                    <span style={{ fontSize: font.size.xs, color: colors.textMuted }}>%</span>
                  </Td>
                  <Td style={{ color: colors.textMuted }}>{loan.paidOff ? '—' : `${remMonths} mo`}</Td>
                  <Td>{formatDollars(minPmt)}</Td>
                  <Td style={{ background: loan.paidOff ? 'transparent' : '#FFFBEB' }}>
                    {loan.paidOff ? '—' : (
                      <InlineEdit
                        value={toDollars(snap.extraPayment).toFixed(2)}
                        onSave={(v) => patchSnapshot(loan.id, { extraPayment: toCents(parseFloat(v) || 0) })}
                        color="#B45309"
                        readOnly={readOnly}
                      />
                    )}
                  </Td>
                  <Td style={{ color: isHighest && !loan.paidOff ? colors.danger : colors.textMuted }}>
                    {loan.paidOff ? '—' : formatDollars(totIntWithExtra)}
                  </Td>
                  <Td style={{ color: saved > 0 ? colors.success : colors.textMuted, fontWeight: saved > 0 ? font.weight.semibold : 'normal' }}>
                    {loan.paidOff ? '—' : (saved > 0 ? `+${formatDollars(saved)}` : formatDollars(0))}
                  </Td>
                  <Td style={{ color: timeSavedMo > 0 ? colors.success : colors.textMuted }}>
                    {loan.paidOff ? '—' : (timeSavedMo > 0 ? `${timeSavedMo} mo` : '—')}
                  </Td>
                  <Td>
                    {loan.paidOff ? (
                      <PaidBadge>Paid Off</PaidBadge>
                    ) : (
                      <DateBadge variant={extraPayoffStr ? 'green' : 'blue'}>
                        {extraPayoffStr ?? basePayoffStr}
                      </DateBadge>
                    )}
                  </Td>
                  <Td>
                    {!readOnly && (
                      <PaidOffBtn
                        active={loan.paidOff}
                        onClick={() => patchLoan(loan.id, { paidOff: !loan.paidOff })}
                      >
                        {loan.paidOff ? '↩ Reopen' : '✓ Mark Paid'}
                      </PaidOffBtn>
                    )}
                  </Td>
                </Tr>
              );
            })}

            {/* Totals row — active loans only */}
            {schoolLoans.filter((l) => !l.paidOff).length > 0 && (() => {
              const active = schoolLoans.filter((l) => !l.paidOff);
              const totBal = active.reduce((s, l) => s + (snapshots[l.id]?.balance ?? 0), 0);
              const totMin = active.reduce((s, l) => s + monthlyPayment(l.principal, l.rate, l.termMonths), 0);
              const totExtra = active.reduce((s, l) => s + (snapshots[l.id]?.extraPayment ?? 0), 0);
              const totIntAll = active.reduce((s, l) => {
                const snap = snapshots[l.id];
                const rem = Math.max(0, l.termMonths - (snap?.paymentsMade ?? 0));
                return s + totalInterest(snap?.balance ?? l.principal, l.rate, rem);
              }, 0);
              const totSaved = active.reduce((s, l) => {
                const snap = snapshots[l.id];
                if (!snap || snap.extraPayment === 0) return s;
                const rem = Math.max(0, l.termMonths - snap.paymentsMade);
                const base = totalInterest(snap.balance, l.rate, rem);
                const withX = totalInterest(snap.balance, l.rate, rem, snap.extraPayment);
                return s + Math.max(0, base - withX);
              }, 0);
              const avgRate = active.reduce((s, l) => s + l.rate, 0) / active.length;
              return (
                <Tr isTotal>
                  <Td style={{ fontWeight: font.weight.bold, color: '#5B21B6', textTransform: 'uppercase', fontSize: font.size.xs }}>Totals</Td>
                  <Td style={{ fontWeight: font.weight.bold, color: '#5B21B6' }}>{formatDollars(totBal)}</Td>
                  <Td style={{ color: '#5B21B6', fontSize: font.size.xs }}>Avg {(avgRate * 100).toFixed(2)}%</Td>
                  <Td />
                  <Td style={{ fontWeight: font.weight.bold, color: '#5B21B6' }}>{formatDollars(totMin)}</Td>
                  <Td style={{ color: '#B45309', fontWeight: font.weight.semibold }}>{totExtra > 0 ? formatDollars(totExtra) : '—'}</Td>
                  <Td style={{ fontWeight: font.weight.bold, color: '#5B21B6' }}>{formatDollars(totIntAll)}</Td>
                  <Td style={{ fontWeight: font.weight.bold, color: colors.success }}>{totSaved > 0 ? formatDollars(totSaved) : '—'}</Td>
                  <Td /><Td /><Td />
                </Tr>
              );
            })()}

            {schoolLoans.length === 0 && (
              <tr><Td colSpan={11} style={{ textAlign: 'center', color: colors.textMuted, fontStyle: 'italic' }}>No school loans.</Td></tr>
            )}
          </tbody>
        </Table>
      </TableScroll>

      {/* ══ MORTGAGE ══════════════════════════════════════════════════════════ */}
      {mortgageLoans.map((loan) => {
        const snap = snapshots[loan.id] ?? { loanId: loan.id, balance: loan.principal, paymentsMade: 0, interestPaid: 0, extraPayment: 0, paymentAmount: 0, principalAmount: 0 };
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

        const mortDraft = mortgageDrafts[loan.id] ?? { paymentAmount: '', principalAmount: '' };
        const insDraft = insuranceDrafts[loan.id] ?? { mortgageInsurance: '', otherFees: '' };

        return (
          <React.Fragment key={loan.id}>
            <SectionHeader>
              <SectionTitle>🏠 Mortgage — {loan.name}</SectionTitle>
              <SectionLine />
            </SectionHeader>

            <MortgageGrid>
              <MortgageKpi style={{ gridColumn: 'span 2', background: '#EFF6FF', borderColor: colors.primary }}>
                <MkLabel>Remaining Balance</MkLabel>
                <MkValue tc={colors.primary} style={{ fontSize: font.size['3xl'] }}>
                  <InlineEdit
                    value={toDollars(snap.balance).toFixed(2)}
                    onSave={(v) => patchSnapshot(loan.id, { balance: toCents(parseFloat(v) || 0) })}
                    color={colors.primary}
                    readOnly={readOnly}
                  />
                </MkValue>
                <MkSub>Payment #{snap.paymentsMade} of {loan.termMonths}</MkSub>
              </MortgageKpi>
              <MortgageKpi>
                <MkLabel>Original Loan</MkLabel>
                <MkValue>{formatDollars(loan.principal)}</MkValue>
              </MortgageKpi>
              <MortgageKpi>
                <MkLabel>Interest Rate</MkLabel>
                <MkValue tc={colors.success}>{(loan.rate * 100).toFixed(3)}%</MkValue>
              </MortgageKpi>
              <MortgageKpi>
                <MkLabel>P&amp;I Payment</MkLabel>
                <MkValue>{formatDollars(basePmt)}</MkValue>
              </MortgageKpi>
              <MortgageKpi style={{ background: '#F0FDF4', borderColor: '#86EFAC' }}>
                <MkLabel>Total Monthly (w/ fees)</MkLabel>
                <MkValue tc="#15803D">{formatDollars(totalMonthlyPmt)}</MkValue>
                <MkSub>P&amp;I + MI + Other</MkSub>
              </MortgageKpi>
              <MortgageKpi>
                <MkLabel>Principal Paid</MkLabel>
                <MkValue tc={colors.primary}>{formatDollars(Math.max(0, principalPaid))}</MkValue>
              </MortgageKpi>
              <MortgageKpi>
                <MkLabel>Interest Paid (Est.)</MkLabel>
                <MkValue tc={colors.warning}>{formatDollars(interestPaidEst)}</MkValue>
              </MortgageKpi>
              <MortgageKpi>
                <MkLabel>Term Remaining</MkLabel>
                <MkValue>{remMonths} months</MkValue>
              </MortgageKpi>
              <MortgageKpi>
                <MkLabel>Payoff Date</MkLabel>
                <MkValue>{payoffStr}</MkValue>
              </MortgageKpi>
              <MortgageKpi style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
                <MkLabel>Total Interest (Life)</MkLabel>
                <MkValue tc={colors.danger}>{formatDollars(totalInterestLife)}</MkValue>
              </MortgageKpi>
            </MortgageGrid>

            <ProgressWrap>
              <ProgressLabel>
                Loan Progress: {pct.toFixed(0)}% Complete ({snap.paymentsMade} of {loan.termMonths} payments)
              </ProgressLabel>
              <ProgressTrack><ProgressFill pct={pct} /></ProgressTrack>
            </ProgressWrap>

            {/* Insurance / Fees settings */}
            {!readOnly && (
              <InsuranceSettingsCard>
                <InsuranceSettingsTitle>Monthly Fee Settings</InsuranceSettingsTitle>
                <InsuranceFields>
                  <FieldGroup>
                    <FieldLabel>Mortgage Insurance (PMI/MIP)</FieldLabel>
                    <FieldInput
                      type="number" step="0.01" placeholder="0.00"
                      value={insDraft.mortgageInsurance}
                      onChange={(e) => setInsuranceDrafts((p) => ({ ...p, [loan.id]: { ...p[loan.id], mortgageInsurance: e.target.value } }))}
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>Other Fees (HOA, Taxes Escrow, etc.)</FieldLabel>
                    <FieldInput
                      type="number" step="0.01" placeholder="0.00"
                      value={insDraft.otherFees}
                      onChange={(e) => setInsuranceDrafts((p) => ({ ...p, [loan.id]: { ...p[loan.id], otherFees: e.target.value } }))}
                    />
                  </FieldGroup>
                </InsuranceFields>
                <CalcTotal>
                  <span style={{ color: colors.textMuted }}>Auto-calculated total</span>
                  <span style={{ fontWeight: font.weight.bold }}>
                    {formatDollars(basePmt)} P&amp;I
                    {' + '}{formatDollars(toCents(parseFloat(insDraft.mortgageInsurance) || 0))} MI
                    {' + '}{formatDollars(toCents(parseFloat(insDraft.otherFees) || 0))} other
                    {' = '}<span style={{ color: '#15803D' }}>
                      {formatDollars(basePmt + toCents(parseFloat(insDraft.mortgageInsurance) || 0) + toCents(parseFloat(insDraft.otherFees) || 0))}
                    </span>/mo
                  </span>
                </CalcTotal>
                <button
                  onClick={() => saveInsuranceSettings(loan)}
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

            {/* This month's payment entry */}
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
                      onChange={(e) => setMortgageDrafts((p) => ({ ...p, [loan.id]: { ...p[loan.id], paymentAmount: e.target.value } }))}
                    />
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>Principal Portion (optional)</FieldLabel>
                    <FieldInput
                      type="number" step="0.01" placeholder="Auto-calculated if blank"
                      value={mortDraft.principalAmount}
                      onChange={(e) => setMortgageDrafts((p) => ({ ...p, [loan.id]: { ...p[loan.id], principalAmount: e.target.value } }))}
                    />
                  </FieldGroup>
                </PaymentFields>
                <PaymentSaveBtn
                  onClick={() => saveMortgagePayment(loan)}
                  disabled={!mortDraft.paymentAmount || savingMortgage === loan.id}
                >
                  {savingMortgage === loan.id ? 'Saving…' : '+ Record Payment (adds 1 to payment count)'}
                </PaymentSaveBtn>
              </PaymentCard>
            )}

            <div style={{ marginBottom: spacing[4] }}>
              <button
                onClick={() => setAmorLoan(loan)}
                style={{
                  padding: '8px 16px', background: colors.primary, color: '#fff',
                  border: 'none', borderRadius: radius.md, cursor: 'pointer',
                  fontSize: font.size.sm, fontWeight: font.weight.semibold,
                }}
              >
                📈 View Amortization Schedule
              </button>
            </div>
          </React.Fragment>
        );
      })}

      {mortgageLoans.length === 0 && (
        <>
          <SectionHeader>
            <SectionTitle>🏠 Mortgage</SectionTitle>
            <SectionLine />
          </SectionHeader>
          <p style={{ color: colors.textMuted, fontStyle: 'italic' }}>No mortgage configured.</p>
        </>
      )}

      {/* ══ AMORTIZATION MODAL ════════════════════════════════════════════════ */}
      {amorLoan && (() => {
        const snap = snapshots[amorLoan.id] ?? { paymentsMade: 0, balance: amorLoan.principal, extraPayment: 0, interestPaid: 0, loanId: amorLoan.id, paymentAmount: 0, principalAmount: 0 };
        const schedule = amortizationSchedule(amorLoan.principal, amorLoan.rate, amorLoan.termMonths);
        const startDate = new Date(amorLoan.startDate);

        let runInterest = 0;
        let runPrincipal = 0;
        const withTotals = schedule.map((row) => {
          runInterest += row.interest;
          runPrincipal += row.principal;
          return { ...row, totalInterest: runInterest, totalPrincipal: runPrincipal, totalPaid: runInterest + runPrincipal };
        });

        return (
          <ModalOverlay onClick={(e) => { if (e.target === e.currentTarget) setAmorLoan(null); }}>
            <ModalBox>
              <ModalHeader>
                <div>
                  <ModalTitle>📈 Amortization — {amorLoan.name}</ModalTitle>
                  <span style={{ fontSize: font.size.xs, background: '#DCFCE7', color: '#166534', padding: '3px 10px', borderRadius: radius.full, fontWeight: font.weight.semibold, marginTop: 6, display: 'inline-block' }}>
                    Current: Payment #{snap.paymentsMade} of {amorLoan.termMonths} ({((snap.paymentsMade / amorLoan.termMonths) * 100).toFixed(0)}%)
                  </span>
                </div>
                <ModalClose onClick={() => setAmorLoan(null)}>✕</ModalClose>
              </ModalHeader>
              <ModalScrollBody>
                <AmorTable>
                  <thead>
                    <tr>
                      <AmorTh>Pmt #</AmorTh>
                      <AmorTh style={{ textAlign: 'left' }}>Date</AmorTh>
                      <AmorTh>Payment</AmorTh>
                      <AmorTh>Interest</AmorTh>
                      <AmorTh>Principal</AmorTh>
                      <AmorTh>Cum. Interest</AmorTh>
                      <AmorTh>Cum. Principal</AmorTh>
                      <AmorTh>Balance</AmorTh>
                      <AmorTh>Total Paid</AmorTh>
                    </tr>
                  </thead>
                  <tbody>
                    {withTotals.map((row) => {
                      const isCurrent = row.month === snap.paymentsMade;
                      const d = new Date(startDate);
                      d.setMonth(d.getMonth() + row.month - 1);
                      return (
                        <AmorTr key={row.month} isCurrent={isCurrent}>
                          <AmorTd>{isCurrent ? '►' : ''} {row.month}</AmorTd>
                          <AmorTd style={{ textAlign: 'left' }}>{MONTH_NAMES[d.getMonth()]} {d.getFullYear()}</AmorTd>
                          <AmorTd>{formatDollars(row.payment)}</AmorTd>
                          <AmorTd style={{ color: colors.warning }}>{formatDollars(row.interest)}</AmorTd>
                          <AmorTd style={{ color: colors.primary }}>{formatDollars(row.principal)}</AmorTd>
                          <AmorTd>{formatDollars(row.totalInterest)}</AmorTd>
                          <AmorTd>{formatDollars(row.totalPrincipal)}</AmorTd>
                          <AmorTd style={{ fontWeight: font.weight.semibold }}>{formatDollars(row.balance)}</AmorTd>
                          <AmorTd>{formatDollars(row.totalPaid)}</AmorTd>
                        </AmorTr>
                      );
                    })}
                  </tbody>
                </AmorTable>
              </ModalScrollBody>
            </ModalBox>
          </ModalOverlay>
        );
      })()}
    </StepShell>
  );
}
