'use client';

import React, { useMemo } from 'react';
import styled from 'styled-components';
import { formatDollars, toDollars } from '@/lib/money';
import { InlineEdit } from '@/components/shared/InlineEdit';
import { colors, font, spacing, radius, semanticColors } from '@/styles/tokens';
import { MONTH_NAMES_SHORT } from '@/lib/fire';
import type { SavingsAccount, SavingsSnapshot, HistoricalSnapshot } from '@/types/entities';


export interface HistoricalSnapshotWithBalance extends HistoricalSnapshot {
  computedEndBalance: number;
}

export interface ReviewPeriod { id: number; periodYear: number; periodMonth: number }

const AccountRow = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  margin-bottom: ${spacing[2]};
  overflow: visible;
`;

const AccountRowHeader = styled.button.withConfig({
  shouldForwardProp: (p) => p !== 'expanded',
})<{ expanded: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${spacing[4]};
  padding: 16px ${spacing[5]};
  background: ${({ expanded }) => expanded ? colors.primaryLight : colors.surface};
  border: none;
  cursor: pointer;
  text-align: left;
  border-radius: ${({ expanded }) => expanded ? `${radius.lg} ${radius.lg} 0 0` : radius.lg};
  transition: background 120ms ease;
  &:hover { background: ${colors.bg}; }
`;

const AccountIcon = styled.span`font-size: 22px; flex-shrink: 0;`;

const AccountName = styled.span`
  flex: 1;
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
  text-align: left;
`;

const AccountMeta = styled.div`display: flex; align-items: center; gap: ${spacing[5]};`;

const MetaItem = styled.div`display: flex; flex-direction: column; align-items: flex-end; gap: 2px;`;

const MetaLabel = styled.span`font-size: ${font.size.xs}; color: ${colors.textMuted};`;

const MetaValue = styled.span.withConfig({
  shouldForwardProp: (p) => p !== 'textColor',
})<{ textColor?: string }>`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${({ textColor }) => textColor ?? colors.textPrimary};
`;

const ChevronIcon = styled.span.withConfig({
  shouldForwardProp: (p) => p !== 'open',
})<{ open: boolean }>`
  font-size: 12px;
  color: ${colors.textMuted};
  transform: ${({ open }) => open ? 'rotate(90deg)' : 'rotate(0deg)'};
  transition: transform 180ms ease;
  flex-shrink: 0;
  margin-left: ${spacing[2]};
`;

const ExpandedPanel = styled.div`border-top: 1px solid ${colors.border}; background: ${colors.bg};`;

const EditingBadge = styled.span`
  font-size: ${font.size.xs}; font-weight: ${font.weight.medium};
  padding: 2px 8px; border-radius: ${radius.full};
  background: ${colors.primaryLight}; color: ${semanticColors.primaryTextDark}; border: 1px solid ${colors.primary};
  margin-left: ${spacing[2]};
`;

const SnapKpiRow = styled.div`
  display: flex; gap: ${spacing[3]}; padding: 14px ${spacing[5]}; flex-wrap: wrap;
`;

const SnapKpi = styled.div`
  background: ${colors.surface}; border: 1px solid ${colors.border};
  border-radius: ${radius.md}; padding: 10px 14px; min-width: 120px; flex: 1;
`;

const SnapKpiLabel = styled.p`
  font-size: 10px; font-weight: ${font.weight.semibold}; color: ${colors.textMuted};
  text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;
`;

const SnapKpiValue = styled.div.withConfig({
  shouldForwardProp: (p) => p !== 'textColor',
})<{ textColor?: string }>`
  font-size: ${font.size.lg}; font-weight: ${font.weight.bold};
  color: ${({ textColor }) => textColor ?? colors.textPrimary};
`;

const HistoryTable = styled.table`width: 100%; border-collapse: collapse;`;
const HistoryThead = styled.thead`background: ${colors.bg};`;
const HistoryTh = styled.th`
  padding: 8px ${spacing[4]}; font-size: ${font.size.xs}; font-weight: ${font.weight.semibold};
  color: ${colors.textMuted}; text-align: center; border-bottom: 1px solid ${colors.border};
  &:first-child { text-align: left; }
`;
const HistoryTr = styled.tr.withConfig({
  shouldForwardProp: (p) => p !== 'isCurrentMonth',
})<{ isCurrentMonth: boolean }>`
  background: ${({ isCurrentMonth }) => isCurrentMonth ? colors.primaryLight : colors.surface};
  &:nth-child(even) { background: ${({ isCurrentMonth }) => isCurrentMonth ? colors.primaryLight : colors.bg}; }
  &:last-child td { border-bottom: none; }
`;
const HistoryTd = styled.td.withConfig({ shouldForwardProp: (p) => p !== 'bold' })<{ bold?: boolean }>`
  padding: 10px ${spacing[4]}; font-size: ${font.size.sm}; color: ${colors.textPrimary};
  border-bottom: 1px solid ${colors.border}; text-align: center;
  font-weight: ${({ bold }) => bold ? font.weight.semibold : font.weight.normal};
  &:first-child { text-align: left; font-weight: ${font.weight.medium}; }
`;

