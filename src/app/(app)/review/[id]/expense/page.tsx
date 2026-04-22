'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import styled from 'styled-components';
import { StepShell } from '@/components/review/StepShell';
import { useStepNav } from '@/lib/useStepNav';
import { useReviewStore, useSessionStore } from '@/lib/store';
import { formatDollars, toCents } from '@/lib/money';
import { colors, font, radius, spacing } from '@/styles/tokens';

interface Member { id: number; name: string; color: string }
interface Category { id: number; name: string; icon: string; color: string }
interface IncomeEntry { id: number; name: string; notes?: string | null; amount: number; member: Member }
interface ExpenseEntry { id: number; name: string; notes?: string | null; amount: number; date: string; category: Category; member: Member | null }

// ─── Group separator ──────────────────────────────────────────────────────────

const GroupSeparator = styled.div`
  height: 1px;
  background: ${colors.border};
  margin: ${spacing[4]} 0;
  opacity: 0.6;
`;

// ─── Accordion shell ──────────────────────────────────────────────────────────

const AccordionSection = styled.div`
  margin-bottom: ${spacing[2]};
  border-radius: ${radius.lg};
  border: 1px solid ${colors.border};
`;

const AccordionHeader = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'bg',
})<{ bg: string }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${spacing[3]};
  padding: 14px ${spacing[5]};
  background: ${({ bg }) => bg};
  border: none;
  cursor: pointer;
  text-align: left;
  border-radius: ${radius.lg} ${radius.lg} 0 0;
`;

const AccordionIcon = styled.span`font-size: 20px; flex-shrink: 0;`;

const AccordionName = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'textColor',
})<{ textColor: string }>`
  flex: 1;
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${({ textColor }) => textColor};
`;

const AccordionCount = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'textColor',
})<{ textColor: string }>`
  font-size: ${font.size.xs};
  color: ${({ textColor }) => textColor};
  opacity: 0.8;
`;

const AccordionTotal = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'textColor',
})<{ textColor: string }>`
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${({ textColor }) => textColor};
  margin-right: ${spacing[3]};
`;

const AccordionChevron = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open: boolean }>`
  font-size: 12px;
  color: ${colors.textMuted};
  transform: ${({ open }) => open ? 'rotate(90deg)' : 'rotate(0deg)'};
  transition: transform 180ms ease;
  flex-shrink: 0;
`;

const AccordionBody = styled.div`
  background: ${colors.surface};
`;

// ─── Entry table ──────────────────────────────────────────────────────────────

const EntryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const EntryThead = styled.thead`
  background: ${colors.bg};
