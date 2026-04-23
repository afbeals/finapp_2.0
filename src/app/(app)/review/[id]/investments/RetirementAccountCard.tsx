'use client';

import React, { useMemo } from 'react';
import { formatDollars, toDollars } from '@/lib/money';
import { InlineEdit } from '@/components/shared/InlineEdit';
import { theme } from '@/styles/tokens';
import {
  Card, CardHeaderBtn, Icon, TitleCol, Name, SubRow, TypeBadge, SubText, OwnerChip,
  Meta, MetaItem, MetaLabel, MetaValue, Chevron, Panel, KpiRow, Kpi, KpiLabel, KpiValue,
  Actions, ActionBtn, HistoryTable, Thead, Th, Tr, Td, EmptyTd, GrowthSpan, CurrentDot, AddRowBtn,
} from './RetirementAccountCard.styles';
import { MONTH_NAMES_SHORT } from '@/lib/fire';
import { accountTypeLabel } from '@/app/(app)/config/configHelpers';
import type { InvestmentAccount, HistoricalRetirementSnapshot } from '@/types/entities';

const { colors } = theme;

type ReviewPeriodLite = { id: number; periodYear: number; periodMonth: number };

interface Props {
  account: InvestmentAccount;
  currentBalance: number;
  history: HistoricalRetirementSnapshot[];
  allReviews: ReviewPeriodLite[];
  currentReviewId: number;
  readOnly: boolean;
  isExpanded: boolean;
  onToggleExpand: (id: number) => void;
  onSaveBalance: (accountId: number, reviewId: number, balanceDollars: string) => Promise<void>;
  onAddHistoryRow: (accountId: number, reviewId: number) => Promise<void>;
  onEdit: (accountId: number) => void;
  onDelete: (accountId: number) => void;
}

export const RetirementAccountCard = React.memo(function RetirementAccountCard({
  account,
  currentBalance,
  history,
  allReviews,
  currentReviewId,
  readOnly,
  isExpanded,
  onToggleExpand,
  onSaveBalance,
  onAddHistoryRow,
  onEdit,
  onDelete,
}: Props) {
  const sortedHistory = useMemo(
    () =>
      [...history].sort((a, b) => {
        const ay = a.review.periodYear;
        const by = b.review.periodYear;
        if (ay !== by) return ay - by;
        return a.review.periodMonth - b.review.periodMonth;
      }),
    [history],
  );

  const currentIndex = sortedHistory.findIndex((r) => r.reviewId === currentReviewId);
  const prevBalance =
    currentIndex > 0
      ? sortedHistory[currentIndex - 1].balance
      : currentIndex === -1 && sortedHistory.length > 0
        ? sortedHistory[sortedHistory.length - 1].balance
        : 0;
  const growth = currentBalance - prevBalance;
  const growthPct = prevBalance > 0 ? (growth / prevBalance) * 100 : 0;

  return (
    <Card>
      <CardHeaderBtn expanded={isExpanded} onClick={() => onToggleExpand(account.id)}>
        <Icon>🏛️</Icon>
        <TitleCol>
          <Name>{account.name}</Name>
          <SubRow>
            <TypeBadge>{accountTypeLabel(account.type)}</TypeBadge>
            {account.institution && <SubText>{account.institution}</SubText>}
            {account.owner && (
              <OwnerChip chipColor={account.owner.color}>{account.owner.name}</OwnerChip>
            )}
          </SubRow>
        </TitleCol>

        <Meta>
          <MetaItem>
            <MetaLabel>Balance</MetaLabel>
            <MetaValue>{formatDollars(currentBalance)}</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaLabel>Growth</MetaLabel>
            <MetaValue textColor={growth >= 0 ? colors.success : colors.danger}>
              {growth >= 0 ? '+' : ''}
              {formatDollars(growth)}
              {prevBalance > 0 && ` (${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1)}%)`}
            </MetaValue>
          </MetaItem>
        </Meta>

        <Chevron open={isExpanded}>▶</Chevron>
      </CardHeaderBtn>

      {isExpanded && (
        <Panel>
          <KpiRow>
            <Kpi>
              <KpiLabel>Current Balance</KpiLabel>
              <KpiValue>
                {readOnly ? (
                  formatDollars(currentBalance)
                ) : (
                  <InlineEdit
                    value={toDollars(currentBalance).toFixed(2)}
                    type="number"
                    onSave={(v) => onSaveBalance(account.id, currentReviewId, v)}
                  />
                )}
              </KpiValue>
            </Kpi>
            <Kpi>
              <KpiLabel>Prior Balance</KpiLabel>
              <KpiValue>{formatDollars(prevBalance)}</KpiValue>
            </Kpi>
            <Kpi>
              <KpiLabel>Growth Since Last</KpiLabel>
              <KpiValue textColor={growth >= 0 ? colors.success : colors.danger}>
                {growth >= 0 ? '+' : ''}
                {formatDollars(growth)}
              </KpiValue>
            </Kpi>
          </KpiRow>

          <HistoryTable>
            <Thead>
              <tr>
                <Th>Month</Th>
                <Th>Balance</Th>
                <Th>Growth</Th>
              </tr>
            </Thead>
            <tbody>
              {sortedHistory.map((row, i) => {
                const isCurrent = row.reviewId === currentReviewId;
                const prior = i > 0 ? sortedHistory[i - 1].balance : 0;
                const rowGrowth = row.balance - prior;
                return (
                  <Tr key={`${row.accountId}-${row.reviewId}`} isCurrentMonth={isCurrent}>
                    <Td>
                      {MONTH_NAMES_SHORT[row.review.periodMonth - 1]} {row.review.periodYear}
                      {isCurrent && <CurrentDot>● Current</CurrentDot>}
                    </Td>
                    <Td>
                      {readOnly ? (
                        formatDollars(row.balance)
                      ) : (
                        <InlineEdit
                          value={toDollars(row.balance).toFixed(2)}
                          type="number"
                          onSave={(v) => onSaveBalance(account.id, row.reviewId, v)}
                        />
                      )}
                    </Td>
                    <Td>
                      {i > 0 ? (
                        <GrowthSpan positive={rowGrowth >= 0}>
                          {rowGrowth >= 0 ? '+' : ''}
                          {formatDollars(rowGrowth)}
                        </GrowthSpan>
                      ) : (
                        <span style={{ color: colors.textMuted }}>—</span>
                      )}
                    </Td>
                  </Tr>
                );
              })}
              {sortedHistory.length === 0 && (
                <tr>
                  <EmptyTd colSpan={3}>No entries yet — set a balance above.</EmptyTd>
                </tr>
              )}
            </tbody>
          </HistoryTable>

          {!readOnly &&
            (() => {
              const coveredReviewIds = new Set(sortedHistory.map((r) => r.reviewId));
              const available = allReviews.filter((r) => !coveredReviewIds.has(r.id));
              if (available.length === 0) return null;
              const next = available[available.length - 1];
              return (
                <AddRowBtn onClick={() => onAddHistoryRow(account.id, next.id)}>
                  + Add Month ({MONTH_NAMES_SHORT[next.periodMonth - 1]} {next.periodYear})
                </AddRowBtn>
              );
            })()}

          {!readOnly && (
            <Actions>
              <ActionBtn onClick={() => onEdit(account.id)}>✏️ Edit Details</ActionBtn>
              <ActionBtn tone="danger" onClick={() => onDelete(account.id)}>🗑️ Delete Account</ActionBtn>
            </Actions>
          )}
        </Panel>
      )}
    </Card>
  );
});