const GoalPercent = styled.span`
  margin-left: 8px;
  color: ${colors.primary};
  font-weight: ${font.weight.semibold};
`;

const CurrentDot = styled.span`
  margin-left: 6px;
  font-size: ${font.size.xs};
  color: ${colors.primary};
  font-weight: ${font.weight.semibold};
`;

const MutedDash = styled.span`color: ${colors.textMuted};`;

const EmptyTd = styled(HistoryTd)`
  text-align: center;
  color: ${colors.textMuted};
  font-style: italic;
`;

const DepositSpan = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'zero' })<{ zero: boolean }>`
  color: ${({ zero }) => zero ? colors.textMuted : colors.textPrimary};
`;

const GrowthSpan = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'positive' })<{ positive: boolean }>`
  color: ${({ positive }) => positive ? colors.success : colors.danger};
  font-weight: ${font.weight.medium};
`;

const AddRowBtn = styled.button`
  width: 100%; padding: 9px ${spacing[4]};
  border: none; border-top: 1px dashed ${colors.border};
  background: transparent; color: ${colors.primary};
  font-size: ${font.size.sm}; font-weight: ${font.weight.medium};
  cursor: pointer; text-align: left;
  display: flex; align-items: center; gap: 6px;
  &:hover { background: ${colors.primaryLight}; }
`;

interface AccountCardProps {
  account: SavingsAccount;
  snap: SavingsSnapshot;
  isExpanded: boolean;
  history: HistoricalSnapshotWithBalance[];
  allReviews: ReviewPeriod[];
  currentReviewId: number;
  readOnly: boolean;
  onToggleExpand: (id: number) => void;
  onSaveRowField: (accountId: number, reviewId: number, field: 'startingBalance' | 'deposits' | 'interest', value: string) => Promise<void>;
  onSaveAccountField: (accountId: number, field: 'rate' | 'goal', value: string) => Promise<void>;
  onAddNewRow: (accountId: number, reviewId: number) => Promise<void>;
}

