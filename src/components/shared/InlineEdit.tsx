'use client';

import React, { useEffect, useRef, useState } from 'react';
import { theme } from '@/styles/tokens';
import { EditInput, DisplaySpan, Pencil, DeltaButton, DeltaInput } from './InlineEdit.styles';

const { colors } = theme;

interface InlineEditProps {
  value: string;
  onSave: (v: string) => void;
  readOnly?: boolean;
  type?: 'text' | 'number' | 'currency';
  width?: number;
  color?: string;
  align?: 'left' | 'right';
  /** Custom format function for display value */
  formatter?: (v: string) => string;
  /** Custom parse function applied before calling onSave */
  parser?: (v: string) => string;
  placeholder?: string;
  className?: string;
  /** Show a "±" affordance that adds/subtracts a typed amount from the current value, instead of retyping it */
  allowDelta?: boolean;
}

export function InlineEdit({
  value,
  onSave,
  readOnly = false,
  type = 'number',
  width,
  color,
  align = type === 'text' ? 'left' : 'right',
  formatter,
  parser,
  placeholder,
  className,
  allowDelta = false,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [deltaMode, setDeltaMode] = useState(false);
  const [deltaDraft, setDeltaDraft] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  const deltaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) { setDraft(value); ref.current?.select(); }
  }, [editing, value]);

  useEffect(() => {
    if (deltaMode) deltaRef.current?.focus();
  }, [deltaMode]);

  const commitValue = (raw: string) => {
    const parsed = parser ? parser(raw) : raw;
    if (parsed !== value) onSave(parsed);
  };

  const commit = (raw: string) => {
    commitValue(raw);
    setEditing(false);
  };

  const commitDelta = () => {
    const delta = parseFloat(deltaDraft);
    if (deltaDraft.trim() !== '' && !Number.isNaN(delta)) {
      const newTotal = (parseFloat(value) || 0) + delta;
      commitValue(String(newTotal));
    }
    setDeltaMode(false);
    setDeltaDraft('');
  };

  const displayValue = formatter ? formatter(value) : value;

  if (readOnly) {
    return (
      <span className={className} style={{ color: color ?? colors.textPrimary }}>
        {displayValue}
      </span>
    );
  }

  if (editing) {
    return (
      <EditInput
        ref={ref}
        type={type === 'currency' ? 'number' : type}
        step={type !== 'text' ? '0.01' : undefined}
        value={draft}
        align={align}
        style={{ width: width ?? (type === 'text' ? 140 : 90), color: color ?? colors.textPrimary }}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit(draft);
          if (e.key === 'Escape') setEditing(false);
        }}
        className={className}
      />
    );
  }

  if (deltaMode) {
    return (
      <DeltaInput
        ref={deltaRef}
        type="number"
        step="0.01"
        placeholder="+/- amount"
        value={deltaDraft}
        onChange={(e) => setDeltaDraft(e.target.value)}
        onBlur={commitDelta}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitDelta();
          if (e.key === 'Escape') { setDeltaMode(false); setDeltaDraft(''); }
        }}
        className={className}
      />
    );
  }

  return (
    <DisplaySpan
      onClick={() => setEditing(true)}
      title="Click to edit"
      style={{ color: color ?? colors.textPrimary }}
      className={className}
    >
      {displayValue}
      <Pencil className="pencil">✎</Pencil>
      {allowDelta && (
        <DeltaButton
          title="Add or subtract an amount"
          onClick={(e) => { e.stopPropagation(); setDeltaMode(true); }}
        >
          ±
        </DeltaButton>
      )}
    </DisplaySpan>
  );
}
