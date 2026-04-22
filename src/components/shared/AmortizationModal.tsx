'use client';

import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Modal } from '@/components/ui/Modal';
import { amortizationSchedule, MONTH_NAMES_SHORT } from '@/lib/fire';
import { formatDollars } from '@/lib/money';
import { colors, font, radius, semanticColors } from '@/styles/tokens';

// ─── Table styles ─────────────────────────────────────────────────────────────

const ScrollBody = styled.div`overflow-y: auto; max-height: calc(80vh - 120px);`;

const AmorTable = styled.table`width: 100%; border-collapse: collapse; font-size: ${font.size.xs};`;

const AmorTh = styled.th`
  padding: 7px 10px;
  text-align: right;
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  border-bottom: 1px solid ${colors.border};
  background: ${colors.bg};
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
  &:first-child { text-align: center; }
`;

const AmorTr = styled.tr.withConfig({ shouldForwardProp: (p) => p !== 'isCurrent' })<{ isCurrent: boolean }>`
  background: ${({ isCurrent }) => isCurrent ? colors.primaryLight : 'transparent'};
  font-weight: ${({ isCurrent }) => isCurrent ? font.weight.semibold : font.weight.normal};
  &:nth-child(even) { background: ${({ isCurrent }) => isCurrent ? colors.primaryLight : semanticColors.surfaceMuted}; }
  &:last-child td { border-bottom: none; }
`;

const AmorTd = styled.td`
  padding: 7px 10px;
  text-align: right;
  border-bottom: 1px solid ${colors.border};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  &:first-child { text-align: center; }
`;

const ProgressChip = styled.span`
  font-size: ${font.size.xs};
  background: ${colors.successLight};
  color: ${semanticColors.successTextDark};
  padding: 3px 10px;
  border-radius: ${radius.full};
  font-weight: ${font.weight.semibold};
  margin-top: 6px;
  display: inline-block;
`;

// ─── Component ────────────────────────────────────────────────────────────────

interface AmortizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  loanName: string;
  principal: number;
  rate: number;
  termMonths: number;
  startDate: string;
  paymentsMade: number;
}

export const AmortizationModal = React.memo(function AmortizationModal({
  isOpen, onClose, loanName, principal, rate, termMonths, startDate, paymentsMade,
}: AmortizationModalProps) {
  const schedule = useMemo(
    () => amortizationSchedule(principal, rate, termMonths),
    [principal, rate, termMonths],
  );

  const withTotals = useMemo(() => {
    let runInterest = 0;
    let runPrincipal = 0;
    return schedule.map((row) => {
      runInterest += row.interest;
      runPrincipal += row.principal;
      return { ...row, totalInterest: runInterest, totalPrincipal: runPrincipal, totalPaid: runInterest + runPrincipal };
    });
  }, [schedule]);

  const startD = useMemo(() => new Date(startDate), [startDate]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="960px" title={`📈 Amortization — ${loanName}`}>
      <ProgressChip>
        Current: Payment #{paymentsMade} of {termMonths} ({((paymentsMade / termMonths) * 100).toFixed(0)}%)
      </ProgressChip>
      <ScrollBody>
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
              const isCurrent = row.month === paymentsMade;
              const d = new Date(startD);
              d.setMonth(d.getMonth() + row.month - 1);
              return (
                <AmorTr key={row.month} isCurrent={isCurrent}>
                  <AmorTd>{isCurrent ? '►' : ''} {row.month}</AmorTd>
                  <AmorTd style={{ textAlign: 'left' }}>{MONTH_NAMES_SHORT[d.getMonth()]} {d.getFullYear()}</AmorTd>
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
      </ScrollBody>
    </Modal>
  );
});
