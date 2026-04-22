'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import styled from 'styled-components';
import { StepShell } from '@/components/review/StepShell';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useStepNav } from '@/lib/useStepNav';
import { useReviewStore } from '@/lib/store';
import { formatDollars, toCents, toDollars } from '@/lib/money';
import { colors, semanticColors, font, spacing, radius } from '@/styles/tokens';
import { LoadingState } from '@/components/shared/LoadingState';
import { KpiGrid, KpiCard } from '@/components/shared/KpiGrid';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { getReviewInvestments, getInvestmentCategories, apiPut, apiPost } from '@/lib/api';
import type { Purchase, InvestmentAccount, InvestmentCategory } from '@/types/entities';

// A position = all purchase lots for one ticker within a section, aggregated
interface Position {
  ticker: string;
  name: string;
  category: string;
  lots: Purchase[];
  totalShares: number;
  totalCostBasis: number; // cents (sum of pricePerShare × shares per lot)
  avgCostPerShare: number; // cents
  currentPrice: number; // cents, from live API
  currentValue: number; // cents
  gainLoss: number; // cents
  growthPct: number; // decimal
  accountIds: number[]; // for retirement — which accounts hold this ticker
}

const TAXABLE_TYPES = new Set(['TAXABLE']);
const RETIREMENT_TYPES = new Set(['TRADITIONAL_401K', 'ROTH_401K', 'TRADITIONAL_IRA', 'ROTH_IRA', 'HSA', 'OTHER']);

const AccountTypeLabel: Record<string, string> = {
  TAXABLE: 'Brokerage',
  TRADITIONAL_401K: '401(k)',
  ROTH_401K: 'Roth 401(k)',
  TRADITIONAL_IRA: 'Traditional IRA',
  ROTH_IRA: 'Roth IRA',
  HSA: 'HSA',
  OTHER: 'Other',
};

// ─── Aggregation helper ───────────────────────────────────────────────────────

function buildPositions(
  accounts: InvestmentAccount[],
  livePrices: Record<string, number>
): Position[] {
  // Group all purchases by ticker across given accounts
  const byTicker = new Map<string, { purchases: Purchase[]; name: string; category: string; accountIds: Set<number> }>();

  for (const acct of accounts) {
    for (const p of acct.purchases) {
      const key = p.ticker;
      if (!byTicker.has(key)) {
        byTicker.set(key, { purchases: [], name: p.name, category: p.category, accountIds: new Set() });
      }
      const entry = byTicker.get(key)!;
      entry.purchases.push(p);
      entry.accountIds.add(acct.id);
      // Use the most recent lot's name/category
      if (new Date(p.purchaseDate) > new Date(entry.purchases[0].purchaseDate)) {
        entry.name = p.name;
        entry.category = p.category;
      }
    }
  }

  return Array.from(byTicker.entries()).map(([ticker, { purchases, name, category, accountIds }]) => {
    const totalShares = purchases.reduce((s, p) => s + p.shares, 0);
    const totalCostBasis = purchases.reduce((s, p) => s + Math.round(p.shares * p.pricePerShare), 0);
    const avgCostPerShare = totalShares > 0 ? totalCostBasis / totalShares : 0;
    const currentPrice = livePrices[ticker] ?? 0;
    const currentValue = Math.round(totalShares * currentPrice);
    const gainLoss = currentValue - totalCostBasis;
    const growthPct = totalCostBasis > 0 ? gainLoss / totalCostBasis : 0;

    return {
      ticker,
      name,
      category,
      lots: purchases.sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()),
      totalShares,
      totalCostBasis,
      avgCostPerShare,
      currentPrice,
      currentValue,
      gainLoss,
      growthPct,
      accountIds: Array.from(accountIds),
    };
  });
}

// ─── Styled components ────────────────────────────────────────────────────────

const SplitBarWrap = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: 14px 16px;
  margin-bottom: ${spacing[5]};
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
`;

const SplitBar = styled.div`
  display: flex;
  height: 14px;
  border-radius: 7px;
  overflow: hidden;
  margin: 8px 0 6px;
`;

const SplitSegment = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'pct' && p !== 'bg' })<{ pct: number; bg: string }>`
  width: ${({ pct }) => pct}%;
  background: ${({ bg }) => bg};
  transition: width 0.4s ease;
`;

const SplitLegend = styled.div`
  display: flex;
  gap: 20px;
  font-size: 11px;
  color: ${colors.textMuted};
