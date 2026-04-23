'use client';

import React, { useState } from 'react';
import { formatDollars, toCents, toDollars } from '@/lib/money';
import { theme } from '@/styles/tokens';

const { colors, semanticColors, font } = theme;
import type { Vault, Member } from '@/types/entities';
import { TrashBtn } from '@/components/shared/TrashBtn';
import {
  SectionWrap, SectionHeaderRow, Chevron, SectionLabel, SubtotalBadge,
  AddRowBtn, TableWrap, FTable, FThead, FTh, FTr, FTd,
  RawNameCell, CellSelect, NumInput, OrderInput, DueInput, OwnerBadge,
} from './FixedSection.styles';
import { EditCell } from './EditCell';
import {
  CAT_COLORS,
  FREQ_MONTHS,
  FREQUENCIES,
  buildRawName,
  monthlyAmount,
  ownerBadgeColors,
} from './vaultHelpers';

// ─── FixedSection ─────────────────────────────────────────────────────────────

export interface FixedSectionProps {
  category: string;
  groupOrder: number;
  vaults: Vault[];
  members: Member[];
  readOnly: boolean;
  onUpdate: (id: number, patch: Partial<Vault>, save?: boolean) => void;
  onDelete: (id: number) => void;
  onAdd: (category: string) => void;
  onGroupOrderChange?: (category: string, groupOrder: number) => void;
}

export function FixedSection({ category, groupOrder, vaults, members, readOnly, onUpdate, onDelete, onAdd, onGroupOrderChange }: FixedSectionProps) {
  const [open, setOpen] = useState(true);
  const pal = CAT_COLORS[category] ?? { bg: semanticColors.surfaceMuted, border: colors.border, header: colors.bg, text: semanticColors.neutralText, subtext: colors.textMuted };
  const subtotal = vaults.reduce((s, v) => s + monthlyAmount(v), 0);

  return (
    <SectionWrap>
      <SectionHeaderRow bg={pal.header} borderColor={pal.border} onClick={() => setOpen((v) => !v)}>
        <Chevron open={open}>▶</Chevron>
        <SectionLabel textColor={pal.text}>{category}</SectionLabel>
        {!readOnly && onGroupOrderChange && (
          <OrderInput
            type="number" min="1"
            defaultValue={groupOrder}
            title="Group order"
            onClick={(e) => e.stopPropagation()}
            onBlur={(e) => {
              const val = parseInt(e.target.value) || groupOrder;
              if (val !== groupOrder) onGroupOrderChange(category, val);
            }}
          />
        )}
        <SubtotalBadge bg={pal.bg} textColor={pal.text}>Subtotal: {formatDollars(subtotal)}</SubtotalBadge>
      </SectionHeaderRow>

      {open && (
        <>
          <TableWrap>
            <FTable>
              <FThead>
                <tr>
                  <FTh w={46} center>Order</FTh>
                  <FTh w={130}>Name</FTh>
                  <FTh w={110}>Description</FTh>
                  <FTh w={90}>Who</FTh>
                  <FTh w={120}>Frequency</FTh>
                  <FTh w={70}>Due Months</FTh>
                  <FTh w={90} right>Goal ($)</FTh>
                  <FTh w={70} right>Monthly</FTh>
                  <FTh>Raw Name</FTh>
                  {!readOnly && <FTh w={28} />}
                </tr>
              </FThead>
              <tbody>
                {vaults.map((v, i) => {
                  const rawName = buildRawName(v, v.sortOrder || i + 1, groupOrder);
                  const ownerColors = ownerBadgeColors(v.owner);
                  return (
                    <FTr key={v.id}>
                      {/* Order */}
                      <FTd center>
                        <OrderInput
                          type="number" min="0"
                          defaultValue={v.sortOrder}
                          disabled={readOnly}
                          onBlur={(e) => {
                            const sortOrder = parseInt(e.target.value) || 0;
                            onUpdate(v.id, { sortOrder }, true);
                          }}
                        />
                      </FTd>

                      {/* Name */}
                      <FTd>
                        <EditCell value={v.name} readOnly={readOnly} width={120}
                          onCommit={(name) => onUpdate(v.id, { name }, true)} />
                      </FTd>

                      {/* Description */}
                      <FTd>
                        <EditCell value={v.description} readOnly={readOnly} width={100}
                          onCommit={(description) => onUpdate(v.id, { description }, true)} />
                      </FTd>

                      {/* Who */}
                      <FTd>
                        {readOnly ? (
                          <OwnerBadge bg={ownerColors.bg} fg={ownerColors.fg}>{v.owner?.name ?? 'All'}</OwnerBadge>
                        ) : (
                          <CellSelect value={v.ownerMemberId ?? ''}
                            onChange={(e) => {
                              const ownerMemberId = e.target.value === '' ? null : Number(e.target.value);
                              const owner = ownerMemberId ? (members.find((m) => m.id === ownerMemberId) ?? null) : null;
                              onUpdate(v.id, { ownerMemberId, owner }, true);
                            }}>
                            <option value="">All</option>
                            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </CellSelect>
                        )}
                      </FTd>

                      {/* Frequency */}
                      <FTd>
                        {readOnly ? (
                          <span style={{ color: colors.textMuted }}>{v.frequency}</span>
                        ) : (
                          <CellSelect value={v.frequency}
                            onChange={(e) => {
                              const frequency = e.target.value;
                              const rateMonths = FREQ_MONTHS[frequency] ?? 1;
                              onUpdate(v.id, { frequency, rateMonths }, true);
                            }}>
                            {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                          </CellSelect>
                        )}
                      </FTd>

                      {/* Due Months */}
                      <FTd>
                        <DueInput
                          type="text"
                          defaultValue={v.dueMonths}
                          disabled={readOnly}
                          placeholder="e.g. 5,11"
                          title="Comma-separated months when payment is due (e.g. 5,11)"
                          onBlur={(e) => onUpdate(v.id, { dueMonths: e.target.value.trim() }, true)}
                        />
                      </FTd>

                      {/* Goal */}
                      <FTd right>
                        <NumInput
                          type="number" step="1"
                          defaultValue={v.target != null ? toDollars(v.target).toFixed(0) : ''}
                          disabled={readOnly}
                          onBlur={(e) => {
                            const target = toCents(parseFloat(e.target.value) || 0);
                            onUpdate(v.id, { target }, true);
                          }}
                        />
                      </FTd>

                      {/* Monthly (computed) */}
                      <FTd right bold>{formatDollars(monthlyAmount(v))}</FTd>

                      {/* Raw Name */}
                      <FTd>
                        <RawNameCell title={rawName}>{rawName}</RawNameCell>
                      </FTd>

                      {!readOnly && (
                        <FTd center>
                          <TrashBtn onClick={() => onDelete(v.id)} title="Delete vault">🗑</TrashBtn>
                        </FTd>
                      )}
                    </FTr>
                  );
                })}
              </tbody>
            </FTable>
          </TableWrap>
          {!readOnly && (
            <AddRowBtn onClick={() => onAdd(category)}>+ Add row</AddRowBtn>
          )}
        </>
      )}
    </SectionWrap>
  );
}
