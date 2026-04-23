'use client';

import React, { useState } from 'react';
import { formatDollars, toDollars } from '@/lib/money';
import { theme } from '@/styles/tokens';
import {
  SectionWrap, SectionHeaderRow, Chevron, SectionName, HeaderStats, HStat, HStatLabel, HStatVal,
  ExpandLink, PositionBadge, ExpandedWrap, SubHeader, FilterInput, FilterSelect, CollapseBtn,
  TableScroll, HTable, HThead, HTh, HTr, HTd, CategoryBadge, AccountChip, PriceSpinner, AddPurchaseBtn, TagScroller,
} from './InvestmentSection.styles';
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

const { colors, semanticColors } = theme;

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
  onEditAccount?: (accountId: number) => void;
  onDeleteAccount?: (accountId: number) => void;
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
  onEditAccount,
  onDeleteAccount,
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
          {(onEditAccount || onDeleteAccount) && accounts.length > 0 && (
            <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {accounts.map((a) => {
                const b = acctColorMap[a.id];
                return (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: b.bg, borderRadius: 6, padding: '4px 10px' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: b.fg }}>{a.name}</span>
                    {onEditAccount && (
                      <button
                        onClick={() => onEditAccount(a.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontSize: 11, color: b.fg, opacity: 0.8 }}
                        title="Edit account"
                      >✏️</button>
                    )}
                    {onDeleteAccount && (
                      <button
                        onClick={() => onDeleteAccount(a.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', fontSize: 11, color: b.fg, opacity: 0.8 }}
                        title="Delete account"
                      >🗑️</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
                  <HTh>Account(s)</HTh>
                  <HTh>Category</HTh>
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
                    <React.Fragment key={pos.ticker}>
                    <HTr>
                      <HTd bold>{pos.ticker}</HTd>
                      <HTd style={{ color: colors.textMuted, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{pos.name}</HTd>
                      <HTd>
                        {pos.accountIds.length > 0 ? pos.accountIds.map((aid) => {
                          const acct = accounts.find((a) => a.id === aid);
                          if (!acct) return null;
                          const badge = acctColorMap[aid];
                          return <AccountChip key={aid} bg={badge.bg} fg={badge.fg}>{acct.name}</AccountChip>;
                        }) : <span style={{ color: colors.textMuted }}>—</span>}
                      </HTd>
                      <HTd>
                        {pos.category ? (
                          <CategoryBadge bg={categoryColorFromMap(categoryColorMap, pos.category).bg} fg={categoryColorFromMap(categoryColorMap, pos.category).fg}>{pos.category}</CategoryBadge>
                        ) : (
                          <span style={{ color: colors.textMuted }}>—</span>
                        )}
                      </HTd>
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
                    </React.Fragment>
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
