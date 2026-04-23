'use client';

import React, { useMemo } from 'react';
import styled from 'styled-components';
import { formatDollars, toCents, toDollars } from '@/lib/money';
import { amortizationSchedule, monthlyPayment, totalInterest, payoffDateStr } from '@/lib/fire';
import { InlineEdit } from '@/components/shared/InlineEdit';
import { theme } from '@/styles/tokens';

const { colors, font, spacing, radius, semanticColors } = theme;
import { Badge } from '@/components/ui/Badge';
import type { Loan, LoanSnapshot } from '@/types/entities';


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
const Thead = styled.thead`background: ${colors.bg}; position: sticky; top: 0; z-index: 1;`;
const Th = styled.th.withConfig({ shouldForwardProp: (p) => p !== 'w' })<{ w?: number }>`
  padding: ${spacing[2]} ${spacing[3]};
  font-size: ${font.size.xs}; font-weight: ${font.weight.semibold};
  color: ${colors.textMuted}; text-align: right;
  border-bottom: 1px solid ${colors.border}; white-space: nowrap;
  ${({ w }) => w ? `width: ${w}px; min-width: ${w}px;` : ''}
  &:first-child { text-align: left; position: sticky; left: 0; background: ${colors.bg}; z-index: 2; }
`;
const Tr = styled.tr.withConfig({
  shouldForwardProp: (p) => !['highlight', 'isTotal', 'paidOff'].includes(p),
})<{ highlight?: boolean; isTotal?: boolean; paidOff?: boolean }>`
  background: ${({ isTotal, highlight, paidOff }) =>
    isTotal ? semanticColors.purpleLight : paidOff ? colors.bg : highlight ? colors.dangerLight : colors.surface};
  opacity: ${({ paidOff }) => paidOff ? 0.55 : 1};
  border-left: ${({ highlight }) => highlight ? `3px solid ${colors.danger}` : '3px solid transparent'};
  &:not(:last-child) td { border-bottom: 1px solid ${colors.border}; }
  &:nth-child(even) { background: ${({ isTotal, highlight, paidOff }) =>
    isTotal ? semanticColors.purpleLight : paidOff ? colors.bg : highlight ? colors.dangerLight : colors.bg}; }
`;
const Td = styled.td.withConfig({
  shouldForwardProp: (p) => !['right', 'muted', 'danger', 'success', 'purple', 'bold'].includes(p),
})<{ muted?: boolean; danger?: boolean; success?: boolean; purple?: boolean; bold?: boolean }>`
  padding: 10px 12px; font-size: ${font.size.sm};
  color: ${({ danger, success, purple, muted }) =>
    danger ? colors.danger :
    success ? colors.success :
    purple ? semanticColors.purpleTextDark :
    muted ? colors.textMuted :
    colors.textPrimary};
  font-weight: ${({ bold }) => bold ? font.weight.bold : font.weight.normal};
  text-align: right; white-space: nowrap; vertical-align: middle;
  &:first-child { text-align: left; position: sticky; left: 0; background: inherit; z-index: 1; }
`;
const ExtraPayTd = styled(Td).withConfig({ shouldForwardProp: (p) => p !== 'active' })<{ active?: boolean }>`
  background: ${({ active }) => active ? colors.warningLight : 'transparent'};
`;
const PaidOffBtn = styled.button.withConfig({ shouldForwardProp: (p) => p !== 'active' })<{ active: boolean }>`
  font-size: 10px; font-weight: ${font.weight.semibold};
  padding: 2px 8px; border-radius: ${radius.full}; cursor: pointer;
  border: 1px solid ${({ active }) => active ? colors.successLight : colors.border};
  background: ${({ active }) => active ? colors.successLight : colors.surface};
  color: ${({ active }) => active ? semanticColors.successTextDeep : colors.textMuted};
  margin-left: 6px;
  &:hover { opacity: 0.8; }
`;
const LoanNameCell = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;
const RateSuffix = styled.span`
  font-size: ${font.size.xs};
  color: ${colors.textMuted};
`;

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
    if (active.length === 0) return null;
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
    return { totBal, totMin, totExtra, totIntAll, totSaved, avgRate };
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
                  <InlineEdit
                    value={toDollars(snap.balance).toFixed(2)}
                    onSave={(v) => onPatchSnapshot(loan.id, { balance: toCents(parseFloat(v) || 0) })}
                    color={isHighest && !loan.paidOff ? semanticColors.dangerTextDark : undefined}
                    readOnly={readOnly || loan.paidOff}
                  />
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
                <Td muted>{loan.paidOff ? '—' : `${remMonths} mo`}</Td>
                <Td>{formatDollars(minPmt)}</Td>
                <ExtraPayTd active={!loan.paidOff}>
                  {loan.paidOff ? '—' : (
                    <InlineEdit
                      value={toDollars(snap.extraPayment).toFixed(2)}
                      onSave={(v) => onPatchSnapshot(loan.id, { extraPayment: toCents(parseFloat(v) || 0) })}
                      color={semanticColors.warningText}
                      readOnly={readOnly}
                    />
                  )}
                </ExtraPayTd>
                <Td danger={isHighest && !loan.paidOff} muted={!(isHighest && !loan.paidOff)}>
                  {loan.paidOff ? '—' : formatDollars(totIntWithExtra)}
                </Td>
                <Td success={saved > 0} muted={saved === 0} bold={saved > 0}>
                  {loan.paidOff ? '—' : (saved > 0 ? `+${formatDollars(saved)}` : formatDollars(0))}
                </Td>
                <Td success={timeSavedMo > 0} muted={timeSavedMo === 0}>
                  {loan.paidOff ? '—' : (timeSavedMo > 0 ? `${timeSavedMo} mo` : '—')}
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
              <Td /><Td /><Td />
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
