'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select, FormGroup } from '@/components/ui/Input';
import { theme } from '@/styles/tokens';
import { Actions, OwnerChips, OwnerChip, Body } from './EditRetirementAccountModal.styles';
import { ACCOUNT_TYPES } from '@/app/(app)/config/configHelpers';
import type { InvestmentAccount, Member } from '@/types/entities';

const { colors } = theme;

const RETIREMENT_TYPE_VALUES = ACCOUNT_TYPES.filter((t) => t.value !== 'TAXABLE');

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
  /** Type to preselect when opening in 'add' mode (e.g. from a section-specific "+ Add" button) */
  defaultType?: string;
}

export function EditRetirementAccountModal({ isOpen, onClose, onSubmit, members, initialValues, mode, defaultType }: Props) {
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
        : defaultType ?? 'TRADITIONAL_401K',
    );
    setInstitution(initialValues?.institution ?? '');
    setOwnerMemberId(initialValues?.ownerMemberId ?? null);
  }, [isOpen, initialValues, defaultType]);

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
