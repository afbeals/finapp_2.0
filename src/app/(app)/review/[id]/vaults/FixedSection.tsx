'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { formatDollars, toCents, toDollars } from '@/lib/money';
import { theme } from '@/styles/tokens';

const { colors, semanticColors, font, spacing, radius } = theme;
import type { Vault, Member } from '@/types/entities';
import { EditCell } from './EditCell';
import {
  CAT_COLORS,
  FREQ_MONTHS,
  FREQUENCIES,
  buildRawName,
  monthlyAmount,
  ownerBadgeColors,
} from './vaultHelpers';

// ─── Styled components ────────────────────────────────────────────────────────

const SectionWrap = styled.div`
  background: ${colors.surface}; border: 1px solid ${colors.border};
  border-radius: ${radius.lg}; margin-bottom: ${spacing[4]};
  box-shadow: 0 1px 3px rgba(0,0,0,0.04); overflow: hidden;
`;

const SectionHeaderRow = styled.div.withConfig({ shouldForwardProp: (p) => !['bg', 'borderColor'].includes(p) })<{ bg: string; borderColor: string }>`
  display: flex; align-items: center; gap: 10px; padding: 13px 18px;
  cursor: pointer; user-select: none;
  background: ${({ bg }) => bg}; border-bottom: 1px solid ${({ borderColor }) => borderColor};
`;

const Chevron = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'open' })<{ open: boolean }>`
  font-size: 10px; color: ${colors.textMuted};
  transform: ${({ open }) => open ? 'rotate(90deg)' : 'none'}; transition: transform 0.15s;
`;

const SectionLabel = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'textColor' })<{ textColor: string }>`
  font-size: ${font.size.sm}; font-weight: 700; color: ${({ textColor }) => textColor}; min-width: 120px;
`;

const SubtotalBadge = styled.span.withConfig({ shouldForwardProp: (p) => !['bg', 'textColor'].includes(p) })<{ bg: string; textColor: string }>`
  margin-left: auto; font-size: ${font.size.sm}; font-weight: 600;
  color: ${({ textColor }) => textColor}; background: ${({ bg }) => bg};
  padding: 3px 10px; border-radius: 99px;
`;

const AddRowBtn = styled.button`
  display: flex; align-items: center; gap: 5px;
  margin: 10px 18px; padding: 5px 12px;
  background: transparent; border: 1px dashed ${colors.border};
  border-radius: ${radius.md}; font-size: ${font.size.sm}; color: ${colors.textMuted};
  cursor: pointer;
  &:hover { background: ${colors.bg}; color: ${colors.textPrimary}; border-color: ${colors.primary}; }
`;

const TableWrap = styled.div`overflow-x: auto;`;

const FTable = styled.table`width: 100%; border-collapse: collapse; font-size: ${font.size.sm}; min-width: 860px;`;
const FThead = styled.thead`background: ${colors.bg}; position: sticky; top: 0; z-index: 1;`;

const FTh = styled.th.withConfig({ shouldForwardProp: (p) => !['right', 'w', 'center'].includes(p) })<{ right?: boolean; w?: number; center?: boolean }>`
  padding: 6px 8px; font-size: 10px; font-weight: 600; color: ${colors.textMuted};
  text-transform: uppercase; letter-spacing: 0.04em;
  text-align: ${({ right, center }) => right ? 'right' : center ? 'center' : 'left'};
  border-bottom: 1px solid ${colors.border}; white-space: nowrap;
  ${({ w }) => w ? `width: ${w}px; min-width: ${w}px;` : ''}
`;

const FTr = styled.tr`&:not(:last-child) { border-bottom: 1px solid ${colors.border}; } &:hover { background: ${colors.bg}; }`;

const FTd = styled.td.withConfig({ shouldForwardProp: (p) => !['right', 'bold', 'center', 'muted'].includes(p) })<{ right?: boolean; bold?: boolean; center?: boolean; muted?: boolean }>`
  padding: 6px 8px;
  text-align: ${({ right, center }) => right ? 'right' : center ? 'center' : 'left'};
  font-weight: ${({ bold }) => bold ? 600 : 'normal'};
  color: ${({ muted }) => muted ? colors.textMuted : colors.textPrimary};
  white-space: nowrap;
`;

const RawNameCell = styled.span`
  display: inline-block;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, monospace;
  font-size: ${font.size.xs};
  color: ${colors.textMuted};
  cursor: default;
  vertical-align: middle;
`;

const CellSelect = styled.select`
  height: 26px; padding: 0 4px; border: 1px solid ${colors.primary};
  border-radius: ${radius.sm}; font-size: ${font.size.sm};
  color: ${colors.textPrimary}; background: ${colors.surface}; cursor: pointer;
  &:focus { outline: none; }
`;

const NumInput = styled.input`
  width: 82px; height: 26px; padding: 0 6px; border: 1px solid ${colors.border};
  border-radius: ${radius.sm}; font-size: ${font.size.sm};
  text-align: right; color: ${colors.textPrimary}; background: ${colors.surface};
  &:focus { outline: none; border-color: ${colors.primary}; }
  &:disabled { background: ${colors.bg}; color: ${colors.textMuted}; }
`;

const OrderInput = styled.input`
  width: 40px; height: 26px; padding: 0 4px; border: 1px solid ${colors.border};
  border-radius: ${radius.sm}; font-size: ${font.size.sm};
  text-align: center; color: ${colors.textPrimary}; background: ${colors.surface};
  &:focus { outline: none; border-color: ${colors.primary}; }
`;

const DueInput = styled.input`
  width: 70px; height: 26px; padding: 0 6px; border: 1px solid ${colors.border};
  border-radius: ${radius.sm}; font-size: ${font.size.sm};
  color: ${colors.textPrimary}; background: ${colors.surface};
  &:focus { outline: none; border-color: ${colors.primary}; }
  &:disabled { background: ${colors.bg}; color: ${colors.textMuted}; }
`;

const DeleteBtn = styled.button`
  display: flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border: none; border-radius: ${radius.sm};
  background: transparent; color: ${colors.textMuted}; cursor: pointer;
  font-size: 15px; opacity: 0.45; line-height: 1;
  &:hover { background: ${colors.dangerLight}; color: ${colors.danger}; opacity: 1; }
`;

const OwnerBadge = styled.span.withConfig({ shouldForwardProp: (p) => !['bg', 'fg'].includes(p) })<{ bg: string; fg: string }>`
  display: inline-block; padding: 2px 8px; border-radius: 99px;
  font-size: 10px; font-weight: 600; background: ${({ bg }) => bg}; color: ${({ fg }) => fg};
`;

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
}

export function FixedSection({ category, groupOrder, vaults, members, readOnly, onUpdate, onDelete, onAdd }: FixedSectionProps) {
  const [open, setOpen] = useState(true);
  const pal = CAT_COLORS[category] ?? { bg: semanticColors.surfaceMuted, border: colors.border, header: colors.bg, text: semanticColors.neutralText, subtext: colors.textMuted };
  const subtotal = vaults.reduce((s, v) => s + monthlyAmount(v), 0);

  return (
    <SectionWrap>
      <SectionHeaderRow bg={pal.header} borderColor={pal.border} onClick={() => setOpen((v) => !v)}>
        <Chevron open={open}>▶</Chevron>
        <SectionLabel textColor={pal.text}>{category}</SectionLabel>
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
                          <DeleteBtn onClick={() => onDelete(v.id)} title="Delete vault">×</DeleteBtn>
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