`;

const LegendDot = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'bg' })<{ bg: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  &::before { content: ''; display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: ${({ bg }) => bg}; }
`;

const MarketStrip = styled.div`
  background: ${colors.navbar};
  border-radius: ${radius.lg};
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  gap: 16px;
  margin-bottom: ${spacing[5]};
  flex-wrap: wrap;
`;

const MarketTag = styled.span`
  font-size: 10px;
  color: ${colors.textDisabled};
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-right: 4px;
`;

const MarketItem = styled.div`display: flex; flex-direction: column; gap: 1px;`;
const MarketName = styled.span`font-size: 10px; color: ${colors.textDisabled}; text-transform: uppercase; letter-spacing: 0.04em;`;
const MarketVal = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'up' })<{ up?: boolean }>`
  font-size: ${font.size.sm};
  font-weight: 600;
  color: ${({ up }) => up === undefined ? colors.bg : up ? semanticColors.successBright : semanticColors.dangerBright};
`;

// Collapsible section
const SectionWrap = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  margin-bottom: ${spacing[4]};
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  overflow: hidden;
`;

const SectionHeaderRow = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'green' })<{ green?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  cursor: pointer;
  user-select: none;
  background: ${({ green }) => green ? semanticColors.successBg : colors.surface};
  border-bottom: 1px solid ${({ green }) => green ? colors.successLight : colors.border};
  &:hover { background: ${({ green }) => green ? colors.successLight : colors.bg}; }
`;

const Chevron = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'open' && p !== 'green' })<{ open: boolean; green?: boolean }>`
  font-size: 11px;
  color: ${({ green }) => green ? semanticColors.successTextMedium : colors.primary};
  transform: ${({ open }) => open ? 'rotate(90deg)' : 'none'};
  transition: transform 0.15s;
  flex-shrink: 0;
`;

const SectionName = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'green' })<{ green?: boolean }>`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${({ green }) => green ? semanticColors.successText : colors.textPrimary};
  min-width: 220px;
`;

const HeaderStats = styled.div`
  display: flex;
  align-items: center;
  gap: 22px;
  flex: 1;
  flex-wrap: wrap;
`;

const HStat = styled.div`display: flex; flex-direction: column; gap: 1px;`;
const HStatLabel = styled.span`font-size: 9px; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.04em;`;
const HStatVal = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'textColor' })<{ textColor?: string }>`
  font-size: ${font.size.sm};
  font-weight: 600;
  color: ${({ textColor }) => textColor ?? colors.textPrimary};
`;

const ExpandLink = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'green' })<{ green?: boolean }>`
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  color: ${({ green }) => green ? semanticColors.successTextMedium : colors.primary};
  white-space: nowrap;
  padding: 0 4px;
`;

const PositionBadge = styled.span`
  font-size: 10px;
  color: ${colors.textMuted};
  background: ${colors.bg};
  border: 1px solid ${colors.border};
  border-radius: 99px;
  padding: 2px 8px;
  white-space: nowrap;
`;

// Expanded panel
const ExpandedWrap = styled.div`padding: 14px 18px;`;

const SubHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
`;

const FilterInput = styled.input`
  height: 32px;
  padding: 0 10px 0 28px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  font-size: ${font.size.sm};
  color: ${colors.textPrimary};
  background: ${colors.bg} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E") no-repeat 9px center;
  width: 200px;
  &:focus { outline: none; border-color: ${colors.primary}; }
`;

const FilterSelect = styled.select`
  height: 32px;
  padding: 0 24px 0 8px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  font-size: ${font.size.sm};
  color: ${colors.textPrimary};
  background: ${colors.surface};
  cursor: pointer;
  &:focus { outline: none; border-color: ${colors.primary}; }
`;

const CollapseBtn = styled.button`
  height: 32px; padding: 0 12px;
  background: transparent; border: 1px solid ${colors.border};
  border-radius: ${radius.md}; font-size: ${font.size.sm};
  color: ${colors.textMuted}; cursor: pointer;
  &:hover { background: ${colors.bg}; }
`;

// Horizontally-scrollable table
const TableScroll = styled.div`overflow-x: auto;`;

const HTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${font.size.sm};
  min-width: 860px;
`;

const HThead = styled.thead`background: ${semanticColors.surfaceMuted}; position: sticky; top: 0; z-index: 1;`;

