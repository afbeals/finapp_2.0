'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import styled from 'styled-components';
import { StepShell } from '@/components/review/StepShell';
import { useStepNav } from '@/lib/useStepNav';
import { useReviewStore } from '@/lib/store';
import { formatDollars, toCents, toDollars } from '@/lib/money';
import { colors, font, spacing, radius } from '@/styles/tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VaultOwner { id: number; name: string; color: string }

interface Vault {
  id: number;
  name: string;
  type: 'FIXED' | 'VARIABLE';
  category: string;
  owner: VaultOwner | null;
  ownerMemberId: number | null;
  target: number | null;
  frequency: string;
  rateMonths: number;
  currentBalance: number;
  treasuryPct: number;
  sortOrder: number;
  description: string;
  dueMonths: string;
}

interface VaultSnapshot { vaultId: number; amount: number }
interface Member { id: number; name: string; color: string }

// ─── Raw-name derivation ──────────────────────────────────────────────────────

// Group order = position of category in CAT_ORDER (1-based)
const CAT_ORDER = ['Bills', 'Personal', 'Pre-Pay', 'Replenish', 'Investments'];
const CAT_GROUPS: Record<string, number> = Object.fromEntries(CAT_ORDER.map((c, i) => [c, i + 1]));

// Frequency abbreviation: "MONTHLY" → "Monthly", "SEMI-ANN" → "SemiAnn", "1-YEAR" → "1Yr", etc.
const FREQ_ABBR: Record<string, string> = {
  'MONTHLY':  'Monthly',
  '2-MONTH':  '2Mo',
  '3-MONTH':  'Quarterly',
  '4-MONTH':  '4Mo',
  '6-MONTH':  'SemiAnn',
  '1-YEAR':   '1Yr',
  '2-YEAR':   '2Yr',
  '3-YEAR':   '3Yr',
  'GOAL':     'Goal',
};

const FREQ_MONTHS: Record<string, number> = {
  'MONTHLY': 1, '2-MONTH': 2, '3-MONTH': 3, '4-MONTH': 4,
  '6-MONTH': 6, '1-YEAR': 12, '2-YEAR': 24, '3-YEAR': 36, 'GOAL': 1,
};

const FREQUENCIES = ['MONTHLY', '2-MONTH', '3-MONTH', '4-MONTH', '6-MONTH', '1-YEAR', '2-YEAR', '3-YEAR', 'GOAL'];

function buildFreqPart(frequency: string, dueMonths: string): string {
  const abbr = FREQ_ABBR[frequency] ?? frequency;
  const months = dueMonths.trim();
  if (months) return `${abbr}(${months})`;
  return abbr;
}

function buildRawName(vault: Vault, innerOrder: number, groupOrder: number): string {
  const grp = String(groupOrder).padStart(2, '0');
  const inner = String(innerOrder).padStart(2, '0');
  const who = vault.owner?.name ? vault.owner.name.replace(/\s+/g, '') : 'All';
  const freqPart = buildFreqPart(vault.frequency, vault.dueMonths);
  const desc = vault.description.trim() || vault.name.replace(/\s+/g, '');
  const goal = vault.target != null ? String(Math.round(toDollars(vault.target))) : '0';
  const cat = (vault.category || 'Other').replace(/[\s-]+/g, '');
  return `${grp}-${cat}-${inner}-${who}-${freqPart}-${desc}-${goal}`;
}

function buildTreasuryRawName(vault: Vault, innerOrder: number): string {
  const inner = String(innerOrder).padStart(2, '0');
  const who = vault.owner?.name ? vault.owner.name.replace(/\s+/g, '') : 'All';
  const desc = vault.description.trim() || vault.name.replace(/\s+/g, '');
  const goal = vault.target != null ? String(Math.round(toDollars(vault.target))) : 'Variable';
  return `T-${inner}-${who}-${desc}-${goal}`;
}

