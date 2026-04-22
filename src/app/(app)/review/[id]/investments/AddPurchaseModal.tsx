'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatDollars, toCents } from '@/lib/money';
import { colors, font, radius, spacing } from '@/styles/tokens';
import { apiPost, getMarketPrices } from '@/lib/api';
import type { Purchase, InvestmentAccount, InvestmentCategory } from '@/types/entities';
import { AccountTypeLabel } from './investmentHelpers';

// ─── Styled components ────────────────────────────────────────────────────────

const FieldLabel = styled.label`
  display: block;
  font-size: 10px;
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: ${spacing[1]};
`;

const FieldInput = styled(Input)`width: 100%; margin-bottom: ${spacing[3]};`;

const FieldSelect = styled.select`
  width: 100%;
  height: 38px;
  padding: 0 10px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  font-size: ${font.size.sm};
  color: ${colors.textPrimary};
  background: ${colors.surface};
  margin-bottom: ${spacing[3]};
  &:focus { outline: none; border-color: ${colors.primary}; }
`;

const TotalLine = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: ${colors.bg};
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  margin-bottom: 18px;
`;

const ModalFooter = styled.div`display: flex; justify-content: flex-end; gap: 10px;`;

// ─── Add Purchase Modal ───────────────────────────────────────────────────────

type InvCategoryDef = InvestmentCategory;

export function AddPurchaseModal({
  accounts,
  categories,
  defaultAccountId,
  onClose,
  onAdded,
}: {
  accounts: InvestmentAccount[];
  categories: InvCategoryDef[];
  defaultAccountId?: number;
  onClose: () => void;
  onAdded: (p: Purchase) => void;
}) {
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [nameFetching, setNameFetching] = useState(false);
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState(String(defaultAccountId ?? accounts[0]?.id ?? ''));
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [sharePrice, setSharePrice] = useState('');
  const [shares, setShares] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleTickerBlur() {
    const t = ticker.trim().toUpperCase();
    if (!t || name) return;
    setNameFetching(true);
    try {
      const data = await getMarketPrices([t]);
      const fetched = data.names?.[t];
      if (fetched && !name) setName(fetched);
    } finally {
      setNameFetching(false);
    }
  }

  const totalCost = (parseFloat(sharePrice) || 0) * (parseFloat(shares) || 0);

  async function handleSubmit() {
    if (!ticker.trim() || !accountId || !sharePrice || !shares || !purchaseDate) return;
    setSaving(true);
    const data = await apiPost<{ purchase: Purchase }>('/api/holdings', {
      accountId: Number(accountId),
      ticker: ticker.trim().toUpperCase(),
      name: name.trim() || ticker.trim().toUpperCase(),
      category: category.trim(),
      purchaseDate,
      pricePerShare: toCents(parseFloat(sharePrice) || 0),
      shares: parseFloat(shares),
    }).catch(() => null);
    if (data) {
      onAdded(data.purchase);
      onClose();
    }
    setSaving(false);
  }

  return (
    <Modal isOpen onClose={onClose} title="Add New Purchase" width="460px"
      footer={
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving || !ticker || !accountId || !sharePrice || !shares}>
            {saving ? 'Adding…' : 'Add Purchase'}
          </Button>
        </ModalFooter>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <FieldLabel>Ticker Symbol *</FieldLabel>
          <FieldInput
            autoFocus
            placeholder="e.g. AAPL"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onBlur={handleTickerBlur}
          />
        </div>
        <div>
          <FieldLabel>Category</FieldLabel>
          <FieldSelect value={category} onChange={(e) => setCategory(e.target.value)} style={{ marginBottom: 12 }}>
            <option value="">— None —</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </FieldSelect>
        </div>
      </div>

      <FieldLabel>Company / Fund Name {nameFetching && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— looking up…</span>}</FieldLabel>
      <FieldInput placeholder={nameFetching ? 'Fetching from ticker…' : 'Auto-filled from ticker or enter manually'} value={name} onChange={(e) => setName(e.target.value)} />

      <FieldLabel>Account *</FieldLabel>
      <FieldSelect value={accountId} onChange={(e) => setAccountId(e.target.value)}>
        {accounts.map((a) => (
          <option key={a.id} value={String(a.id)}>
            {a.name} ({AccountTypeLabel[a.type] ?? a.type})
          </option>
        ))}
      </FieldSelect>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <FieldLabel>Purchase Date *</FieldLabel>
          <FieldInput type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Price per Share *</FieldLabel>
          <FieldInput type="number" step="0.01" placeholder="$0.00" value={sharePrice} onChange={(e) => setSharePrice(e.target.value)} />
        </div>
        <div>
          <FieldLabel># of Shares *</FieldLabel>
          <FieldInput type="number" step="0.0001" placeholder="0.00" value={shares} onChange={(e) => setShares(e.target.value)} />
        </div>
      </div>

      <TotalLine>
        <span style={{ fontSize: font.size.sm, color: colors.textMuted }}>Total Cost:</span>
        <span style={{ fontSize: font.size.base, fontWeight: 700, color: colors.textPrimary }}>
          {formatDollars(toCents(totalCost))}
        </span>
      </TotalLine>

      <p style={{ fontSize: 11, color: colors.textMuted, marginTop: 10, marginBottom: 0 }}>
        * Required. This purchase lot will be combined with existing lots for the same ticker.
      </p>
    </Modal>
  );
}