`;

const EntryTh = styled.th`
  padding: 8px ${spacing[4]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-align: left;
  border-bottom: 1px solid ${colors.border};
  white-space: nowrap;
  &:last-child { width: 36px; }
`;

const EntryTr = styled.tr`
  border-bottom: 1px solid ${colors.border};
  &:last-of-type { border-bottom: none; }
  &:hover { background: ${colors.bg}; }
`;

const EntryTd = styled.td`
  padding: 10px ${spacing[4]};
  font-size: ${font.size.sm};
  color: ${colors.textPrimary};
  vertical-align: middle;
`;

// ─── Inline edit cell ─────────────────────────────────────────────────────────

const EditableSpan = styled.span`
  cursor: text;
  border-radius: 4px;
  padding: 2px 4px;
  &:hover { background: ${colors.bg}; outline: 1px solid ${colors.border}; }
`;

const InlineInput = styled.input`
  font-size: ${font.size.sm};
  font-family: inherit;
  color: ${colors.textPrimary};
  background: ${colors.surface};
  border: 1px solid ${colors.primary};
  border-radius: 4px;
  padding: 2px 6px;
  width: 100%;
  outline: none;
  &:focus { box-shadow: 0 0 0 2px ${colors.primaryLight}; }
`;

// ─── Member badge ─────────────────────────────────────────────────────────────

const MemberBadge = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'memberColor',
})<{ memberColor: string }>`
  display: inline-block;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  padding: 2px 8px;
  border-radius: ${radius.full};
  background: ${({ memberColor }) => memberColor}22;
  color: ${({ memberColor }) => memberColor};
`;

// ─── Add row ──────────────────────────────────────────────────────────────────

const AddEntryRow = styled.tr`
  background: ${colors.surface};
  border-top: 1px dashed ${colors.border};
`;

const AddEntryInput = styled.input`
  font-size: ${font.size.sm};
  font-family: inherit;
  color: ${colors.textPrimary};
  background: transparent;
  border: none;
  outline: none;
  width: 100%;
  padding: 0;
  &::placeholder { color: ${colors.textDisabled}; }
`;

// ─── Autocomplete ─────────────────────────────────────────────────────────────

const AutocompleteWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const AutocompleteDropdown = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  min-width: 200px;
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  z-index: 50;
  list-style: none;
  padding: 4px 0;
  margin: 0;
`;

const AutocompleteItem = styled.li`
  padding: 7px 12px;
  font-size: ${font.size.sm};
  color: ${colors.textPrimary};
  cursor: pointer;
  &:hover { background: ${colors.bg}; }
`;

// ─── "Add new entry" trigger ──────────────────────────────────────────────────

const AddEntryTrigger = styled.button`
  width: 100%;
  padding: 10px ${spacing[4]};
  border: none;
  border-top: 1px dashed ${colors.border};
  background: transparent;
  color: ${colors.primary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 6px;
  &:hover { background: ${colors.primaryLight}; }
`;

// ─── Delete button ────────────────────────────────────────────────────────────

const TrashBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 15px;
  color: ${colors.textMuted};
  padding: 2px 4px;
  border-radius: 4px;
  &:hover { color: ${colors.danger}; background: ${colors.dangerLight}; }
`;

// ─── Summary footer ───────────────────────────────────────────────────────────

const SummaryBar = styled.div.withConfig({
  shouldForwardProp: (prop) => !['bg', 'borderColor'].includes(prop),
})<{ bg: string; borderColor: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px ${spacing[5]};
  background: ${({ bg }) => bg};
  border: 1.5px solid ${({ borderColor }) => borderColor};
  border-radius: ${radius.lg};
  margin-bottom: ${spacing[2]};
`;

const SummaryLabel = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'textColor',
})<{ textColor: string }>`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${({ textColor }) => textColor};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SummaryValue = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'textColor',
})<{ textColor: string }>`
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  color: ${({ textColor }) => textColor};
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pastelBg(hex: string) {
  return hex + '18';
}
function darken(hex: string) {
  return hex;
}

// ─── Inline-editable cell ─────────────────────────────────────────────────────

function EditableCell({
  value,
  onSave,
  isAmount,
  readOnly,
}: {
  value: string;
  onSave: (v: string) => void;
  isAmount?: boolean;
  readOnly: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    setEditing(false);
    if (draft !== value) onSave(draft);
  }

  if (readOnly) return <span>{value || <span style={{ color: colors.textMuted }}>—</span>}</span>;

  return editing ? (
    <InlineInput
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
      type={isAmount ? 'number' : 'text'}
      step={isAmount ? '0.01' : undefined}
    />
  ) : (
    <EditableSpan onClick={() => { setDraft(value); setEditing(true); }}>
      {value || <span style={{ color: colors.textMuted, fontStyle: 'italic' }}>Add note…</span>}
      <span style={{ fontSize: 10, color: colors.textMuted, opacity: 0.5, marginLeft: 3 }}>✎</span>
    </EditableSpan>
  );
}

// ─── Name autocomplete input ──────────────────────────────────────────────────

