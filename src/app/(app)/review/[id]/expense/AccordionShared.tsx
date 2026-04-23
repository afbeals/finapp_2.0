'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, radius, shadow, spacing, transition } = theme;
import { apiGet } from '@/lib/api';
import { InlineEdit } from '@/components/shared/InlineEdit';
import { formatDollars, toCents, toNumber } from '@/lib/money';
import { DTable, DThead, DTh, DTr, DTd } from '@/components/shared/DataTable/parts';

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

export const AccordionIcon = styled.span`font-size: ${font.size['2xl']}; flex-shrink: 0;`;

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
  transition: transform ${transition.moderate};
  flex-shrink: 0;
`;

export const AccordionBody = styled.div`background: ${colors.surface};`;

// ─── Entry table — canonical DataTable parts re-exported under accordion names ──

export { DTable as EntryTable, DThead as EntryThead, DTh as EntryTh, DTr as EntryTr, DTd as EntryTd };

// ─── Editable cell — delegates to shared InlineEdit ───────────────────────────

export function EditableCell({
  value, onSave, isAmount, readOnly,
}: {
  value: string;
  onSave: (v: string) => void;
  isAmount?: boolean;
  readOnly: boolean;
}) {
  if (isAmount) {
    return (
      <InlineEdit
        value={value}
        readOnly={readOnly}
        type="currency"
        align="left"
        formatter={(v) => formatDollars(toCents(toNumber(v)))}
        parser={(v) => String(toNumber(v))}
        onSave={onSave}
      />
    );
  }
  return (
    <InlineEdit
      value={value}
      readOnly={readOnly}
      type="text"
      align="left"
      placeholder="Add note…"
      onSave={onSave}
    />
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
  border-radius: ${radius.sm};
  box-shadow: ${shadow.md};
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
  font-size: ${font.size.md};
  color: ${colors.textMuted};
  padding: 2px 4px;
  border-radius: ${radius.sm};
  &:hover { color: ${colors.danger}; background: ${colors.dangerLight}; }
`;

// ─── Shared autocomplete input ────────────────────────────────────────────────

interface AutocompleteInputProps {
  value: string;
  buildUrl: (q: string) => string;
  onChange: (v: string) => void;
  onSelect: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export function AutocompleteInput({
  value, buildUrl, onChange, onSelect, onKeyDown, placeholder,
}: AutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchSuggestions(q: string) {
    const data = await apiGet<{ names: string[] }>(buildUrl(q)).catch(() => null);
    if (data) { setSuggestions(data.names ?? []); setOpen((data.names ?? []).length > 0); }
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

  function pick(name: string) { onSelect(name); setSuggestions([]); setOpen(false); }

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
          {suggestions.map((s) => <AutocompleteItem key={s} onMouseDown={() => pick(s)}>{s}</AutocompleteItem>)}
        </AutocompleteDropdown>
      )}
    </AutocompleteWrapper>
  );
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface NewRow { description: string; amount: string }

export function pastelBg(hex: string) { return hex + '18'; }
