'use client';

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { theme } from '@/styles/tokens';

const { colors, font, radius } = theme;

// ─── Styled components ────────────────────────────────────────────────────────

const EditableWrap = styled.div`
  display: inline-flex; align-items: center; gap: 3px; cursor: text;
  &:hover .pencil { opacity: 1; }
`;
const EditSpan = styled.span`
  display: inline-block; max-width: 130px; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap; vertical-align: middle;
`;
const Pencil = styled.span`font-size: 10px; color: ${colors.textMuted}; opacity: 0.35; flex-shrink: 0; transition: opacity 0.1s;`;
const CellInput = styled.input`
  height: 26px; padding: 0 6px; border: 1px solid ${colors.primary};
  border-radius: ${radius.sm}; font-size: ${font.size.sm};
  color: ${colors.textPrimary}; background: ${colors.surface}; width: 120px;
  &:focus { outline: none; }
`;

// ─── EditCell ─────────────────────────────────────────────────────────────────

export function EditCell({ value, onCommit, readOnly, width = 120 }: { value: string; onCommit: (v: string) => void; readOnly: boolean; width?: number }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) ref.current?.select(); }, [editing]);

  if (readOnly) return <EditSpan title={value} style={{ maxWidth: width }}>{value || '—'}</EditSpan>;

  if (editing) {
    return (
      <CellInput
        ref={ref}
        value={draft}
        style={{ width }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); if (draft !== value) onCommit(draft); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { setEditing(false); if (draft !== value) onCommit(draft); }
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
      />
    );
  }

  return (
    <EditableWrap onClick={() => { setDraft(value); setEditing(true); }}>
      <EditSpan title={value} style={{ maxWidth: width }}>{value || <span style={{ fontStyle: 'italic', color: colors.textMuted }}>—</span>}</EditSpan>
      <Pencil className="pencil">✎</Pencil>
    </EditableWrap>
  );
}