function NameAutocompleteInput({
  value,
  categoryId,
  onChange,
  onSelect,
  onKeyDown,
  placeholder,
}: {
  value: string;
  categoryId: number;
  onChange: (v: string) => void;
  onSelect: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchSuggestions(q: string) {
    const url = q.trim()
      ? `/api/expense-items?q=${encodeURIComponent(q)}&categoryId=${categoryId}`
      : `/api/expense-items?categoryId=${categoryId}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setSuggestions(data.names ?? []);
      setOpen((data.names ?? []).length > 0);
    }
  }

  // Fetch suggestions immediately on mount (autoFocus doesn't reliably fire onFocus)
  React.useEffect(() => {
    fetchSuggestions(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    onChange(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 150);
  }

  function handleFocus() {
    fetchSuggestions(value);
  }

  function pick(name: string) {
    onSelect(name);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <AutocompleteWrapper>
      <AddEntryInput
        autoFocus
        placeholder={placeholder ?? 'Name'}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); onKeyDown(e); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <AutocompleteDropdown>
          {suggestions.map((s) => (
            <AutocompleteItem key={s} onMouseDown={() => pick(s)}>{s}</AutocompleteItem>
          ))}
        </AutocompleteDropdown>
      )}
    </AutocompleteWrapper>
  );
}

// ─── Income autocomplete input ────────────────────────────────────────────────

function IncomeNameAutocompleteInput({
  value,
  onChange,
  onSelect,
  onKeyDown,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchSuggestions(q: string) {
    const url = q.trim()
      ? `/api/income-items?q=${encodeURIComponent(q)}`
      : `/api/income-items`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setSuggestions(data.names ?? []);
      setOpen((data.names ?? []).length > 0);
    }
  }

  React.useEffect(() => {
    fetchSuggestions(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    onChange(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 150);
  }

  function pick(name: string) {
    onSelect(name);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <AutocompleteWrapper>
      <AddEntryInput
        autoFocus
        placeholder={placeholder ?? 'Name'}
        value={value}
        onChange={handleChange}
        onFocus={() => fetchSuggestions(value)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); onKeyDown(e); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <AutocompleteDropdown>
          {suggestions.map((s) => (
            <AutocompleteItem key={s} onMouseDown={() => pick(s)}>{s}</AutocompleteItem>
          ))}
        </AutocompleteDropdown>
      )}
    </AutocompleteWrapper>
  );
}

// ─── New-row state ────────────────────────────────────────────────────────────

interface NewRow { description: string; amount: string }

// ─── Income accordion ─────────────────────────────────────────────────────────

function IncomeAccordion({
  entries,
  members,
  reviewId,
  readOnly,
  currentMemberId,
  onAdd,
  onDelete,
  onUpdate,
}: {
  entries: IncomeEntry[];
  members: Member[];
  reviewId: string;
  readOnly: boolean;
  currentMemberId: number | null;
  onAdd: (e: IncomeEntry) => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, field: 'name' | 'notes' | 'amount', value: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [pendingRows, setPendingRows] = useState<NewRow[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const total = entries.reduce((s, e) => s + e.amount, 0);
  const currentMember = members.find((m) => m.id === currentMemberId);

  function addRow() {
    setPendingRows((prev) => [...prev, { description: '', amount: '' }]);
  }

  function updateRow(idx: number, patch: Partial<NewRow>) {
    setPendingRows((prev) => prev.map((r, i) => i === idx ? { ...r, ...patch } : r));
  }

  function removeRow(idx: number) {
    setPendingRows((prev) => prev.filter((_, i) => i !== idx));
  }

  async function commitRow(idx: number) {
    const row = pendingRows[idx];
    if (!row || !row.description.trim() || !row.amount) return;
    setSavingIdx(idx);
    const res = await fetch(`/api/reviews/${reviewId}/income`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberId: currentMemberId,
        name: row.description.trim(),
        amount: toCents(parseFloat(row.amount)),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      onAdd(data.entry);
      removeRow(idx);
    }
    setSavingIdx(null);
  }

  return (
    <AccordionSection>
      <AccordionHeader bg="#F0FDF4" onClick={() => setOpen((o) => !o)}>
        <AccordionIcon>💰</AccordionIcon>
        <AccordionName textColor="#166534">INCOME</AccordionName>
        <AccordionCount textColor="#166534">{entries.length} items</AccordionCount>
        <AccordionTotal textColor="#166534">{formatDollars(total)}</AccordionTotal>
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
                  <EntryTd>
                    <EditableCell value={e.name} readOnly={readOnly} onSave={(v) => onUpdate(e.id, 'name', v)} />
                  </EntryTd>
                  <EntryTd>
                    <EditableCell value={formatDollars(e.amount)} isAmount readOnly={readOnly} onSave={(v) => onUpdate(e.id, 'amount', v)} />
                  </EntryTd>
                  <EntryTd>
                    <MemberBadge memberColor={e.member.color}>{e.member.name}</MemberBadge>
                  </EntryTd>
                  <EntryTd>
                    <EditableCell value={e.notes ?? ''} readOnly={readOnly} onSave={(v) => onUpdate(e.id, 'notes', v)} />
                  </EntryTd>
                  <EntryTd>
                    {!readOnly && <TrashBtn onClick={() => onDelete(e.id)}>🗑</TrashBtn>}
                  </EntryTd>
                </EntryTr>
              ))}

              {pendingRows.map((row, idx) => (
                <AddEntryRow key={idx}>
                  <EntryTd>
                    <IncomeNameAutocompleteInput
                      value={row.description}
                      onChange={(v) => updateRow(idx, { description: v })}
                      onSelect={(v) => updateRow(idx, { description: v })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRow(idx);
                        if (e.key === 'Escape') removeRow(idx);
                      }}
                    />
                  </EntryTd>
                  <EntryTd>
                    <AddEntryInput
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      value={row.amount}
                      onChange={(e) => updateRow(idx, { amount: e.target.value })}
                      onBlur={() => commitRow(idx)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitRow(idx);
                        if (e.key === 'Escape') removeRow(idx);
                      }}
                    />
                  </EntryTd>
                  <EntryTd>
                    {currentMember && <MemberBadge memberColor={currentMember.color}>{currentMember.name}</MemberBadge>}
                  </EntryTd>
                  <EntryTd>
                    <AddEntryInput placeholder="Notes (optional)" disabled />
                  </EntryTd>
                  <EntryTd>
                    <TrashBtn onClick={() => removeRow(idx)}>
                      {savingIdx === idx ? '…' : '✕'}
                    </TrashBtn>
                  </EntryTd>
                </AddEntryRow>
              ))}
            </tbody>
          </EntryTable>

          {!readOnly && (
            <AddEntryTrigger onClick={addRow}>+ Add Income Entry</AddEntryTrigger>
          )}
        </AccordionBody>
      )}
    </AccordionSection>
  );
}

// ─── Expense category accordion ───────────────────────────────────────────────

function CategoryAccordion({
  category,
  entries,
  reviewId,
  readOnly,
  currentMemberId,
  currentMember,
  onAdd,
  onDelete,
  onUpdate,
}: {
  category: Category;
  entries: ExpenseEntry[];
  reviewId: string;
  readOnly: boolean;
  currentMemberId: number | null;
  currentMember: Member | undefined;
  onAdd: (e: ExpenseEntry) => void;
  onDelete: (id: number) => void;
  onUpdate: (id: number, field: 'name' | 'notes' | 'amount', value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [newRow, setNewRow] = useState<NewRow | null>(null);
  const [saving, setSaving] = useState(false);
  const total = entries.reduce((s, e) => s + e.amount, 0);
  const bg = pastelBg(category.color);
  const textColor = darken(category.color);

  async function commitNewRow() {
    if (!newRow || !newRow.description.trim() || !newRow.amount) return;
    setSaving(true);
    const res = await fetch(`/api/reviews/${reviewId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoryId: category.id,
        memberId: currentMemberId,
        name: newRow.description.trim(),
        amount: toCents(parseFloat(newRow.amount)),
        date: new Date().toISOString().slice(0, 10),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      onAdd(data.entry);
    }
    setNewRow(null);
    setSaving(false);
  }

  return (
    <AccordionSection>
      <AccordionHeader bg={bg} onClick={() => setOpen((o) => !o)}>
        <AccordionIcon>{category.icon}</AccordionIcon>
        <AccordionName textColor={textColor}>{category.name}</AccordionName>
        <AccordionCount textColor={textColor}>{entries.length} items</AccordionCount>
        <AccordionTotal textColor={textColor}>{formatDollars(total)}</AccordionTotal>
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
                  <EntryTd>
                    <EditableCell
                      value={e.name}
                      readOnly={readOnly}
                      onSave={(v) => onUpdate(e.id, 'name', v)}
                    />
                  </EntryTd>
                  <EntryTd>
                    <EditableCell
                      value={formatDollars(e.amount)}
                      isAmount
                      readOnly={readOnly}
                      onSave={(v) => onUpdate(e.id, 'amount', v)}
                    />
                  </EntryTd>
                  <EntryTd>
                    {e.member
                      ? <MemberBadge memberColor={e.member.color}>{e.member.name}</MemberBadge>
                      : <span style={{ color: colors.textMuted, fontSize: font.size.xs }}>—</span>}
                  </EntryTd>
                  <EntryTd>
                    <EditableCell
                      value={e.notes ?? ''}
                      readOnly={readOnly}
                      onSave={(v) => onUpdate(e.id, 'notes', v)}
                    />
                  </EntryTd>
                  <EntryTd>
                    {!readOnly && <TrashBtn onClick={() => onDelete(e.id)}>🗑</TrashBtn>}
                  </EntryTd>
                </EntryTr>
              ))}

              {newRow && (
                <AddEntryRow>
                  <EntryTd>
                    <NameAutocompleteInput
                      value={newRow.description}
                      categoryId={category.id}
                      onChange={(v) => setNewRow((r) => r && ({ ...r, description: v }))}
                      onSelect={(v) => setNewRow((r) => r && ({ ...r, description: v }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitNewRow(); if (e.key === 'Escape') setNewRow(null); }}
                    />
                  </EntryTd>
                  <EntryTd>
                    <AddEntryInput
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                      value={newRow.amount}
                      onChange={(e) => setNewRow((r) => r && ({ ...r, amount: e.target.value }))}
                      onBlur={commitNewRow}
                      onKeyDown={(e) => { if (e.key === 'Enter') commitNewRow(); if (e.key === 'Escape') setNewRow(null); }}
                    />
                  </EntryTd>
                  <EntryTd>
                    {currentMember && <MemberBadge memberColor={currentMember.color}>{currentMember.name}</MemberBadge>}
                  </EntryTd>
                  <EntryTd>
                    <AddEntryInput placeholder="Notes (optional)" disabled />
                  </EntryTd>
                  <EntryTd>
                    <TrashBtn onClick={() => setNewRow(null)}>✕</TrashBtn>
                  </EntryTd>
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
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExpensePage() {
  const params = useParams();
  const reviewId = params.id as string;
  const { state: reviewState } = useReviewStore();
  const { state: sessionState } = useSessionStore();
  const { goNext, goBack, goSkip, saving } = useStepNav('expense');
  const readOnly = reviewState.activeReview?.status === 'COMPLETE' && !reviewState.isEditMode;
  const currentMemberId = sessionState.memberId;
  const currentMember = sessionState.members.find((m) => m.id === currentMemberId);

  const [income, setIncome] = useState<IncomeEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/reviews/${reviewId}/income`).then((r) => r.json()),
      fetch(`/api/reviews/${reviewId}/expenses`).then((r) => r.json()),
    ]).then(([incomeData, expData]) => {
      setIncome(incomeData.entries ?? []);
      setExpenses(expData.entries ?? []);
      setCategories(expData.categories ?? []);
    }).finally(() => setLoading(false));
  }, [reviewId]);

  async function handleUpdateIncome(id: number, field: 'name' | 'notes' | 'amount', value: string) {
    const payload = field === 'amount'
      ? { amount: toCents(parseFloat(value)) }
      : { [field]: value };
    const res = await fetch(`/api/reviews/${reviewId}/income/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      setIncome((prev) => prev.map((e) => e.id === id ? { ...e, ...data.entry } : e));
    }
  }

  async function handleUpdateExpense(id: number, field: 'name' | 'notes' | 'amount', value: string) {
    const payload = field === 'amount'
      ? { amount: toCents(parseFloat(value)) }
      : { [field]: value };
    const res = await fetch(`/api/reviews/${reviewId}/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = await res.json();
      setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, ...data.entry } : e));
    }
  }

  const totalIncome = income.reduce((s, e) => s + e.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netSavings = totalIncome - totalExpenses;

  if (loading) return <p style={{ color: colors.textMuted }}>Loading…</p>;

  return (
    <StepShell
      title="Income / Expense Entry"
      subtitle="Enter your income and expenses for the month"
      stepName="Expense Entry"
      onBack={goBack}
      onSkip={goSkip}
      onNext={goNext}
      saving={saving}
      readOnly={readOnly}
      hideFooter
    >
      {/* Income */}
      <IncomeAccordion
        entries={income}
        members={sessionState.members}
        reviewId={reviewId}
        readOnly={readOnly}
        currentMemberId={currentMemberId}
        onAdd={(e) => setIncome((prev) => [...prev, e])}
        onDelete={async (id) => {
          await fetch(`/api/reviews/${reviewId}/income/${id}`, { method: 'DELETE' });
          setIncome((prev) => prev.filter((e) => e.id !== id));
        }}
        onUpdate={handleUpdateIncome}
      />

      <GroupSeparator />

      {/* Expense categories */}
      {categories.map((cat) => (
        <CategoryAccordion
          key={cat.id}
          category={cat}
          entries={expenses.filter((e) => e.category.id === cat.id)}
          reviewId={reviewId}
          readOnly={readOnly}
          currentMemberId={currentMemberId}
          currentMember={currentMember}
          onAdd={(e) => setExpenses((prev) => [...prev, e])}
          onDelete={async (id) => {
            await fetch(`/api/reviews/${reviewId}/expenses/${id}`, { method: 'DELETE' });
            setExpenses((prev) => prev.filter((e) => e.id !== id));
          }}
          onUpdate={handleUpdateExpense}
        />
      ))}

      {/* Summary footer */}
      <div style={{ marginTop: spacing[6] }}>
        <SummaryBar bg="#0F172A" borderColor="#0F172A">
          <SummaryLabel textColor="#fff">💸 TOTAL EXPENSES</SummaryLabel>
          <SummaryValue textColor="#fff">{formatDollars(totalExpenses)}</SummaryValue>
        </SummaryBar>
        <SummaryBar bg="#F0FDF4" borderColor={colors.success}>
          <SummaryLabel textColor="#166534">💰 INCOME SUMMARY</SummaryLabel>
          <SummaryValue textColor="#166534">{formatDollars(totalIncome)}</SummaryValue>
        </SummaryBar>
        <SummaryBar bg="#EFF6FF" borderColor={colors.primary}>
          <SummaryLabel textColor="#1E40AF">📈 NET SAVINGS</SummaryLabel>
          <SummaryValue textColor={netSavings >= 0 ? '#166534' : colors.danger}>{formatDollars(netSavings)}</SummaryValue>
        </SummaryBar>
      </div>
    </StepShell>
  );
}
