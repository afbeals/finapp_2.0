'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { toCents, toDollars } from '@/lib/money';
import { colors, font, spacing, radius } from '@/styles/tokens';
import type { Loan } from '@/types/entities';

// ─── Styled components ────────────────────────────────────────────────────────

const Panel = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: ${spacing[4]} ${spacing[5]};
  margin-bottom: ${spacing[4]};
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const PanelTitle = styled.p`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${colors.textPrimary};
  margin-bottom: ${spacing[3]};
`;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: ${spacing[3]};
  margin-bottom: ${spacing[3]};
`;

const FieldGroup = styled.div`display: flex; flex-direction: column; gap: 4px;`;

const FieldLabel = styled.label`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const FieldInput = styled.input`
  padding: 7px 10px;
  font-size: ${font.size.sm};
  font-family: inherit;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface};
  color: ${colors.textPrimary};
  outline: none;
  text-align: right;
  &:focus { border-color: ${colors.primary}; box-shadow: 0 0 0 2px ${colors.primaryLight}; }
  &:disabled { opacity: 0.5; background: ${colors.bg}; }
`;

const Divider = styled.div`
  height: 1px;
  background: ${colors.border};
  margin: ${spacing[3]} 0;
`;

const HelperText = styled.p`
  font-size: ${font.size.xs};
  color: ${colors.textMuted};
  margin-top: ${spacing[1]};
`;

const SavingDot = styled.span`
  font-size: ${font.size.xs};
  color: ${colors.textMuted};
  font-style: italic;
`;

// ─── Types ────────────────────────────────────────────────────────────────────

type LoanField = keyof Loan;

interface MortgageSettingsPanelProps {
  loan: Loan;
  readOnly: boolean;
  onSaveLoanField: (loanId: number, fields: Partial<Loan>) => Promise<void>;
}

type DraftState = {
  name: string;
  principal: string;
  rate: string;
  termMonths: string;
  startDate: string;
  mortgageInsurance: string;
  propertyTax: string;
  hoa: string;
  homeownersInsurance: string;
  otherFees: string;
  homeValue: string;
  pmiDropBalance: string;
};

