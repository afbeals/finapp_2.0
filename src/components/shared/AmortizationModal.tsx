'use client';

import React, { useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { amortizationSchedule, MONTH_NAMES_SHORT } from '@/lib/fire';
import { formatDollars } from '@/lib/money';
import { theme } from '@/styles/tokens';
import { ScrollBody, AmorTable, AmorTh, AmorTr, AmorTd, ProgressChip } from './AmortizationModal.styles';

const { colors, font } = theme;

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
