'use client';

import React, { useState } from 'react';
import { formatDollars, toCents } from '@/lib/money';
import { createExpenseEntry } from '@/lib/api';
import { theme } from '@/styles/tokens';

const { colors, font } = theme;
import type { Member, ExpenseCategory as Category, ExpenseEntry } from '@/types/entities';
import {
  AccordionSection, AccordionHeader, AccordionIcon, AccordionName,
  AccordionCount, AccordionTotal, AccordionChevron, AccordionBody,
  EntryTable, EntryThead, EntryTh, EntryTr, EntryTd,
  EditableCell, MemberBadge, AddEntryRow, AddEntryInput,
  AddEntryTrigger, TrashBtn, AutocompleteInput, pastelBg, type NewRow,
} from './AccordionShared';

// ─── Component ────────────────────────────────────────────────────────────────

interface CategoryAccordionProps {
  category: Category;
  entries: ExpenseEntry[];
  reviewId: string;
  readOnly: boolean;
  currentMemberId: number | null;
  currentMember: Member | undefined;
  onAdd: (e: ExpenseEntry) => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, field: 'name' | 'notes' | 'amount', value: string) => void;
}

export const CategoryAccordion = React.memo(function CategoryAccordion({
  category, entries, reviewId, readOnly, currentMemberId, currentMember, onAdd, onDelete, onUpdate,
}: CategoryAccordionProps) {
  const [open, setOpen] = useState(false);
  const [newRow, setNewRow] = useState<NewRow | null>(null);
  const [saving, setSaving] = useState(false);
  const expenseUrl = (q: string) => q.trim()
    ? `/api/expense-items?q=${encodeURIComponent(q)}&categoryId=${category.id}`
    : `/api/expense-items?categoryId=${category.id}`;
  const total = entries.reduce((s, e) => s + e.amount, 0);
  const bg = pastelBg(category.color);

  async function commitNewRow() {
    if (!newRow || !newRow.description.trim() || !newRow.amount) return;
    setSaving(true);
    const data = await createExpenseEntry(reviewId, {
      categoryId: category.id,
      memberId: currentMemberId ?? undefined,
      name: newRow.description.trim(),
      amount: toCents(parseFloat(newRow.amount)),
      date: new Date().toISOString().slice(0, 10),
    }).catch(() => null);
    if (data) onAdd(data.entry);
    setNewRow(null);
    setSaving(false);
  }

  return (
    <AccordionSection>
      <AccordionHeader bg={bg} onClick={() => setOpen((o) => !o)}>
        <AccordionIcon>{category.icon}</AccordionIcon>
        <AccordionName textColor={category.color}>{category.name}</AccordionName>
        <AccordionCount textColor={category.color}>{entries.length} items</AccordionCount>
        <AccordionTotal textColor={category.color}>{formatDollars(total)}</AccordionTotal>
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
                  <EntryTd><EditableCell value={formatDollars(e.amount)} isAmount readOnly={readOnly} onSave={(v) => onUpdate(e.id, 'amount', v)} /></EntryTd>
                  <EntryTd>
                    {e.member
                      ? <MemberBadge memberColor={e.member.color}>{e.member.name}</MemberBadge>
                      : <span style={{ color: colors.textMuted, fontSize: font.size.xs }}>—</span>}
                  </EntryTd>
                  <EntryTd><EditableCell value={e.notes ?? ''} readOnly={readOnly} onSave={(v) => onUpdate(e.id, 'notes', v)} /></EntryTd>
                  <EntryTd>{!readOnly && <TrashBtn onClick={() => onDelete(e.id)}>🗑</TrashBtn>}</EntryTd>
                </EntryTr>
              ))}

              {newRow && (
                <AddEntryRow>
                  <EntryTd>
                    <AutocompleteInput
                      value={newRow.description}
                      buildUrl={expenseUrl}
                      onChange={(v) => setNewRow((r) => r && ({ ...r, description: v }))}
                      onSelect={(v) => setNewRow((r) => r && ({ ...r, description: v }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitNewRow(); if (e.key === 'Escape') setNewRow(null); }}
                    />
                  </EntryTd>
                  <EntryTd>
                    <AddEntryInput
                      placeholder="0.00"
                      type="number" step="0.01"
                      value={newRow.amount}
                      onChange={(e) => setNewRow((r) => r && ({ ...r, amount: e.target.value }))}
                      onBlur={commitNewRow}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitNewRow(); if (e.key === 'Escape') setNewRow(null); }}
                    />
                  </EntryTd>
                  <EntryTd>{currentMember && <MemberBadge memberColor={currentMember.color}>{currentMember.name}</MemberBadge>}</EntryTd>
                  <EntryTd><AddEntryInput placeholder="Notes (optional)" disabled /></EntryTd>
                  <EntryTd><TrashBtn onClick={() => setNewRow(null)}>✕</TrashBtn></EntryTd>
                </AddEntryRow>
              )}
            </tbody>
          </EntryTable>

          {!readOnly && !newRow && (
            <AddEntryTrigger onClick={() => setNewRow({ description: '', amount: '' })}>
              {saving ? '…' : `+ Add ${category.name} Entry`}
            </AddEntryTrigger>
          )}
        </AccordionBody>
      )}
    </AccordionSection>
  );
});
