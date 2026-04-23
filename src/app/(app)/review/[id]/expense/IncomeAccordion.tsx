'use client';

import React, { useState } from 'react';
import { formatDollars, toCents, toDollars } from '@/lib/money';
import { createIncomeEntry } from '@/lib/api';
import { theme } from '@/styles/tokens';

const { colors, semanticColors } = theme;
import type { Member, IncomeEntry } from '@/types/entities';
import {
  AccordionSection, AccordionHeader, AccordionIcon, AccordionName,
  AccordionCount, AccordionTotal, AccordionChevron, AccordionBody,
  EntryTable, EntryThead, EntryTh, EntryTr, EntryTd,
  EditableCell, MemberBadge, AddEntryRow, AddEntryInput,
  AddEntryTrigger, TrashBtn, AutocompleteInput, type NewRow,
} from './AccordionShared';

const incomeUrl = (q: string) => q.trim() ? `/api/income-items?q=${encodeURIComponent(q)}` : `/api/income-items`;

// ─── Component ────────────────────────────────────────────────────────────────

interface IncomeAccordionProps {
  entries: IncomeEntry[];
  members: Member[];
  reviewId: string;
  readOnly: boolean;
  currentMemberId: number | null;
  onAdd: (e: IncomeEntry) => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, field: 'name' | 'notes' | 'amount', value: string) => void;
}

export const IncomeAccordion = React.memo(function IncomeAccordion({
  entries, members, reviewId, readOnly, currentMemberId, onAdd, onDelete, onUpdate,
}: IncomeAccordionProps) {
  const [open, setOpen] = useState(true);
  const [pendingRows, setPendingRows] = useState<NewRow[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const total = entries.reduce((s, e) => s + e.amount, 0);
  const currentMember = members.find((m) => m.id === currentMemberId);

  function addRow() { setPendingRows((prev) => [...prev, { description: '', amount: '' }]); }
  function updateRow(idx: number, patch: Partial<NewRow>) {
    setPendingRows((prev) => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
  }
  function removeRow(idx: number) { setPendingRows((prev) => prev.filter((_, i) => i !== idx)); }

  async function commitRow(idx: number) {
    const row = pendingRows[idx];
    if (!row || !row.description.trim() || !row.amount) return;
    setSavingIdx(idx);
    const data = await createIncomeEntry(reviewId, {
      memberId: currentMemberId ?? 0,
      name: row.description.trim(),
      amount: toCents(parseFloat(row.amount)),
    }).catch(() => null);
    if (data) { onAdd(data.entry); removeRow(idx); }
    setSavingIdx(null);
  }

  return (
    <AccordionSection>
      <AccordionHeader bg={semanticColors.successBg} onClick={() => setOpen((o) => !o)}>
        <AccordionIcon>💰</AccordionIcon>
        <AccordionName textColor={semanticColors.successTextDark}>INCOME</AccordionName>
        <AccordionCount textColor={semanticColors.successTextDark}>{entries.length} items</AccordionCount>
        <AccordionTotal textColor={semanticColors.successTextDark}>{formatDollars(total)}</AccordionTotal>
        <AccordionChevron open={open}>▶</AccordionChevron>
      </AccordionHeader>

      {open && (
        <AccordionBody>
          <EntryTable>
            <EntryThead>
              <tr>
                <EntryTh>Name</EntryTh>
                <EntryTh>Amount</EntryTh>
                <EntryTh>Entered By</EntryTh>
                <EntryTh>Notes</EntryTh>
                <EntryTh></EntryTh>
              </tr>
            </EntryThead>
            <tbody>
              {entries.map((e) => (
                <EntryTr key={e.id}>
                  <EntryTd><EditableCell value={e.name} readOnly={readOnly} onSave={(v) => onUpdate(e.id, 'name', v)} /></EntryTd>
                  <EntryTd><EditableCell value={toDollars(e.amount).toFixed(2)} isAmount readOnly={readOnly} onSave={(v) => onUpdate(e.id, 'amount', v)} /></EntryTd>
                  <EntryTd><MemberBadge memberColor={e.member.color}>{e.member.name}</MemberBadge></EntryTd>
                  <EntryTd><EditableCell value={e.notes ?? ''} readOnly={readOnly} onSave={(v) => onUpdate(e.id, 'notes', v)} /></EntryTd>
                  <EntryTd>{!readOnly && <TrashBtn onClick={() => onDelete(e.id)}>🗑</TrashBtn>}</EntryTd>
                </EntryTr>
              ))}

              {pendingRows.map((row, idx) => (
                <AddEntryRow key={idx}>
                  <EntryTd>
                    <AutocompleteInput
                      value={row.description}
                      buildUrl={incomeUrl}
                      onChange={(v) => updateRow(idx, { description: v })}
                      onSelect={(v) => updateRow(idx, { description: v })}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitRow(idx); if (e.key === 'Escape') removeRow(idx); }}
                    />
                  </EntryTd>
                  <EntryTd>
                    <AddEntryInput
                      placeholder="0.00"
                      type="number" step="0.01"
                      value={row.amount}
                      onChange={(e) => updateRow(idx, { amount: e.target.value })}
                      onBlur={() => commitRow(idx)}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitRow(idx); if (e.key === 'Escape') removeRow(idx); }}
                    />
                  </EntryTd>
                  <EntryTd>{currentMember && <MemberBadge memberColor={currentMember.color}>{currentMember.name}</MemberBadge>}</EntryTd>
                  <EntryTd><AddEntryInput placeholder="Notes (optional)" disabled /></EntryTd>
                  <EntryTd><TrashBtn onClick={() => removeRow(idx)}>{savingIdx === idx ? '…' : '✕'}</TrashBtn></EntryTd>
                </AddEntryRow>
              ))}
            </tbody>
          </EntryTable>

          {!readOnly && <AddEntryTrigger onClick={addRow}>+ Add Income Entry</AddEntryTrigger>}
        </AccordionBody>
      )}
    </AccordionSection>
  );
});
