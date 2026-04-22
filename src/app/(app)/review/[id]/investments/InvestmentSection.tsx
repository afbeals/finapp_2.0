'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { formatDollars, toDollars } from '@/lib/money';
import { colors, semanticColors, font, spacing, radius, shadow } from '@/styles/tokens';
import type { InvestmentAccount } from '@/types/entities';
import {
  type Position,
  AccountTypeLabel,
  acctBadge,
  categoryColorFromMap,
  fmtGain,
  fmtPct,
  portPct,
} from './investmentHelpers';

// ─── Styled components ────────────────────────────────────────────────────────

const SectionWrap = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  margin-bottom: ${spacing[4]};
  box-shadow: ${shadow.sm};
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
  font-size: ${font.size.xs};
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
const HStatLabel = styled.span`font-size: ${font.size.micro}; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.04em;`;
const HStatVal = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'textColor' })<{ textColor?: string }>`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${({ textColor }) => textColor ?? colors.textPrimary};
`;

const ExpandLink = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'green' })<{ green?: boolean }>`
  margin-left: auto;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${({ green }) => green ? semanticColors.successTextMedium : colors.primary};
  white-space: nowrap;
  padding: 0 4px;
`;

const PositionBadge = styled.span`
  font-size: ${font.size.xxs};
  color: ${colors.textMuted};
  background: ${colors.bg};
  border: 1px solid ${colors.border};
  border-radius: ${radius.full};
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
  font-size: ${font.size.xxs};
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
  font-weight: ${({ bold }) => bold ? font.weight.semibold : 'normal'};
  white-space: nowrap;
  color: ${colors.textPrimary};
`;

const CategoryBadge = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'bg' && p !== 'fg' })<{ bg: string; fg: string }>`
  display: inline-block;
  padding: 1px 7px;
  border-radius: ${radius.full};
  font-size: ${font.size.xxs};
  font-weight: ${font.weight.semibold};
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

// ─── InvestmentSection ────────────────────────────────────────────────────────

export interface SectionProps {
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

export function InvestmentSection({
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