const HTh = styled.th.withConfig({ shouldForwardProp: (p) => p !== 'right' })<{ right?: boolean }>`
  padding: 7px 10px;
  font-size: 10px;
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: ${({ right }) => right ? 'right' : 'left'};
  border-bottom: 1px solid ${colors.border};
  white-space: nowrap;
`;

const HTr = styled.tr`
  &:not(:last-child) { border-bottom: 1px solid ${colors.border}; }
  &:hover { background: ${colors.bg}; }
`;

const HTd = styled.td.withConfig({ shouldForwardProp: (p) => p !== 'right' && p !== 'bold' })<{ right?: boolean; bold?: boolean }>`
  padding: 9px 10px;
  text-align: ${({ right }) => right ? 'right' : 'left'};
  font-weight: ${({ bold }) => bold ? 600 : 'normal'};
  white-space: nowrap;
  color: ${colors.textPrimary};
`;

const CategoryBadge = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'bg' && p !== 'fg' })<{ bg: string; fg: string }>`
  display: inline-block;
  padding: 1px 7px;
  border-radius: 99px;
  font-size: 10px;
  font-weight: 600;
  background: ${({ bg }) => bg};
  color: ${({ fg }) => fg};
`;

const AccountChip = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'bg' && p !== 'fg' })<{ bg: string; fg: string }>`
  display: inline-block;
  padding: 1px 7px;
  border-radius: 99px;
  font-size: 10px;
  font-weight: 500;
  background: ${({ bg }) => bg};
  color: ${({ fg }) => fg};
  margin: 1px 2px;
`;

const PriceSpinner = styled.span`
  font-size: 10px;
  color: ${colors.textMuted};
  font-style: italic;
`;

const AddPurchaseBtn = styled.button`
  height: 32px; padding: 0 14px;
  background: ${colors.primary}; color: ${colors.surface};
  border: none; border-radius: ${radius.md};
  font-size: ${font.size.sm}; font-weight: ${font.weight.semibold};
  cursor: pointer;
  &:hover { background: ${colors.primaryHover}; }
`;


const FieldLabel = styled.label`
  display: block;
  font-size: 10px;
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
`;

const FieldInput = styled(Input)`width: 100%; margin-bottom: 12px;`;

const FieldSelect = styled.select`
  width: 100%;
  height: 38px;
  padding: 0 10px;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  font-size: ${font.size.sm};
  color: ${colors.textPrimary};
  background: ${colors.surface};
  margin-bottom: 12px;
  &:focus { outline: none; border-color: ${colors.primary}; }
`;

const TotalLine = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: ${colors.bg};
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  margin-bottom: 18px;
`;

const ModalFooter = styled.div`display: flex; justify-content: flex-end; gap: 10px;`;

const BtnPrimary = styled.button`
  height: 38px; padding: 0 20px;
  background: ${colors.primary}; color: ${colors.surface};
  border: none; border-radius: ${radius.md};
  font-size: ${font.size.sm}; font-weight: ${font.weight.semibold};
  cursor: pointer;
  &:hover { background: ${colors.primaryHover}; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const BtnGhost = styled.button`
  height: 38px; padding: 0 16px;
  background: transparent; color: ${colors.textMuted};
  border: 1px solid ${colors.border}; border-radius: ${radius.md};
  font-size: ${font.size.sm}; cursor: pointer;
  &:hover { background: ${colors.bg}; }
`;

// ─── Category color map ───────────────────────────────────────────────────────

function buildCategoryColorMap(cats: InvestmentCategory[]): Record<string, { bg: string; fg: string }> {
  const map: Record<string, { bg: string; fg: string }> = {};
  for (const c of cats) map[c.name] = { bg: c.color + '22', fg: c.color };
  return map;
}

function categoryColorFromMap(map: Record<string, { bg: string; fg: string }>, cat: string): { bg: string; fg: string } {
  return map[cat] ?? { bg: colors.bg, fg: semanticColors.neutralText };
}

const BADGE_PALETTE = [
  { bg: colors.primaryLight, fg: semanticColors.primaryTextDark },
  { bg: colors.successLight, fg: semanticColors.successTextDark },
  { bg: colors.warningLight, fg: semanticColors.amberText },
  { bg: '#FCE7F3', fg: '#9D174D' },
  { bg: semanticColors.purpleLight, fg: semanticColors.purpleTextDark },
  { bg: semanticColors.tealLight, fg: semanticColors.tealText },
  { bg: semanticColors.amberBg, fg: '#C2410C' },
];
function acctBadge(i: number) { return BADGE_PALETTE[i % BADGE_PALETTE.length]; }

// ─── Format helpers ───────────────────────────────────────────────────────────

function fmtGain(v: number) { return (v >= 0 ? '+' : '') + formatDollars(v); }
function fmtPct(v: number) { return (v >= 0 ? '+' : '') + (v * 100).toFixed(2) + '%'; }
function portPct(val: number, total: number) {
  if (total === 0) return '—';
  return ((val / total) * 100).toFixed(1) + '%';
}

// ─── InvestmentSection ────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  isRetirement: boolean;
  accounts: InvestmentAccount[];
  positions: Position[];
  livePrices: Record<string, number>;
  pricesLoading: boolean;
  readOnly: boolean;
  categoryColorMap: Record<string, { bg: string; fg: string }>;
  onAddPurchase: (defaultAccountId: number) => void;
}