function loanToDraft(loan: Loan): DraftState {
  return {
    name: loan.name,
    principal: toDollars(loan.principal).toFixed(2),
    rate: (loan.rate * 100).toFixed(3),
    termMonths: String(loan.termMonths),
    startDate: loan.startDate ? loan.startDate.slice(0, 10) : '',
    mortgageInsurance: loan.mortgageInsurance ? toDollars(loan.mortgageInsurance).toFixed(2) : '',
    propertyTax: loan.propertyTax ? toDollars(loan.propertyTax).toFixed(2) : '',
    hoa: loan.hoa ? toDollars(loan.hoa).toFixed(2) : '',
    homeownersInsurance: loan.homeownersInsurance ? toDollars(loan.homeownersInsurance).toFixed(2) : '',
    otherFees: loan.otherFees ? toDollars(loan.otherFees).toFixed(2) : '',
    homeValue: loan.homeValue ? toDollars(loan.homeValue).toFixed(0) : '',
    pmiDropBalance: loan.pmiDropBalance ? toDollars(loan.pmiDropBalance).toFixed(0) : '',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MortgageSettingsPanel({ loan, readOnly, onSaveLoanField }: MortgageSettingsPanelProps) {
  const [draft, setDraft] = useState<DraftState>(() => loanToDraft(loan));
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync draft if loan changes externally (e.g. after a save)
  useEffect(() => { setDraft(loanToDraft(loan)); }, [loan.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveField = useCallback(
    async (fields: Partial<Loan>) => {
      setSaving(true);
      try {
        await onSaveLoanField(loan.id, fields);
      } finally {
        setSaving(false);
      }
    },
    [loan.id, onSaveLoanField],
  );

  function handleChange(field: keyof DraftState, value: string) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  function handleBlur(field: keyof DraftState) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const updates: Partial<Loan> = {};
      const v = draft[field];
      switch (field) {
        case 'name':
          if (v.trim()) updates.name = v.trim();
          break;
        case 'principal':
          updates.principal = toCents(parseFloat(v) || 0);
          break;
        case 'rate':
          updates.rate = (parseFloat(v) || 0) / 100;
          break;
        case 'termMonths':
          updates.termMonths = parseInt(v) || loan.termMonths;
          break;
        case 'startDate':
          if (v) updates.startDate = v;
          break;
        case 'mortgageInsurance':
          updates.mortgageInsurance = toCents(parseFloat(v) || 0);
          break;
        case 'propertyTax':
          updates.propertyTax = v ? toCents(parseFloat(v) || 0) : null;
          break;
        case 'hoa':
          updates.hoa = v ? toCents(parseFloat(v) || 0) : null;
          break;
        case 'homeownersInsurance':
          updates.homeownersInsurance = v ? toCents(parseFloat(v) || 0) : null;
          break;
        case 'otherFees':
          updates.otherFees = toCents(parseFloat(v) || 0);
          break;
        case 'homeValue':
          updates.homeValue = v ? toCents(parseFloat(v) || 0) : null;
          break;
        case 'pmiDropBalance':
          updates.pmiDropBalance = v ? toCents(parseFloat(v) || 0) : null;
          break;
      }
      if (Object.keys(updates).length > 0) saveField(updates);
    }, 400);
  }

  function field(
    label: string,
    key: keyof DraftState,
    type: 'text' | 'number' | 'date' = 'number',
    placeholder = '',
  ) {
    return (
      <FieldGroup>
        <FieldLabel>{label}</FieldLabel>
        <FieldInput
          type={type}
          step={type === 'number' ? '0.01' : undefined}
          placeholder={placeholder}
          value={draft[key]}
          onChange={(e) => handleChange(key, e.target.value)}
          onBlur={() => handleBlur(key)}
          disabled={readOnly}
        />
      </FieldGroup>
    );
  }

  return (
    <Panel>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] }}>
        <PanelTitle style={{ margin: 0 }}>⚙️ Loan Settings</PanelTitle>
        {saving && <SavingDot>Saving…</SavingDot>}
      </div>

      <FieldGrid>
        {field('Loan Name', 'name', 'text', 'e.g. Primary Mortgage')}
        {field('Original Principal ($)', 'principal', 'number', '0.00')}
        {field('Annual Interest Rate (%)', 'rate', 'number', '0.000')}
        {field('Term (months)', 'termMonths', 'number', '360')}
        {field('Start Date', 'startDate', 'date')}
      </FieldGrid>

      <Divider />
      <FieldLabel style={{ display: 'block', marginBottom: spacing[2] }}>Monthly Fee Breakdown</FieldLabel>
      <FieldGrid>
        {field('PMI / MIP ($/mo)', 'mortgageInsurance', 'number', '0.00')}
        {field('Property Tax ($/mo)', 'propertyTax', 'number', '0.00')}
        {field('HOA ($/mo)', 'hoa', 'number', '0.00')}
        {field('Home Insurance ($/mo)', 'homeownersInsurance', 'number', '0.00')}
        {field('Other Fees ($/mo)', 'otherFees', 'number', '0.00')}
      </FieldGrid>
      <HelperText>
        If Property Tax, HOA, or Home Insurance are set, they replace Other Fees in the total calculation.
      </HelperText>

      <Divider />
      <FieldLabel style={{ display: 'block', marginBottom: spacing[2] }}>PMI Removal Tracking</FieldLabel>
      <FieldGrid>
        {field('Home Value ($)', 'homeValue', 'number', '0')}
        {field('PMI Drop Target Balance ($)', 'pmiDropBalance', 'number', 'Default: 80% of home value')}
      </FieldGrid>
      <HelperText>
        PMI drop progress will appear in the summary above when Home Value is set.
      </HelperText>
    </Panel>
  );
}