// ─── Category palette ─────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, { bg: string; border: string; header: string; text: string; subtext: string }> = {
  Bills:       { bg: '#FFFBEB', border: '#FCD34D', header: '#FEF3C7', text: '#92400E', subtext: '#B45309' },
  Personal:    { bg: '#FAF5FF', border: '#C4B5FD', header: '#EDE9FE', text: '#5B21B6', subtext: '#7C3AED' },
  'Pre-Pay':   { bg: '#EFF6FF', border: '#93C5FD', header: '#DBEAFE', text: '#1E40AF', subtext: '#2563EB' },
  Replenish:   { bg: '#F0FDF4', border: '#86EFAC', header: '#DCFCE7', text: '#166534', subtext: '#16A34A' },
  Investments: { bg: '#F0FDFA', border: '#5EEAD4', header: '#CCFBF1', text: '#0F766E', subtext: '#0D9488' },
};

// ─── Styled components ────────────────────────────────────────────────────────

const SectionTitle = styled.h2`
  font-size: ${font.size.base};
  font-weight: 700;
  color: ${colors.textPrimary};
  margin: 0 0 ${spacing[4]};
  letter-spacing: -0.01em;
`;

const SummaryBar = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: 18px 24px;
  margin-bottom: ${spacing[5]};
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
`;

const SummaryTotal = styled.div`flex: 1; min-width: 160px;`;
const SummaryTotalLabel = styled.p`font-size: 11px; font-weight: 600; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 4px;`;
const SummaryTotalValue = styled.p`font-size: 28px; font-weight: 700; color: ${colors.textPrimary}; margin: 0; line-height: 1;`;
const SummaryDivider = styled.div`width: 1px; height: 50px; background: ${colors.border}; margin: 0 12px;`;

const CatChip = styled.div.withConfig({ shouldForwardProp: (p) => !['bg', 'border', 'text'].includes(p) })<{ bg: string; border: string; text: string }>`
  background: ${({ bg }) => bg}; border: 1px solid ${({ border }) => border};
  border-radius: ${radius.md}; padding: 8px 14px; min-width: 100px;
`;
const CatChipLabel = styled.p.withConfig({ shouldForwardProp: (p) => p !== 'textColor' })<{ textColor: string }>`font-size: 10px; font-weight: 600; color: ${({ textColor }) => textColor}; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 2px;`;
const CatChipVal = styled.p.withConfig({ shouldForwardProp: (p) => p !== 'textColor' })<{ textColor: string }>`font-size: ${font.size.lg}; font-weight: 700; color: ${({ textColor }) => textColor}; margin: 0;`;

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

// Table
const TableWrap = styled.div`overflow-x: auto;`;

const FTable = styled.table`width: 100%; border-collapse: collapse; font-size: ${font.size.sm}; min-width: 860px;`;
const FThead = styled.thead`background: #F8FAFC; position: sticky; top: 0; z-index: 1;`;

const FTh = styled.th.withConfig({ shouldForwardProp: (p) => !['right', 'w', 'center'].includes(p) })<{ right?: boolean; w?: number; center?: boolean }>`
  padding: 6px 8px; font-size: 10px; font-weight: 600; color: ${colors.textMuted};
  text-transform: uppercase; letter-spacing: 0.04em;
  text-align: ${({ right, center }) => right ? 'right' : center ? 'center' : 'left'};
  border-bottom: 1px solid ${colors.border}; white-space: nowrap;
  ${({ w }) => w ? `width: ${w}px; min-width: ${w}px;` : ''}
`;

const FTr = styled.tr`&:not(:last-child) { border-bottom: 1px solid ${colors.border}; } &:hover { background: #FAFAFA; }`;

const FTd = styled.td.withConfig({ shouldForwardProp: (p) => !['right', 'bold', 'center', 'muted'].includes(p) })<{ right?: boolean; bold?: boolean; center?: boolean; muted?: boolean }>`
  padding: 6px 8px;
  text-align: ${({ right, center }) => right ? 'right' : center ? 'center' : 'left'};
  font-weight: ${({ bold }) => bold ? 600 : 'normal'};
  color: ${({ muted }) => muted ? colors.textMuted : colors.textPrimary};
  white-space: nowrap;
`;

// Raw name cell — ellipsis + tooltip
const RawNameCell = styled.span`
  display: inline-block;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: ${colors.textMuted};
  cursor: default;
  vertical-align: middle;
`;

