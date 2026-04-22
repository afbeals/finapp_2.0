'use client';

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { colors, font, radius, spacing } from '@/styles/tokens';

// ─── Accordion shell ──────────────────────────────────────────────────────────

export const AccordionSection = styled.div`
  margin-bottom: ${spacing[2]};
  border-radius: ${radius.lg};
  border: 1px solid ${colors.border};
`;

export const AccordionHeader = styled.button.withConfig({
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

export const AccordionIcon = styled.span`font-size: 20px; flex-shrink: 0;`;

export const AccordionName = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'textColor',
})<{ textColor: string }>`
  flex: 1;
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${({ textColor }) => textColor};
`;

export const AccordionCount = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'textColor',
})<{ textColor: string }>`
  font-size: ${font.size.xs};
  color: ${({ textColor }) => textColor};
  opacity: 0.8;
`;

export const AccordionTotal = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'textColor',
})<{ textColor: string }>`
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${({ textColor }) => textColor};
  margin-right: ${spacing[3]};
`;

export const AccordionChevron = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open: boolean }>`
  font-size: 12px;
  color: ${colors.textMuted};
  transform: ${({ open }) => open ? 'rotate(90deg)' : 'rotate(0deg)'};
  transition: transform 180ms ease;
  flex-shrink: 0;
`;

export const AccordionBody = styled.div`background: ${colors.surface};`;

// ─── Entry table ──────────────────────────────────────────────────────────────

export const EntryTable = styled.table`width: 100%; border-collapse: collapse;`;
export const EntryThead = styled.thead`background: ${colors.bg};`;
export const EntryTh = styled.th`
  padding: 8px ${spacing[4]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-align: left;
  border-bottom: 1px solid ${colors.border};
  white-space: nowrap;
  &:last-child { width: 36px; }
`;
export const EntryTr = styled.tr`
  border-bottom: 1px solid ${colors.border};
  &:last-of-type { border-bottom: none; }
  &:hover { background: ${colors.bg}; }
`;
export const EntryTd = styled.td`
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

export function EditableCell({
  value, onSave, isAmount, readOnly,
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

// ─── Member badge ─────────────────────────────────────────────────────────────

export const MemberBadge = styled.span.withConfig({
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

export const AddEntryRow = styled.tr`
  background: ${colors.surface};
  border-top: 1px dashed ${colors.border};
`;

export const AddEntryInput = styled.input`
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

export const AutocompleteWrapper = styled.div`position: relative; width: 100%;`;

export const AutocompleteDropdown = styled.ul`
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

export const AutocompleteItem = styled.li`
  padding: 7px 12px;
  font-size: ${font.size.sm};
  color: ${colors.textPrimary};
  cursor: pointer;
  &:hover { background: ${colors.bg}; }
`;

// ─── Add entry trigger ────────────────────────────────────────────────────────

export const AddEntryTrigger = styled.button`
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

export const TrashBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 15px;
  color: ${colors.textMuted};
  padding: 2px 4px;
  border-radius: 4px;
  &:hover { color: ${colors.danger}; background: ${colors.dangerLight}; }
`;

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface NewRow { description: string; amount: string }

export function pastelBg(hex: string) { return hex + '18'; }
