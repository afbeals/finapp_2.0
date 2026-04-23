'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select, FormGroup } from '@/components/ui/Input';
import { theme } from '@/styles/tokens';

const { colors, spacing, radius, font } = theme;
import { ACCOUNT_TYPES } from '@/app/(app)/config/configHelpers';
import type { InvestmentAccount, Member } from '@/types/entities';

const RETIREMENT_TYPE_VALUES = ACCOUNT_TYPES.filter((t) => t.value !== 'TAXABLE');

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${spacing[2]};
  padding: ${spacing[5]} ${spacing[6]} ${spacing[6]};
`;

const OwnerChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${spacing[2]};
`;

const OwnerChip = styled.button.withConfig({
  shouldForwardProp: (p) => p !== 'selected' && p !== 'chipColor',
})<{ selected: boolean; chipColor: string }>`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  padding: 6px 12px;
  border-radius: ${radius.full};
  border: 1.5px solid ${({ selected, chipColor }) => (selected ? chipColor : colors.border)};
  background: ${({ selected, chipColor }) => (selected ? chipColor + '22' : colors.surface)};
  color: ${({ selected, chipColor }) => (selected ? chipColor : colors.textPrimary)};
  cursor: pointer;
  &:hover { border-color: ${({ chipColor }) => chipColor}; }
`;

const Body = styled.div`padding: ${spacing[5]} ${spacing[6]} 0;`;

export interface RetirementAccountFormValues {
  name: string;
  type: string;
  institution: string;
  ownerMemberId: number | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: RetirementAccountFormValues) => Promise<void>;
  members: Member[];
  initialValues?: Partial<InvestmentAccount>;
  mode: 'add' | 'edit';
}

export function EditRetirementAccountModal({ isOpen, onClose, onSubmit, members, initialValues, mode }: Props) {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('TRADITIONAL_401K');
  const [institution, setInstitution] = useState('');
  const [ownerMemberId, setOwnerMemberId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialValues?.name ?? '');
    setType(
      initialValues?.type && initialValues.type !== 'TAXABLE'
        ? initialValues.type
        : 'TRADITIONAL_401K',
    );
    setInstitution(initialValues?.institution ?? '');
    setOwnerMemberId(initialValues?.ownerMemberId ?? null);
  }, [isOpen, initialValues]);

  async function handleSubmit() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ name: name.trim(), type, institution: institution.trim(), ownerMemberId });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? 'Add Retirement Account' : 'Edit Retirement Account'}
      width="460px"
    >
      <Body>
        <FormGroup>
          <Label>Account Name</Label>
          <Input
            autoFocus
            placeholder="e.g. Fidelity 401(k)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          />
        </FormGroup>

        <FormGroup>
          <Label>Account Type</Label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {RETIREMENT_TYPE_VALUES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </FormGroup>

        <FormGroup>
          <Label>Institution</Label>
          <Input
            placeholder="e.g. Fidelity"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
          />
        </FormGroup>

        <FormGroup>
          <Label>Owner</Label>
          <OwnerChips>
            <OwnerChip
              type="button"
              selected={ownerMemberId === null}
              chipColor={colors.textMuted}
              onClick={() => setOwnerMemberId(null)}
            >
              Shared
            </OwnerChip>
            {members.map((m) => (
              <OwnerChip
                key={m.id}
                type="button"
                selected={ownerMemberId === m.id}
                chipColor={m.color}
                onClick={() => setOwnerMemberId(m.id)}
              >
                {m.name}
              </OwnerChip>
            ))}
          </OwnerChips>
        </FormGroup>
      </Body>

      <Actions>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving || !name.trim()}>
          {saving ? 'Saving…' : mode === 'add' ? 'Add Account' : 'Save'}
        </Button>
      </Actions>
    </Modal>
  );
}