type InvCategoryDef = InvestmentCategory;

function InvestmentSection({
  title,
  isRetirement,
  accounts,
  positions,
  pricesLoading,
  readOnly,
  categoryColorMap,
  onAddPurchase,
}: SectionProps) {
  const [open, setOpen] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const sectionValue = positions.reduce((s, p) => s + p.currentValue, 0);
  const sectionGainLoss = positions.reduce((s, p) => s + p.gainLoss, 0);
  const sectionCostBasis = positions.reduce((s, p) => s + p.totalCostBasis, 0);
  const sectionGrowthPct = sectionCostBasis > 0 ? sectionGainLoss / sectionCostBasis : 0;

  const categories = Array.from(new Set(positions.map((p) => p.category).filter(Boolean))).sort();

  const acctColorMap: Record<number, { bg: string; fg: string }> = {};
  accounts.forEach((a, i) => { acctColorMap[a.id] = acctBadge(i); });

  const q = search.toLowerCase();
  const filtered = positions.filter((p) => {
    const matchSearch = !q || p.ticker.toLowerCase().includes(q) || p.name.toLowerCase().includes(q);
    const matchCat = !categoryFilter || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <SectionWrap>
      <SectionHeaderRow green={isRetirement} onClick={() => setOpen((v) => !v)}>
        <Chevron open={open} green={isRetirement}>▶</Chevron>
        <SectionName green={isRetirement}>{title}</SectionName>

        <HeaderStats>
          <HStat>
            <HStatLabel>Total Value</HStatLabel>
            <HStatVal>{formatDollars(sectionValue)}</HStatVal>
          </HStat>
          <HStat>
            <HStatLabel>Gain / Loss</HStatLabel>
            <HStatVal textColor={sectionGainLoss >= 0 ? semanticColors.successText : colors.danger}>{fmtGain(sectionGainLoss)}</HStatVal>
          </HStat>
          <HStat>
            <HStatLabel>Growth</HStatLabel>
            <HStatVal textColor={sectionGainLoss >= 0 ? semanticColors.successText : colors.danger}>{fmtPct(sectionGrowthPct)}</HStatVal>
          </HStat>
          <HStat>
            <HStatLabel>Cost Basis</HStatLabel>
            <HStatVal>{formatDollars(sectionCostBasis)}</HStatVal>
          </HStat>
        </HeaderStats>

        <PositionBadge>{positions.length} position{positions.length !== 1 ? 's' : ''}</PositionBadge>

        {open ? (
          <CollapseBtn
            style={{ marginLeft: 'auto', height: 26, padding: '0 10px', fontSize: 11 }}
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          >
            Collapse ▲
          </CollapseBtn>
        ) : (
          <ExpandLink green={isRetirement} onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
            Expand ▼
          </ExpandLink>
        )}
      </SectionHeaderRow>

      {open && (
        <ExpandedWrap>
          <SubHeader>
            <FilterInput
              placeholder="Filter by name or ticker..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <FilterSelect value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </FilterSelect>
            {!readOnly && (
              <AddPurchaseBtn onClick={() => onAddPurchase(accounts[0]?.id)}>
                + Add Purchase
              </AddPurchaseBtn>
            )}
          </SubHeader>

          <TableScroll>
            <HTable>
              <HThead>
                <tr>
                  <HTh>Ticker</HTh>
                  <HTh>{isRetirement ? 'Fund Name' : 'Company'}</HTh>
                  <HTh>Category</HTh>
                  {isRetirement && <HTh>Account(s)</HTh>}
                  <HTh right># Lots</HTh>
                  <HTh right>Shares</HTh>
                  <HTh right>Avg Cost/Share</HTh>
                  <HTh right>Total Cost Basis</HTh>
                  <HTh right>Current Price</HTh>
                  <HTh right>Current Value</HTh>
                  <HTh right>Gain/Loss $</HTh>
                  <HTh right>Gain/Loss %</HTh>
                  <HTh right>Port %</HTh>
                </tr>
              </HThead>
              <tbody>
                {filtered.map((pos) => {
                  return (
                    <HTr key={pos.ticker}>
                      <HTd bold>{pos.ticker}</HTd>
                      <HTd style={{ color: colors.textMuted, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{pos.name}</HTd>
                      <HTd>
                        {pos.category ? (
                          <CategoryBadge bg={categoryColorFromMap(categoryColorMap, pos.category).bg} fg={categoryColorFromMap(categoryColorMap, pos.category).fg}>{pos.category}</CategoryBadge>
                        ) : (
                          <span style={{ color: colors.textMuted }}>—</span>
                        )}
                      </HTd>
                      {isRetirement && (
                        <HTd>
                          {pos.accountIds.map((aid) => {
                            const acct = accounts.find((a) => a.id === aid);
                            if (!acct) return null;
                            const badge = acctColorMap[aid];
                            return (
                              <AccountChip key={aid} bg={badge.bg} fg={badge.fg}>
                                {acct.name}
                              </AccountChip>
                            );
                          })}
                        </HTd>
                      )}
                      <HTd right style={{ color: colors.textMuted }}>{pos.lots.length}</HTd>
                      <HTd right>{pos.totalShares.toFixed(3)}</HTd>
                      <HTd right style={{ color: colors.textMuted }}>${toDollars(pos.avgCostPerShare).toFixed(2)}</HTd>
                      <HTd right>{formatDollars(pos.totalCostBasis)}</HTd>
                      <HTd right>
                        {pricesLoading ? (
                          <PriceSpinner>fetching…</PriceSpinner>
                        ) : pos.currentPrice > 0 ? (
                          `$${toDollars(pos.currentPrice).toFixed(2)}`
                        ) : (
                          <span style={{ color: colors.textMuted }}>—</span>
                        )}
                      </HTd>
                      <HTd right bold>{pos.currentPrice > 0 ? formatDollars(pos.currentValue) : <span style={{ color: colors.textMuted }}>—</span>}</HTd>
                      <HTd right style={{ color: pos.gainLoss >= 0 ? semanticColors.successText : colors.danger, fontWeight: 600 }}>
                        {pos.currentPrice > 0 ? fmtGain(pos.gainLoss) : '—'}
                      </HTd>
                      <HTd right style={{ color: pos.gainLoss >= 0 ? semanticColors.successText : colors.danger, fontWeight: 600 }}>
                        {pos.currentPrice > 0 ? fmtPct(pos.growthPct) : '—'}
                      </HTd>
                      <HTd right style={{ color: colors.textMuted }}>
                        {pos.currentPrice > 0 ? portPct(pos.currentValue, sectionValue) : '—'}
                      </HTd>
                    </HTr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={99} style={{ padding: '16px', textAlign: 'center', color: colors.textMuted, fontStyle: 'italic' }}>
                      No positions match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </HTable>
          </TableScroll>

          {/* Account legend for retirement */}
          {isRetirement && accounts.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
              {accounts.map((a, i) => {
                const b = acctBadge(i);
                return (
                  <AccountChip key={a.id} bg={b.bg} fg={b.fg}>
                    {a.name} · {AccountTypeLabel[a.type] ?? a.type}
                  </AccountChip>
                );
              })}
            </div>
          )}
        </ExpandedWrap>
      )}
    </SectionWrap>
  );
}

// ─── Add Purchase Modal ───────────────────────────────────────────────────────

function AddPurchaseModal({
  accounts,
  categories,
  defaultAccountId,
  onClose,
  onAdded,
}: {
  accounts: InvestmentAccount[];
  categories: InvCategoryDef[];
  defaultAccountId?: number;
  onClose: () => void;
  onAdded: (p: Purchase) => void;
}) {
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [nameFetching, setNameFetching] = useState(false);
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState(String(defaultAccountId ?? accounts[0]?.id ?? ''));
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [sharePrice, setSharePrice] = useState('');
  const [shares, setShares] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleTickerBlur() {
    const t = ticker.trim().toUpperCase();
    if (!t || name) return;
    setNameFetching(true);
    try {
      const res = await fetch(`/api/market-prices?tickers=${t}`);
      if (res.ok) {
        const data = await res.json();
        const fetched = data.names?.[t];
        if (fetched && !name) setName(fetched);
      }
    } finally {
      setNameFetching(false);
    }
  }

  const totalCost = (parseFloat(sharePrice) || 0) * (parseFloat(shares) || 0);

  async function handleSubmit() {
    if (!ticker.trim() || !accountId || !sharePrice || !shares || !purchaseDate) return;
    setSaving(true);
    const data = await apiPost<{ purchase: Purchase }>('/api/holdings', {
      accountId: Number(accountId),
      ticker: ticker.trim().toUpperCase(),
      name: name.trim() || ticker.trim().toUpperCase(),
      category: category.trim(),
      purchaseDate,
      pricePerShare: toCents(parseFloat(sharePrice) || 0),
      shares: parseFloat(shares),
    }).catch(() => null);
    if (data) {
      onAdded(data.purchase);
      onClose();
    }
    setSaving(false);
  }

  return (
    <Modal isOpen onClose={onClose} title="Add New Purchase" width="460px"
      footer={
        <ModalFooter>
          <BtnGhost onClick={onClose}>Cancel</BtnGhost>
          <BtnPrimary onClick={handleSubmit} disabled={saving || !ticker || !accountId || !sharePrice || !shares}>
            {saving ? 'Adding…' : 'Add Purchase'}
          </BtnPrimary>
        </ModalFooter>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <FieldLabel>Ticker Symbol *</FieldLabel>
          <FieldInput
            autoFocus
            placeholder="e.g. AAPL"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            onBlur={handleTickerBlur}
          />
        </div>
        <div>
          <FieldLabel>Category</FieldLabel>
          <FieldSelect value={category} onChange={(e) => setCategory(e.target.value)} style={{ marginBottom: 12 }}>
            <option value="">— None —</option>
            {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </FieldSelect>
        </div>
      </div>

      <FieldLabel>Company / Fund Name {nameFetching && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— looking up…</span>}</FieldLabel>
      <FieldInput placeholder={nameFetching ? 'Fetching from ticker…' : 'Auto-filled from ticker or enter manually'} value={name} onChange={(e) => setName(e.target.value)} />

      <FieldLabel>Account *</FieldLabel>
      <FieldSelect value={accountId} onChange={(e) => setAccountId(e.target.value)}>
        {accounts.map((a) => (
          <option key={a.id} value={String(a.id)}>
            {a.name} ({AccountTypeLabel[a.type] ?? a.type})
          </option>
        ))}
      </FieldSelect>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <FieldLabel>Purchase Date *</FieldLabel>
          <FieldInput type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Price per Share *</FieldLabel>
          <FieldInput type="number" step="0.01" placeholder="$0.00" value={sharePrice} onChange={(e) => setSharePrice(e.target.value)} />
        </div>
        <div>
          <FieldLabel># of Shares *</FieldLabel>
          <FieldInput type="number" step="0.0001" placeholder="0.00" value={shares} onChange={(e) => setShares(e.target.value)} />
        </div>
      </div>

      <TotalLine>
        <span style={{ fontSize: font.size.sm, color: colors.textMuted }}>Total Cost:</span>
        <span style={{ fontSize: font.size.base, fontWeight: 700, color: colors.textPrimary }}>
          {formatDollars(toCents(totalCost))}
        </span>
      </TotalLine>

      <p style={{ fontSize: 11, color: colors.textMuted, marginTop: 10, marginBottom: 0 }}>
        * Required. This purchase lot will be combined with existing lots for the same ticker.
      </p>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvestmentsPage() {
  const params = useParams();
  const reviewId = params.id as string;
  const { state: reviewState } = useReviewStore();
  const { goNext, goBack, goSkip, saving } = useStepNav('investments');
  const readOnly = reviewState.activeReview?.status === 'COMPLETE' && !reviewState.isEditMode;

  const [accounts, setAccounts] = useState<InvestmentAccount[]>([]);
  const [invCategories, setInvCategories] = useState<InvCategoryDef[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [pricesLoading, setPricesLoading] = useState(false);
  const [marketIndices, setMarketIndices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addDefaultAccountId, setAddDefaultAccountId] = useState<number | undefined>();

  useEffect(() => {
    Promise.all([
      getReviewInvestments(reviewId),
      getInvestmentCategories(),
    ])
      .then(([{ accounts: accs }, { categories: cats }]) => {
        setAccounts(accs ?? []);
        setInvCategories(cats ?? []);
      })
      .catch((e) => console.error('investments fetch:', e))
      .finally(() => setLoading(false));
  }, [reviewId]);

  // Fetch live prices once accounts are loaded
  const fetchPrices = useCallback(async (accs: InvestmentAccount[]) => {
    const allTickers = Array.from(new Set(accs.flatMap((a) => a.purchases.map((p) => p.ticker))));
    const indexTickers = ['SPY', 'QQQ', 'DIA'];
    const all = [...allTickers, ...indexTickers];
    if (all.length === 0) return;
    setPricesLoading(true);
    try {
      const res = await fetch(`/api/market-prices?tickers=${all.join(',')}`);
      if (res.ok) {
        const { prices } = await res.json();
        // Split out index tickers
        const portfolio: Record<string, number> = {};
        const indices: Record<string, number> = {};
        for (const [ticker, price] of Object.entries(prices as Record<string, number>)) {
          if (indexTickers.includes(ticker)) indices[ticker] = price;
          else portfolio[ticker] = price;
        }
        setLivePrices(portfolio);
        setMarketIndices(indices);
      }
    } finally {
      setPricesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accounts.length > 0) fetchPrices(accounts);
  }, [accounts, fetchPrices]);

  function handlePurchaseAdded(purchase: Purchase) {
    setAccounts((prev) =>
      prev.map((a) => a.id === purchase.accountId ? { ...a, purchases: [...a.purchases, purchase] } : a)
    );
    // Fetch price for new ticker if not already loaded
    if (!livePrices[purchase.ticker]) {
      fetch(`/api/market-prices?tickers=${purchase.ticker}`)
        .then((r) => r.json())
        .then(({ prices }) => {
          if (prices[purchase.ticker]) {
            setLivePrices((prev) => ({ ...prev, [purchase.ticker]: prices[purchase.ticker] }));
          }
        });
    }
  }

  async function handleSave() {
    const snapshots = accounts.flatMap((a) =>
      a.purchases.map((p) => {
        const price = livePrices[p.ticker] ?? 0;
        const value = Math.round(p.shares * price);
        const lotCostBasis = Math.round(p.shares * p.pricePerShare);
        return { purchaseId: p.id, price, value, gainLoss: value - lotCostBasis };
      })
    );
    await apiPut(`/api/reviews/${reviewId}/investments`, { snapshots });
    await goNext();
  }

  const taxableAccounts = useMemo(() => accounts.filter((a) => TAXABLE_TYPES.has(a.type)), [accounts]);
  const retirementAccounts = useMemo(() => accounts.filter((a) => RETIREMENT_TYPES.has(a.type)), [accounts]);

  const taxablePositions = useMemo(() => buildPositions(taxableAccounts, livePrices), [taxableAccounts, livePrices]);
  const retirementPositions = useMemo(() => buildPositions(retirementAccounts, livePrices), [retirementAccounts, livePrices]);

  const categoryColorMap = useMemo(() => buildCategoryColorMap(invCategories), [invCategories]);

  const taxableValue = taxablePositions.reduce((s, p) => s + p.currentValue, 0);
  const retirementValue = retirementPositions.reduce((s, p) => s + p.currentValue, 0);
  const totalValue = taxableValue + retirementValue;
  const totalGainLoss = [...taxablePositions, ...retirementPositions].reduce((s, p) => s + p.gainLoss, 0);
  const totalCostBasis = [...taxablePositions, ...retirementPositions].reduce((s, p) => s + p.totalCostBasis, 0);
  const totalGrowthPct = totalCostBasis > 0 ? totalGainLoss / totalCostBasis : 0;
  const taxablePct = totalValue > 0 ? (taxableValue / totalValue) * 100 : 50;
  const retirementPct = 100 - taxablePct;

  // Market index display (SPY ≈ S&P/10, QQQ ≈ NASDAQ/100, DIA ≈ DJIA/100)
  const sp500 = marketIndices['SPY'];
  const nasdaq = marketIndices['QQQ'];
  const djia = marketIndices['DIA'];

  if (loading) return <LoadingState centered />;

  return (
    <StepShell
      title="Investments"
      subtitle="Track and manage investment portfolio"
      stepName="Investments"
      onBack={goBack}
      onSkip={goSkip}
      onNext={handleSave}
      saving={saving}
      readOnly={readOnly}
    >
      {/* ── Combined Portfolio Summary ── */}
      <SectionHeader title="Combined Portfolio Summary" />

      <KpiGrid cols={4}>
        <KpiCard label="Total Value" value={pricesLoading ? '…' : formatDollars(totalValue)} sub={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`} />
        <KpiCard
          tone={totalGainLoss >= 0 ? 'success' : 'danger'}
          label="Total Gain / Loss"
          value={pricesLoading ? '…' : fmtGain(totalGainLoss)}
          sub="unrealized"
        />
        <KpiCard
          tone={totalGainLoss >= 0 ? 'success' : 'danger'}
          label="Growth %"
          value={pricesLoading ? '…' : fmtPct(totalGrowthPct)}
          sub="vs total cost basis"
        />
        <KpiCard label="Total Cost Basis" value={formatDollars(totalCostBasis)} sub="total invested" />
      </KpiGrid>

      <SplitBarWrap>
        <p style={{ fontSize: 10, fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0' }}>Portfolio Split</p>
        <SplitBar>
          <SplitSegment pct={taxablePct} bg={colors.primary} />
          <SplitSegment pct={retirementPct} bg={semanticColors.successTextMedium} />
        </SplitBar>
        <SplitLegend>
          <LegendDot bg={colors.primary}>
            Investments: {formatDollars(taxableValue)} ({taxablePct.toFixed(0)}%)
          </LegendDot>
          <LegendDot bg={semanticColors.successTextMedium}>
            Retirement: {formatDollars(retirementValue)} ({retirementPct.toFixed(0)}%)
          </LegendDot>
        </SplitLegend>
      </SplitBarWrap>

      {/* ── Market Reference ── */}
      <MarketStrip>
        <MarketTag>Market</MarketTag>
        <MarketItem>
          <MarketName>S&amp;P 500 (SPY)</MarketName>
          <MarketVal up={sp500 !== undefined ? true : undefined}>
            {sp500 ? `$${toDollars(sp500).toFixed(2)}` : pricesLoading ? '…' : '—'}
          </MarketVal>
        </MarketItem>
        <MarketItem>
          <MarketName>NASDAQ (QQQ)</MarketName>
          <MarketVal up={nasdaq !== undefined ? true : undefined}>
            {nasdaq ? `$${toDollars(nasdaq).toFixed(2)}` : pricesLoading ? '…' : '—'}
          </MarketVal>
        </MarketItem>
        <MarketItem>
          <MarketName>DJIA (DIA)</MarketName>
          <MarketVal up={djia !== undefined ? true : undefined}>
            {djia ? `$${toDollars(djia).toFixed(2)}` : pricesLoading ? '…' : '—'}
          </MarketVal>
        </MarketItem>
        {!pricesLoading && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: semanticColors.neutralText }}>
            Live prices via Yahoo Finance
          </span>
        )}
        {pricesLoading && (
          <span style={{ marginLeft: 'auto', fontSize: 10, color: colors.textDisabled, fontStyle: 'italic' }}>
            Fetching live prices…
          </span>
        )}
      </MarketStrip>

      {/* ── Investment Accounts (Taxable) ── */}
      {taxableAccounts.length > 0 && (
        <InvestmentSection
          title="Investment Accounts (Taxable)"
          isRetirement={false}
          accounts={taxableAccounts}
          positions={taxablePositions}
          livePrices={livePrices}
          pricesLoading={pricesLoading}
          readOnly={readOnly}
          categoryColorMap={categoryColorMap}
          onAddPurchase={(id) => { setAddDefaultAccountId(id); setShowAddModal(true); }}
        />
      )}

      {/* ── Retirement Accounts ── */}
      {retirementAccounts.length > 0 && (
        <InvestmentSection
          title="Retirement Accounts"
          isRetirement
          accounts={retirementAccounts}
          positions={retirementPositions}
          livePrices={livePrices}
          pricesLoading={pricesLoading}
          readOnly={readOnly}
          categoryColorMap={categoryColorMap}
          onAddPurchase={(id) => { setAddDefaultAccountId(id); setShowAddModal(true); }}
        />
      )}

      {accounts.length === 0 && (
        <p style={{ color: colors.textMuted, fontStyle: 'italic' }}>
          No investment accounts configured. Add accounts via Settings.
        </p>
      )}

      {showAddModal && (
        <AddPurchaseModal
          accounts={accounts}
          categories={invCategories}
          defaultAccountId={addDefaultAccountId}
          onClose={() => setShowAddModal(false)}
          onAdded={handlePurchaseAdded}
        />
      )}
    </StepShell>
  );
}