// Inline editable elements
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
  &:hover { background: #FEE2E2; color: ${colors.danger}; opacity: 1; }
`;
const OwnerBadge = styled.span.withConfig({ shouldForwardProp: (p) => !['bg', 'fg'].includes(p) })<{ bg: string; fg: string }>`
  display: inline-block; padding: 2px 8px; border-radius: 99px;
  font-size: 10px; font-weight: 600; background: ${({ bg }) => bg}; color: ${({ fg }) => fg};
`;

// Treasury
const TreasuryWrap = styled.div`
  background: ${colors.surface}; border: 1px solid ${colors.border};
  border-radius: ${radius.lg}; margin-bottom: ${spacing[4]};
  box-shadow: 0 1px 3px rgba(0,0,0,0.04); overflow: hidden;
`;
const TrAmountBox = styled.div`
  display: flex; align-items: center; gap: 16px; padding: 14px 20px;
  background: #FFF7ED; border-bottom: 1px solid #FED7AA;
`;
const TrAmountLabel = styled.span`font-size: 11px; font-weight: 600; color: #92400E; text-transform: uppercase; letter-spacing: 0.05em;`;
const TrAmountInput = styled.input`
  height: 36px; width: 140px; padding: 0 10px;
  border: 1px solid #F97316; border-radius: ${radius.md};
  font-size: ${font.size.base}; font-weight: 700; color: #92400E;
  background: ${colors.surface}; text-align: right;
  &:focus { outline: none; border-color: #EA580C; }
`;
const TrAllocationBadge = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'valid' })<{ valid: boolean }>`
  margin-left: auto; font-size: ${font.size.sm}; font-weight: 600;
  color: ${({ valid }) => valid ? '#15803D' : colors.danger};
  background: ${({ valid }) => valid ? '#DCFCE7' : '#FEE2E2'};
  padding: 4px 12px; border-radius: 99px;
`;
const TTr = styled.tr.withConfig({ shouldForwardProp: (p) => p !== 'funded' })<{ funded?: boolean }>`
  background: ${({ funded }) => funded ? '#F0FDF4' : 'transparent'};
  &:not(:last-child) { border-bottom: 1px solid ${colors.border}; }
  &:hover { background: ${({ funded }) => funded ? '#DCFCE7' : '#FAFAFA'}; }
`;
const TTd = styled.td.withConfig({ shouldForwardProp: (p) => !['right', 'bold', 'green', 'muted', 'center'].includes(p) })<{ right?: boolean; bold?: boolean; green?: boolean; muted?: boolean; center?: boolean }>`
  padding: 6px 8px;
  text-align: ${({ right, center }) => right ? 'right' : center ? 'center' : 'left'};
  font-weight: ${({ bold }) => bold ? 600 : 'normal'};
  color: ${({ green, muted }) => green ? '#15803D' : muted ? colors.textMuted : colors.textPrimary};
  white-space: nowrap;
`;
const PctInput = styled.input.withConfig({ shouldForwardProp: (p) => p !== 'funded' })<{ funded?: boolean }>`
  width: 52px; height: 26px; padding: 0 6px;
  border: 1px solid ${({ funded }) => funded ? '#86EFAC' : '#F97316'};
  border-radius: ${radius.sm}; font-size: ${font.size.sm}; font-weight: 600; text-align: center;
  color: ${({ funded }) => funded ? '#15803D' : '#92400E'};
  background: ${({ funded }) => funded ? '#F0FDF4' : '#FFF7ED'};
  &:focus { outline: none; }
  &:disabled { background: ${colors.bg}; border-color: ${colors.border}; color: ${colors.textMuted}; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monthlyAmount(vault: Vault): number {
  if (!vault.target || vault.rateMonths <= 0) return 0;
  return Math.round(vault.target / vault.rateMonths);
}

function ownerBadgeColors(owner: VaultOwner | null): { bg: string; fg: string } {
  if (!owner) return { bg: '#F1F5F9', fg: '#475569' };
  return { bg: owner.color + '22', fg: owner.color };
}

function patchApi(id: number, data: Record<string, unknown>) {
  return fetch(`/api/vaults/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

// ─── Inline editable text cell ────────────────────────────────────────────────

