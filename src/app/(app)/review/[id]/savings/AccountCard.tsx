'use client';

import React, { useMemo } from 'react';
import { formatDollars, toDollars } from '@/lib/money';
import { InlineEdit } from '@/components/shared/InlineEdit';
import { theme } from '@/styles/tokens';

const { colors } = theme;
import { MONTH_NAMES_SHORT } from '@/lib/fire';
import type { SavingsAccount, SavingsSnapshot, HistoricalSnapshot } from '@/types/entities';
import type { ReviewPeriod } from '@/types/review';
export type { ReviewPeriod };
import {
  AccountRow, AccountRowHeader, AccountIcon, AccountName, AccountMeta, MetaItem,
  MetaLabel, MetaValue, ChevronIcon, ExpandedPanel, EditingBadge, SnapKpiRow,
  SnapKpi, SnapKpiLabel, SnapKpiValue, HistoryTable, HistoryThead, HistoryTh,
  HistoryTr, HistoryTd, GoalPercent, CurrentDot, MutedDash, EmptyTd,
  DepositSpan, GrowthSpan, AddRowBtn,
} from './AccountCard.styles';

export interface HistoricalSnapshotWithBalance extends HistoricalSnapshot {
  computedEndBalance: number;
}

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
