'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { theme } from '@/styles/tokens';
import {
  TypeGrid, TypeCard, TypeLabel, TypeDesc, FieldLabel, SelectRow,
  StyledSelect, StepList, StepItem, ErrorMsg,
} from './NewReviewModal.styles';
import { MONTH_NAMES_LONG } from '@/lib/fire';
import type { ReviewStep } from '@/lib/store';

const { colors } = theme;

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
