'use client';

import React, { useMemo } from 'react';
import styled from 'styled-components';
import { formatDollars, toDollars } from '@/lib/money';
import { InlineEdit } from '@/components/shared/InlineEdit';
import { theme } from '@/styles/tokens';

const { colors, font, spacing, radius, semanticColors } = theme;
import { MONTH_NAMES_SHORT } from '@/lib/fire';
import { accountTypeLabel } from '@/app/(app)/config/configHelpers';
import type { InvestmentAccount, HistoricalRetirementSnapshot } from '@/types/entities';

type ReviewPeriodLite = { id: number; periodYear: number; periodMonth: number };

const Card = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  margin-bottom: ${spacing[2]};
  overflow: visible;
`;

const CardHeaderBtn = styled.button.withConfig({
  shouldForwardProp: (p) => p !== 'expanded',
})<{ expanded: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${spacing[4]};
  padding: ${spacing[4]} ${spacing[5]};
  background: ${({ expanded }) => (expanded ? colors.primaryLight : colors.surface)};
  border: none;
  cursor: pointer;
  text-align: left;
  border-radius: ${({ expanded }) => (expanded ? `${radius.lg} ${radius.lg} 0 0` : radius.lg)};
  &:hover { background: ${colors.bg}; }
`;

const Icon = styled.span`font-size: ${font.size['2xl']}; flex-shrink: 0;`;

const TitleCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
`;

const Name = styled.span`
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
`;

const SubRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[2]};
  flex-wrap: wrap;
`;

const TypeBadge = styled.span`
  font-size: ${font.size.xxs};
  font-weight: ${font.weight.semibold};
  color: ${semanticColors.successTextMedium};
  background: ${semanticColors.successBg};
  padding: 2px 8px;
  border-radius: ${radius.full};
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const SubText = styled.span`font-size: ${font.size.xs}; color: ${colors.textMuted};`;

const OwnerChip = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'chipColor' })<{ chipColor: string }>`
  font-size: ${font.size.xxs};
  font-weight: ${font.weight.medium};
  color: ${({ chipColor }) => chipColor};
  background: ${({ chipColor }) => chipColor + '22'};
  padding: 2px 8px;
  border-radius: ${radius.full};
`;

const Meta = styled.div`display: flex; align-items: center; gap: ${spacing[5]};`;
const MetaItem = styled.div`display: flex; flex-direction: column; align-items: flex-end; gap: 2px;`;
const MetaLabel = styled.span`font-size: ${font.size.xs}; color: ${colors.textMuted};`;
const MetaValue = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'textColor' })<{ textColor?: string }>`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${({ textColor }) => textColor ?? colors.textPrimary};
`;

const Chevron = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'open' })<{ open: boolean }>`
  font-size: ${font.size.sm};
  color: ${colors.textMuted};
  transform: ${({ open }) => (open ? 'rotate(90deg)' : 'rotate(0deg)')};
  transition: transform 180ms ease;
  flex-shrink: 0;
  margin-left: ${spacing[2]};
`;

const Panel = styled.div`border-top: 1px solid ${colors.border}; background: ${colors.bg};`;

const KpiRow = styled.div`
  display: flex; gap: ${spacing[3]}; padding: 14px ${spacing[5]}; flex-wrap: wrap;
`;

const Kpi = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  padding: 10px 14px;
  min-width: 140px;
  flex: 1;
`;

const KpiLabel = styled.p`
  font-size: ${font.size.xxs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
`;

const KpiValue = styled.div.withConfig({ shouldForwardProp: (p) => p !== 'textColor' })<{ textColor?: string }>`
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${({ textColor }) => textColor ?? colors.textPrimary};
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${spacing[2]};
  padding: ${spacing[3]} ${spacing[5]};
  border-top: 1px dashed ${colors.border};
`;

const ActionBtn = styled.button.withConfig({ shouldForwardProp: (p) => p !== 'tone' })<{ tone?: 'danger' | 'primary' }>`
  border: none;
  background: transparent;
  color: ${({ tone }) => (tone === 'danger' ? colors.danger : colors.primary)};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  cursor: pointer;
  padding: 6px 10px;
  border-radius: ${radius.sm};
  &:hover { background: ${({ tone }) => (tone === 'danger' ? '#fee2e2' : colors.primaryLight)}; }
`;

const HistoryTable = styled.table`width: 100%; border-collapse: collapse;`;
const Thead = styled.thead`background: ${colors.bg};`;
const Th = styled.th`
  padding: 8px ${spacing[4]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-align: center;
  border-bottom: 1px solid ${colors.border};
  &:first-child { text-align: left; }
`;
const Tr = styled.tr.withConfig({ shouldForwardProp: (p) => p !== 'isCurrentMonth' })<{ isCurrentMonth: boolean }>`
  background: ${({ isCurrentMonth }) => (isCurrentMonth ? colors.primaryLight : colors.surface)};
  &:nth-child(even) { background: ${({ isCurrentMonth }) => (isCurrentMonth ? colors.primaryLight : colors.bg)}; }
  &:last-child td { border-bottom: none; }
`;
const Td = styled.td.withConfig({ shouldForwardProp: (p) => p !== 'bold' })<{ bold?: boolean }>`
  padding: 10px ${spacing[4]};
  font-size: ${font.size.sm};
  color: ${colors.textPrimary};
  border-bottom: 1px solid ${colors.border};
  text-align: center;
  font-weight: ${({ bold }) => (bold ? font.weight.semibold : font.weight.normal)};
  &:first-child { text-align: left; font-weight: ${font.weight.medium}; }
`;
const EmptyTd = styled(Td)`
  text-align: center;
  color: ${colors.textMuted};
  font-style: italic;
`;
const GrowthSpan = styled.span.withConfig({ shouldForwardProp: (p) => p !== 'positive' })<{ positive: boolean }>`
  color: ${({ positive }) => (positive ? colors.success : colors.danger)};
  font-weight: ${font.weight.medium};
`;
const CurrentDot = styled.span`
  margin-left: 6px;
  font-size: ${font.size.xs};
  color: ${colors.primary};
  font-weight: ${font.weight.semibold};
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