function EditCell({ value, onCommit, readOnly, width = 120 }: { value: string; onCommit: (v: string) => void; readOnly: boolean; width?: number }) {
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

// ─── FixedSection ─────────────────────────────────────────────────────────────

interface FixedSectionProps {
  category: string;
  groupOrder: number;
  vaults: Vault[];
  members: Member[];
  readOnly: boolean;
  onUpdate: (id: number, patch: Partial<Vault>, save?: boolean) => void;
  onDelete: (id: number) => void;
  onAdd: (category: string) => void;
}

function FixedSection({ category, groupOrder, vaults, members, readOnly, onUpdate, onDelete, onAdd }: FixedSectionProps) {
  const [open, setOpen] = useState(true);
  const pal = CAT_COLORS[category] ?? { bg: '#F8FAFC', border: '#E2E8F0', header: '#F1F5F9', text: '#475569', subtext: '#64748B' };
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VaultsPage() {
  const params = useParams();
  const reviewId = params.id as string;
  const { state: reviewState } = useReviewStore();
  const { goNext, goBack, goSkip, saving } = useStepNav('vaults');
  const readOnly = reviewState.activeReview?.status === 'COMPLETE' && !reviewState.isEditMode;

  const [vaults, setVaults] = useState<Vault[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [treasuryAmount, setTreasuryAmount] = useState(0);
  const [treasuryPcts, setTreasuryPcts] = useState<Record<number, number>>({});

  useEffect(() => {
    Promise.all([
      fetch(`/api/reviews/${reviewId}/vaults`).then((r) => r.json()),
      fetch('/api/config/members').then((r) => r.json()),
    ]).then(([{ vaults: vs, snapshots: _snaps }, { members: ms }]) => {
      setVaults(vs ?? []);
      setMembers(ms ?? []);
      const pcts: Record<number, number> = {};
      for (const v of vs ?? []) if (v.type === 'VARIABLE') pcts[v.id] = v.treasuryPct;
      setTreasuryPcts(pcts);
    }).finally(() => setLoading(false));
  }, [reviewId]);

  function patchVault(id: number, patch: Partial<Vault>, save = false) {
    setVaults((prev) => prev.map((v) => v.id === id ? { ...v, ...patch } : v));
    if (save) {
      const saveData: Record<string, unknown> = { ...patch };
      if (patch.owner !== undefined) delete saveData.owner; // owner is a relation, not directly patchable
      patchApi(id, saveData);
    }
  }

  async function handleDeleteVault(id: number) {
    setVaults((prev) => prev.filter((v) => v.id !== id));
    await fetch(`/api/vaults/${id}`, { method: 'DELETE' });
  }

  async function handleAddVault(type: 'FIXED' | 'VARIABLE', category: string) {
    const siblings = vaults.filter((v) => v.type === type && v.category === category);
    const maxOrder = siblings.reduce((m, v) => Math.max(m, v.sortOrder), 0);
    const res = await fetch('/api/vaults', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Vault', type, category,
        ownerMemberId: null, target: 0,
        frequency: type === 'VARIABLE' ? 'GOAL' : 'MONTHLY',
        rateMonths: 1, currentBalance: 0, treasuryPct: 0,
        sortOrder: maxOrder + 1, description: '', dueMonths: '',
      }),
    });
    if (res.ok) {
      const { vault } = await res.json();
      setVaults((prev) => [...prev, vault]);
      if (type === 'VARIABLE') setTreasuryPcts((prev) => ({ ...prev, [vault.id]: 0 }));
    }
  }

  const fixedVaults = useMemo(() => vaults.filter((v) => v.type === 'FIXED'), [vaults]);
  const variableVaults = useMemo(
    () => [...vaults.filter((v) => v.type === 'VARIABLE')].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [vaults]
  );

  const fixedByCategory = useMemo(() => {
    const map: Record<string, Vault[]> = {};
    for (const v of fixedVaults) {
      const k = v.category || 'Other';
      if (!map[k]) map[k] = [];
      map[k].push(v);
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
    return map;
  }, [fixedVaults]);

  const totalFixed = useMemo(() => fixedVaults.reduce((s, v) => s + monthlyAmount(v), 0), [fixedVaults]);

  const catTotals = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [cat, vs] of Object.entries(fixedByCategory)) out[cat] = vs.reduce((s, v) => s + monthlyAmount(v), 0);
    return out;
  }, [fixedByCategory]);

  const totalTreasuryPct = useMemo(
    () => variableVaults.reduce((s, v) => s + (treasuryPcts[v.id] ?? 0), 0),
    [variableVaults, treasuryPcts]
  );

  const treasuryAmounts = useMemo(() => {
    const out: Record<number, number> = {};
    for (const v of variableVaults) out[v.id] = Math.round(treasuryAmount * ((treasuryPcts[v.id] ?? 0) / 100));
    return out;
  }, [variableVaults, treasuryPcts, treasuryAmount]);

  const totalTreasuryDistributed = useMemo(
    () => variableVaults.reduce((s, v) => s + (treasuryAmounts[v.id] ?? 0), 0),
    [variableVaults, treasuryAmounts]
  );

  function updateTreasuryPct(vaultId: number, pct: number) {
    setTreasuryPcts((prev) => ({ ...prev, [vaultId]: Math.max(0, Math.min(100, pct)) }));
  }

  async function handleSave() {
    const snapshotData = [
      ...fixedVaults.map((v) => ({ vaultId: v.id, amount: monthlyAmount(v) })),
      ...variableVaults.map((v) => ({ vaultId: v.id, amount: treasuryAmounts[v.id] ?? 0 })),
    ];
    const pctUpdates = variableVaults.map((v) => ({ id: v.id, treasuryPct: treasuryPcts[v.id] ?? 0 }));
    await fetch(`/api/reviews/${reviewId}/vaults`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snapshots: snapshotData, pctUpdates }),
    });
    await goNext();
  }

  if (loading) return <p style={{ color: colors.textMuted }}>Loading…</p>;

  const allCategories = [
    ...CAT_ORDER.filter((c) => fixedByCategory[c]),
    ...Object.keys(fixedByCategory).filter((c) => !CAT_ORDER.includes(c)),
  ];

  return (
    <StepShell
      title="Vault Distribution"
      subtitle="Allocate funds across your bank vaults for the month"
      stepName="Vaults"
      onBack={goBack}
      onSkip={goSkip}
      onNext={handleSave}
      saving={saving}
      readOnly={readOnly}
    >
      {/* ── Summary ── */}
      <SummaryBar>
        <SummaryTotal>
          <SummaryTotalLabel>Total Monthly Allocation</SummaryTotalLabel>
          <SummaryTotalValue>{formatDollars(totalFixed + totalTreasuryDistributed)}</SummaryTotalValue>
        </SummaryTotal>
        <SummaryDivider />
        {CAT_ORDER.map((cat) => {
          const pal = CAT_COLORS[cat];
          const val = catTotals[cat] ?? 0;
          if (!val || !pal) return null;
          return (
            <React.Fragment key={cat}>
              <CatChip bg={pal.bg} border={pal.border} text={pal.text}>
                <CatChipLabel textColor={pal.subtext}>{cat}</CatChipLabel>
                <CatChipVal textColor={pal.text}>{formatDollars(val)}</CatChipVal>
              </CatChip>
            </React.Fragment>
          );
        })}
      </SummaryBar>

      {/* ── Fixed Allocations ── */}
      <SectionTitle>Fixed Allocations</SectionTitle>
      <p style={{ fontSize: font.size.sm, color: colors.textMuted, marginTop: `-${spacing[3]}`, marginBottom: spacing[4] }}>
        Monthly amounts calculated from goals and timeframes. Raw name = <code style={{ fontSize: 11 }}>[GroupOrder]-[Category]-[Order]-[Who]-[Freq(months)]-[Description]-[Goal]</code>
      </p>

      {allCategories.map((cat) => {
        const groupOrder = CAT_GROUPS[cat] ?? 99;
        return (
          <FixedSection
            key={cat}
            category={cat}
            groupOrder={groupOrder}
            vaults={fixedByCategory[cat] ?? []}
            members={members}
            readOnly={readOnly}
            onUpdate={patchVault}
            onDelete={handleDeleteVault}
            onAdd={(category) => handleAddVault('FIXED', category)}
          />
        );
      })}

      {!readOnly && (
        <AddRowBtn
          style={{ marginBottom: spacing[4], border: `1px dashed ${colors.primary}`, color: colors.primary }}
          onClick={() => handleAddVault('FIXED', CAT_ORDER[0])}
        >
          + Add fixed vault
        </AddRowBtn>
      )}

      {/* ── Treasury Distribution ── */}
      <SectionTitle style={{ marginTop: spacing[6] }}>Treasury Distribution</SectionTitle>
      <p style={{ fontSize: font.size.sm, color: colors.textMuted, marginTop: `-${spacing[3]}`, marginBottom: spacing[4] }}>
        Distribute remaining funds by percentage across savings goals
      </p>

      <TreasuryWrap>
        <TrAmountBox>
          <TrAmountLabel>Treasury Amount</TrAmountLabel>
          <TrAmountInput
            type="number" step="0.01"
            value={toDollars(treasuryAmount).toFixed(2)}
            onChange={(e) => setTreasuryAmount(toCents(parseFloat(e.target.value) || 0))}
            disabled={readOnly}
          />
          <span style={{ fontSize: font.size.sm, color: '#92400E' }}>Enter amount to distribute</span>
          <TrAllocationBadge valid={Math.abs(totalTreasuryPct - 100) < 0.1 || totalTreasuryPct === 0}>
            Total: {totalTreasuryPct.toFixed(0)}%
          </TrAllocationBadge>
        </TrAmountBox>

        <TableWrap>
          <FTable>
            <FThead>
              <tr>
                <FTh w={130}>Name</FTh>
                <FTh w={180}>Raw Name</FTh>
                <FTh w={100} right>Goal</FTh>
                <FTh w={100} right>Current</FTh>
                <FTh w={100} right>Remaining</FTh>
                <FTh w={60} center>%</FTh>
                <FTh w={90} right>Amount</FTh>
                {!readOnly && <FTh w={28} />}
              </tr>
            </FThead>
            <tbody>
              {variableVaults.map((v) => {
                const remaining = v.target != null ? v.target - v.currentBalance : null;
                const isFunded = remaining != null && remaining <= 0;
                const pct = treasuryPcts[v.id] ?? 0;
                const amount = treasuryAmounts[v.id] ?? 0;

                return (
                  <TTr key={v.id} funded={isFunded}>
                    {/* Friendly Name */}
                    <TTd>
                      <EditCell value={v.name} readOnly={readOnly} width={118}
                        onCommit={(name) => patchVault(v.id, { name }, true)} />
                    </TTd>

                    {/* Raw Name — manually editable, stored in description */}
                    <TTd>
                      {readOnly ? (
                        <RawNameCell title={v.description || v.name}>{v.description || v.name}</RawNameCell>
                      ) : (
                        <CellInput
                          key={v.id}
                          defaultValue={v.description}
                          style={{ width: 168, fontFamily: 'ui-monospace, monospace', fontSize: 11 }}
                          onBlur={(e) => {
                            const description = e.target.value.trim();
                            if (description !== v.description) patchVault(v.id, { description }, true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            if (e.key === 'Escape') { (e.target as HTMLInputElement).value = v.description; (e.target as HTMLInputElement).blur(); }
                          }}
                        />
                      )}
                    </TTd>

                    {/* Goal */}
                    <TTd right muted>
                      {v.target != null ? formatDollars(v.target) : <span style={{ fontStyle: 'italic' }}>Variable</span>}
                    </TTd>

                    {/* Current */}
                    <TTd right green={isFunded} muted={!isFunded}>{formatDollars(v.currentBalance)}</TTd>

                    {/* Remaining — computed */}
                    <TTd right bold green={isFunded}>
                      {remaining != null ? formatDollars(remaining) : '—'}
                    </TTd>

                    {/* % */}
                    <TTd center>
                      <PctInput
                        type="number" min="0" max="100" step="1"
                        value={pct}
                        onChange={(e) => updateTreasuryPct(v.id, parseFloat(e.target.value) || 0)}
                        disabled={readOnly || isFunded}
                        funded={isFunded}
                      />
                    </TTd>

                    {/* Amount — computed */}
                    <TTd right bold green={isFunded} style={{ color: amount > 0 ? colors.textPrimary : colors.textMuted }}>
                      {formatDollars(amount)}
                    </TTd>

                    {!readOnly && (
                      <TTd center>
                        <DeleteBtn onClick={() => handleDeleteVault(v.id)} title="Delete vault">×</DeleteBtn>
                      </TTd>
                    )}
                  </TTr>
                );
              })}
            </tbody>
          </FTable>
        </TableWrap>

        {!readOnly && (
          <AddRowBtn onClick={() => handleAddVault('VARIABLE', 'Treasury')}>+ Add row</AddRowBtn>
        )}
      </TreasuryWrap>
    </StepShell>
  );
}
