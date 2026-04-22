'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { colors, font, radius, spacing } from '@/styles/tokens';
import { MONTH_NAMES_LONG } from '@/lib/fire';
import type { ReviewStep } from '@/lib/store';

interface Review {
  id: number;
  periodYear: number;
  periodMonth: number;
  type: 'MONTHLY' | 'QUARTERLY';
  status: 'IN_PROGRESS' | 'COMPLETE' | 'SKIPPED';
  currentStep: string;
  lockedForEdit: boolean;
  completedAt: string | null;
  steps: ReviewStep[];
}

interface NewReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (review: Review) => void;
  existingMonths: { year: number; month: number }[];
}

const TypeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing[3]};
  margin-bottom: ${spacing[6]};
`;

const TypeCard = styled.button.withConfig({
  shouldForwardProp: (prop) => !['selected', 'accent'].includes(prop),
})<{ selected: boolean; accent: string }>`
  padding: ${spacing[4]};
  border-radius: ${radius.lg};
  border: 2px solid ${({ selected, accent }) => selected ? accent : colors.border};
  background: ${({ selected, accent }) => selected ? `${accent}12` : colors.surface};
  cursor: pointer;
  text-align: left;
  transition: border-color 150ms ease, background 150ms ease;

  &:hover {
    border-color: ${({ accent }) => accent};
  }
`;

const TypeLabel = styled.div`
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${colors.textPrimary};
  margin-bottom: 4px;
`;

const TypeDesc = styled.div`
  font-size: ${font.size.sm};
  color: ${colors.textMuted};
`;

const FieldLabel = styled.label`
  display: block;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${colors.textSecondary};
  margin-bottom: ${spacing[2]};
`;

const SelectRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing[3]};
  margin-bottom: ${spacing[6]};
`;

const StyledSelect = styled.select`
  width: 100%;
  height: 40px;
  padding: 0 32px 0 12px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748B' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 12px center;
  appearance: none;
  font-size: ${font.size.base};
  color: ${colors.textPrimary};
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: ${colors.primary};
    box-shadow: 0 0 0 3px ${colors.primaryLight};
  }

  option:disabled {
    color: ${colors.textDisabled};
  }
`;

const StepList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: ${spacing[6]};
  padding: ${spacing[4]};
  background: ${colors.bg};
  border-radius: ${radius.md};
`;

const StepItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${spacing[2]};
  font-size: ${font.size.sm};
  color: ${colors.textSecondary};

  &::before {
    content: '→';
    color: ${colors.textMuted};
    font-size: 11px;
  }
`;

const ErrorMsg = styled.p`
  font-size: ${font.size.sm};
  color: ${colors.danger};
  margin-bottom: ${spacing[3]};
`;

const MONTHLY_STEPS = ['Expense Entry', 'Monthly Summary', 'Savings', 'Investments', 'Vaults', 'Finalize'];
const QUARTERLY_STEPS = ['Expense Entry', 'Monthly Summary', 'Savings', 'Loans & Credit', 'Investments', 'Portfolio & FIRE', 'Vaults', 'Finalize'];

const currentYear = new Date().getFullYear();
const years = [currentYear - 1, currentYear, currentYear + 1];

export function NewReviewModal({ isOpen, onClose, onCreated, existingMonths }: NewReviewModalProps) {
  const [type, setType] = useState<'MONTHLY' | 'QUARTERLY'>('MONTHLY');
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isMonthTaken = existingMonths.some((m) => m.year === year && m.month === month);
  const steps = type === 'QUARTERLY' ? QUARTERLY_STEPS : MONTHLY_STEPS;

  async function handleCreate() {
    if (isMonthTaken) {
      setError('A review for this month already exists.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodYear: year, periodMonth: month, type }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create review');
        return;
      }
      onCreated(data.review);
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start New Review"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={loading || isMonthTaken}>
            {loading ? 'Creating…' : 'Start Review'}
          </Button>
        </>
      }
    >
      <FieldLabel>Review type</FieldLabel>
      <TypeGrid>
        <TypeCard selected={type === 'MONTHLY'} accent={colors.primary} onClick={() => setType('MONTHLY')}>
          <TypeLabel>Monthly</TypeLabel>
          <TypeDesc>6 steps · Expenses, savings, investments</TypeDesc>
        </TypeCard>
        <TypeCard selected={type === 'QUARTERLY'} accent={colors.warning} onClick={() => setType('QUARTERLY')}>
          <TypeLabel>Quarterly</TypeLabel>
          <TypeDesc>8 steps · Includes loans &amp; FIRE projection</TypeDesc>
        </TypeCard>
      </TypeGrid>

      <FieldLabel>Period</FieldLabel>
      <SelectRow>
        <div>
          <StyledSelect value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTH_NAMES_LONG.map((name, i) => {
              const taken = existingMonths.some((m) => m.year === year && m.month === i + 1);
              return (
                <option key={i} value={i + 1} disabled={taken}>
                  {name}{taken ? ' (exists)' : ''}
                </option>
              );
            })}
          </StyledSelect>
        </div>
        <div>
          <StyledSelect value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </StyledSelect>
        </div>
      </SelectRow>

      <FieldLabel>Steps included</FieldLabel>
      <StepList>
        {steps.map((s) => <StepItem key={s}>{s}</StepItem>)}
      </StepList>

      {(isMonthTaken || error) && (
        <ErrorMsg>{isMonthTaken ? 'A review for this month already exists.' : error}</ErrorMsg>
      )}
    </Modal>
  );
}