export const AccountCard = React.memo(function AccountCard({
  account, snap, isExpanded, history, allReviews, currentReviewId, readOnly,
  onToggleExpand, onSaveRowField, onSaveAccountField, onAddNewRow,
}: AccountCardProps) {
  const rate = account.rate ?? 0;
  const goal = account.goal ?? 0;

  const currentBalance = useMemo(
    () => (history.length > 0 ? history[history.length - 1].computedEndBalance : 0),
    [history],
  );
  const firstRow = history[0];
  const startingBalance = firstRow ? firstRow.startingBalance : snap.startingBalance;
  const firstRowReviewId = firstRow ? firstRow.reviewId : currentReviewId;
  const currentReviewYear = allReviews.find((r) => r.id === currentReviewId)?.periodYear ?? new Date().getFullYear();
  const ytdGrowth = useMemo(
    () => history
      .filter((row) => row.review.periodYear === currentReviewYear)
      .reduce((sum, row) => sum + row.deposits + row.interest, 0),
    [history, currentReviewYear],
  );

  return (
    <AccountRow>
      <AccountRowHeader expanded={isExpanded} onClick={() => onToggleExpand(account.id)}>
        <AccountIcon>🏦</AccountIcon>
        <AccountName>
          {account.name}
          {isExpanded && <EditingBadge>✏️ Editing</EditingBadge>}
        </AccountName>

        <AccountMeta>
          <MetaItem>
            <MetaLabel>Balance</MetaLabel>
            <MetaValue>{formatDollars(currentBalance)}</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaLabel>Rate</MetaLabel>
            <MetaValue textColor={colors.success}>{(rate * 100).toFixed(2)}%</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaLabel>YTD Growth</MetaLabel>
            <MetaValue textColor={ytdGrowth >= 0 ? colors.success : colors.danger}>
              {ytdGrowth >= 0 ? '+' : ''}{formatDollars(ytdGrowth)}
            </MetaValue>
          </MetaItem>
        </AccountMeta>

        <ChevronIcon open={isExpanded}>▶</ChevronIcon>
      </AccountRowHeader>

      {isExpanded && (
        <ExpandedPanel>
          <SnapKpiRow>
            <SnapKpi>
              <SnapKpiLabel>Starting Balance</SnapKpiLabel>
              <SnapKpiValue>
                {readOnly ? (
                  formatDollars(startingBalance)
                ) : (
                  <InlineEdit
                    value={toDollars(startingBalance).toFixed(2)}
                    type="number"
                    onSave={(v) => onSaveRowField(account.id, firstRowReviewId, 'startingBalance', v)}
                  />
                )}
              </SnapKpiValue>
            </SnapKpi>
            <SnapKpi>
              <SnapKpiLabel>Current Balance</SnapKpiLabel>
              <SnapKpiValue>{formatDollars(currentBalance)}</SnapKpiValue>
            </SnapKpi>
            <SnapKpi>
              <SnapKpiLabel>Interest Rate (APY %)</SnapKpiLabel>
              <SnapKpiValue textColor={colors.success}>
                {readOnly ? (
                  `${(rate * 100).toFixed(2)}%`
                ) : (
                  <InlineEdit
                    value={(rate * 100).toFixed(2)}
                    onSave={(v) => onSaveAccountField(account.id, 'rate', v)}
                    color={colors.success}
                  />
                )}
              </SnapKpiValue>
            </SnapKpi>
            <SnapKpi>
              <SnapKpiLabel>
                Savings Goal
                {goal > 0 && (
                  <GoalPercent>
                    {((currentBalance / goal) * 100).toFixed(1)}%
                  </GoalPercent>
                )}
              </SnapKpiLabel>
              <SnapKpiValue>
                {readOnly ? (
                  goal > 0 ? formatDollars(goal) : <MutedDash>—</MutedDash>
                ) : (
                  <InlineEdit
                    value={goal > 0 ? toDollars(goal).toFixed(2) : ''}
                    type="number"
                    placeholder="Set a goal…"
                    onSave={(v) => onSaveAccountField(account.id, 'goal', v)}
                  />
                )}
              </SnapKpiValue>
            </SnapKpi>
          </SnapKpiRow>

          <HistoryTable>
            <HistoryThead>
              <tr>
                <HistoryTh>Month</HistoryTh>
                <HistoryTh>Input (+/-)</HistoryTh>
                <HistoryTh>Interest</HistoryTh>
                <HistoryTh>Growth</HistoryTh>
                <HistoryTh>End Balance</HistoryTh>
              </tr>
            </HistoryThead>
            <tbody>
              {history.map((row) => {
                const isCurrent = row.reviewId === currentReviewId;
                const growth = row.deposits + row.interest;
                return (
                  <HistoryTr key={`${row.accountId}-${row.reviewId}`} isCurrentMonth={isCurrent}>
                    <HistoryTd>
                      {MONTH_NAMES_SHORT[row.review.periodMonth - 1]} {row.review.periodYear}
                      {isCurrent && <CurrentDot>● Current</CurrentDot>}
                    </HistoryTd>
                    <HistoryTd>
                      {!readOnly ? (
                        <InlineEdit
                          value={toDollars(row.deposits).toFixed(2)}
                          type="number"
                          onSave={(v) => onSaveRowField(account.id, row.reviewId, 'deposits', v)}
                        />
                      ) : (
                        <DepositSpan zero={row.deposits === 0}>
                          {formatDollars(row.deposits)}
                        </DepositSpan>
                      )}
                    </HistoryTd>
                    <HistoryTd>
                      {!readOnly ? (
                        <InlineEdit
                          value={toDollars(row.interest).toFixed(2)}
                          type="number"
                          color={colors.success}
                          onSave={(v) => onSaveRowField(account.id, row.reviewId, 'interest', v)}
                        />
                      ) : (
                        <span style={{ color: colors.success }}>{formatDollars(row.interest)}</span>
                      )}
                    </HistoryTd>
                    <HistoryTd>
                      <GrowthSpan positive={growth >= 0}>
                        {growth >= 0 ? '+' : ''}{formatDollars(growth)}
                      </GrowthSpan>
                    </HistoryTd>
                    <HistoryTd bold>{formatDollars(row.computedEndBalance)}</HistoryTd>
                  </HistoryTr>
                );
              })}
              {history.length === 0 && (
                <tr>
                  <EmptyTd colSpan={5}>
                    No entries yet — add a month below.
                  </EmptyTd>
                </tr>
              )}
            </tbody>
          </HistoryTable>

          {!readOnly && (() => {
            const coveredReviewIds = new Set(history.map((r) => r.reviewId));
            const available = allReviews.filter((r) => !coveredReviewIds.has(r.id));
            if (available.length === 0) return null;
            const next = available[available.length - 1];
            return (
              <AddRowBtn onClick={() => onAddNewRow(account.id, next.id)}>
                + Add Month ({MONTH_NAMES_SHORT[next.periodMonth - 1]} {next.periodYear})
              </AddRowBtn>
            );
          })()}
        </ExpandedPanel>
      )}
    </AccountRow>
  );
});
