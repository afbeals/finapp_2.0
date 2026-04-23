'use client';

import React, { useMemo } from 'react';
import { formatDollars, toCents, toDollars } from '@/lib/money';
import { amortizationSchedule, monthlyPayment, totalInterest, payoffDateStr } from '@/lib/fire';
import { InlineEdit } from '@/components/shared/InlineEdit';
import { theme } from '@/styles/tokens';

const { colors, font, semanticColors } = theme;
import { Badge } from '@/components/ui/Badge';
import type { Loan, LoanSnapshot } from '@/types/entities';
import {
  TableScroll, Table, Thead, Th, Tr, Td, ExtraPayTd, PaidOffBtn, LoanNameCell, RateSuffix,
} from './SchoolLoansTable.styles';

interface SchoolLoansTableProps {
  loans: Loan[];
  snapshots: Record<number, LoanSnapshot>;
  readOnly: boolean;
  onPatchSnapshot: (loanId: number, fields: Partial<Omit<LoanSnapshot, 'loanId'>>) => Promise<void>;
  onPatchLoan: (loanId: number, fields: Partial<Pick<Loan, 'name' | 'rate' | 'paidOff'>>) => Promise<void>;
}

export const SchoolLoansTable = React.memo(function SchoolLoansTable({
  loans, snapshots, readOnly, onPatchSnapshot, onPatchLoan,
}: SchoolLoansTableProps) {
  const highestRateSchool = useMemo(
    () => loans.filter((l) => !l.paidOff).reduce<Loan | null>((h, l) => !h || l.rate > h.rate ? l : h, null),
    [loans],
  );

  const totals = useMemo(() => {
    const active = loans.filter((l) => !l.paidOff);
    if (loans.length === 0) return null;
    const totBal = active.reduce((s, l) => s + (snapshots[l.id]?.balance ?? 0), 0);
    const totMin = active.reduce((s, l) => s + monthlyPayment(l.principal, l.rate, l.termMonths), 0);
    const totExtra = active.reduce((s, l) => s + (snapshots[l.id]?.extraPayment ?? 0), 0);
    const totIntAll = active.reduce((s, l) => {
      const snap = snapshots[l.id];
      const rem = Math.max(0, l.termMonths - (snap?.paymentsMade ?? 0));
      return s + totalInterest(snap?.balance ?? l.principal, l.rate, rem);
    }, 0);
    // Interest saved + time saved aggregated over ALL loans (including paid-off)
    const totSaved = loans.reduce((s, l) => {
      const snap = snapshots[l.id];
      if (!snap || snap.extraPayment === 0) return s;
      if (l.paidOff) {
        // Use full loan lifecycle for paid-off loans
        const base = totalInterest(l.principal, l.rate, l.termMonths);
        const withX = totalInterest(l.principal, l.rate, l.termMonths, snap.extraPayment);
        return s + Math.max(0, base - withX);
      }
      const rem = Math.max(0, l.termMonths - snap.paymentsMade);
      const base = totalInterest(snap.balance, l.rate, rem);
      const withX = totalInterest(snap.balance, l.rate, rem, snap.extraPayment);
      return s + Math.max(0, base - withX);
    }, 0);
    const totMonthsSaved = loans.reduce((s, l) => {
      const snap = snapshots[l.id];
      if (!snap || snap.extraPayment === 0) return s;
      if (l.paidOff) {
        const schedWithX = amortizationSchedule(l.principal, l.rate, l.termMonths, snap.extraPayment);
        return s + Math.max(0, l.termMonths - schedWithX.length);
      }
      const rem = Math.max(0, l.termMonths - snap.paymentsMade);
      const schedWithX = amortizationSchedule(snap.balance, l.rate, rem, snap.extraPayment);
      return s + Math.max(0, rem - schedWithX.length);
    }, 0);
    const avgRate = active.length > 0 ? active.reduce((s, l) => s + l.rate, 0) / active.length : 0;
    return { totBal, totMin, totExtra, totIntAll, totSaved, totMonthsSaved, avgRate };
  }, [loans, snapshots]);

  return (
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
          {loans.map((loan) => {
            const snap = snapshots[loan.id] ?? { loanId: loan.id, balance: loan.principal, paymentsMade: 0, interestPaid: 0, extraPayment: 0, paymentAmount: 0, principalAmount: 0 };
            const isHighest = loan.id === highestRateSchool?.id;
            const remMonths = Math.max(0, loan.termMonths - snap.paymentsMade);
            const minPmt = monthlyPayment(loan.principal, loan.rate, loan.termMonths);
            const totInt = totalInterest(snap.balance, loan.rate, remMonths);
            const totIntWithExtra = snap.extraPayment > 0 ? totalInterest(snap.balance, loan.rate, remMonths, snap.extraPayment) : totInt;
            const saved = Math.max(0, totInt - totIntWithExtra);
            const schedWX = snap.extraPayment > 0 ? amortizationSchedule(snap.balance, loan.rate, remMonths, snap.extraPayment) : null;
            const timeSavedMo = schedWX ? remMonths - schedWX.length : 0;
            const basePayoffStr = payoffDateStr(loan.startDate, snap.paymentsMade, remMonths);
            const extraPayoffStr = schedWX ? payoffDateStr(loan.startDate, snap.paymentsMade, schedWX.length) : null;

            return (
              <Tr key={loan.id} highlight={isHighest && !loan.paidOff} paidOff={loan.paidOff}>
                <Td>
                  <LoanNameCell>
                    <InlineEdit
                      value={loan.name}
                      onSave={(v) => onPatchLoan(loan.id, { name: v })}
                      color={isHighest && !loan.paidOff ? semanticColors.dangerTextDark : colors.textPrimary}
                      readOnly={readOnly}
                      type="text"
                      width={120}
                    />
                    {isHighest && !loan.paidOff && <Badge variant="danger">Highest Rate</Badge>}
                    {loan.paidOff && <Badge>✓ Paid Off</Badge>}
                  </LoanNameCell>
                </Td>
                <Td danger={isHighest && !loan.paidOff}>
                  {loan.paidOff ? (
                    <span style={{ textDecoration: 'line-through', color: colors.textMuted }}>{formatDollars(snap.balance)}</span>
                  ) : (
                    <InlineEdit
                      value={toDollars(snap.balance).toFixed(2)}
                      onSave={(v) => onPatchSnapshot(loan.id, { balance: toCents(parseFloat(v) || 0) })}
                      color={isHighest ? semanticColors.dangerTextDark : undefined}
                      readOnly={readOnly}
                    />
                  )}
                </Td>
                <Td>
                  <InlineEdit
                    value={(loan.rate * 100).toFixed(2)}
                    onSave={(v) => onPatchLoan(loan.id, { rate: (parseFloat(v) || 0) / 100 })}
                    color={isHighest && !loan.paidOff ? colors.danger : colors.textPrimary}
                    readOnly={readOnly || loan.paidOff}
                  />
                  <RateSuffix>%</RateSuffix>
                </Td>
                <Td muted>{loan.paidOff ? <span style={{ textDecoration: 'line-through' }}>0 mo</span> : `${remMonths} mo`}</Td>
                <Td>{formatDollars(minPmt)}</Td>
                <ExtraPayTd active={!loan.paidOff}>
                  {loan.paidOff ? (
                    snap.extraPayment > 0
                      ? <span style={{ color: semanticColors.warningText }}>{formatDollars(snap.extraPayment)}</span>
                      : <span style={{ color: colors.textDisabled }}>—</span>
                  ) : (
                    <InlineEdit
                      value={toDollars(snap.extraPayment).toFixed(2)}
                      onSave={(v) => onPatchSnapshot(loan.id, { extraPayment: toCents(parseFloat(v) || 0) })}
                      color={semanticColors.warningText}
                      readOnly={readOnly}
                    />
                  )}
                </ExtraPayTd>
                <Td muted={loan.paidOff} danger={isHighest && !loan.paidOff}>
                  {formatDollars(totIntWithExtra)}
                </Td>
                <Td success={!loan.paidOff && saved > 0} muted={loan.paidOff || saved === 0} bold={!loan.paidOff && saved > 0}>
                  {saved > 0 ? `+${formatDollars(saved)}` : formatDollars(0)}
                </Td>
                <Td success={!loan.paidOff && timeSavedMo > 0} muted={loan.paidOff || timeSavedMo === 0}>
                  {timeSavedMo > 0 ? `${timeSavedMo} mo` : '—'}
                </Td>
                <Td>
                  {loan.paidOff ? (
                    <Badge>Paid Off</Badge>
                  ) : (
                    <Badge variant={extraPayoffStr ? 'success' : 'primary'}>
                      {extraPayoffStr ?? basePayoffStr}
                    </Badge>
                  )}
                </Td>
                <Td>
                  {!readOnly && (
                    <PaidOffBtn
                      active={loan.paidOff}
                      onClick={() => onPatchLoan(loan.id, { paidOff: !loan.paidOff })}
                    >
                      {loan.paidOff ? '↩ Reopen' : '✓ Mark Paid'}
                    </PaidOffBtn>
                  )}
                </Td>
              </Tr>
            );
          })}

          {totals && (
            <Tr isTotal>
              <Td purple bold style={{ textTransform: 'uppercase', fontSize: font.size.xs }}>Totals</Td>
              <Td purple bold>{formatDollars(totals.totBal)}</Td>
              <Td purple style={{ fontSize: font.size.xs }}>Avg {(totals.avgRate * 100).toFixed(2)}%</Td>
              <Td />
              <Td purple bold>{formatDollars(totals.totMin)}</Td>
              <Td style={{ color: semanticColors.warningText, fontWeight: font.weight.semibold }}>{totals.totExtra > 0 ? formatDollars(totals.totExtra) : '—'}</Td>
              <Td purple bold>{formatDollars(totals.totIntAll)}</Td>
              <Td success bold>{totals.totSaved > 0 ? formatDollars(totals.totSaved) : '—'}</Td>
              <Td success bold>{totals.totMonthsSaved > 0 ? `${totals.totMonthsSaved} mo` : '—'}</Td>
              <Td /><Td />
            </Tr>
          )}

          {loans.length === 0 && (
            <tr><Td colSpan={11} muted style={{ textAlign: 'center', fontStyle: 'italic' }}>No school loans.</Td></tr>
          )}
        </tbody>
      </Table>
    </TableScroll>
  );
});
