'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/styles/tokens';
import {
  Page, WelcomeBanner, WelcomeText, WelcomeGreeting, CardRow,
  ActiveCard, ActiveBadgeRow, ReviewTitle,
  PrevCard, PrevCardLabel, PrevSelect,
  EmptyCard, EmptyIcon, EmptyTitle, EmptySubtitle,
  SectionTitle, ClickableRow, NetChange,
} from './DashboardPage.styles';
import { LoadingState } from '@/components/shared/LoadingState';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, Thead, Th, Td } from '@/components/ui/Table';
import { NewReviewModal } from '@/components/modals/NewReviewModal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useReviewStore, useSessionStore } from '@/lib/store';
import type { ReviewStep } from '@/lib/store';
import { formatDollars } from '@/lib/money';
import { apiGet } from '@/lib/api';
import { MONTH_NAMES_SHORT, MONTH_NAMES_LONG } from '@/lib/fire';

const { colors, font, spacing } = theme;

interface Review {
  id: number;
  periodYear: number;
  periodMonth: number;
  type: 'MONTHLY' | 'QUARTERLY';
  status: 'IN_PROGRESS' | 'COMPLETE' | 'SKIPPED';
  currentStep: string;
  lockedForEdit: boolean;
  completedAt: string | null;
  steps: ReviewStep[];
  totalIncome: number;
  totalExpenses: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { actions: reviewActions } = useReviewStore();
  const { state: sessionState } = useSessionStore();
  const activeMemberName = sessionState.memberName ?? 'there';

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const { reviews: data } = await apiGet<{ reviews: Review[] }>('/api/reviews');
      setReviews(data);
      const active = data.find((r: Review) => r.status === 'IN_PROGRESS');
      reviewActions.setActiveReview(active ?? null);
    } catch {
      // ignore fetch errors on load
    } finally {
      setLoading(false);
    }
  }, [reviewActions]);

  useEffect(() => { load(); }, [load]);

  const activeReview = reviews.find((r) => r.status === 'IN_PROGRESS');
  const history = reviews.filter((r) => r.status !== 'IN_PROGRESS');

  useEffect(() => {
    if (history.length > 0 && selectedHistoryId === null) {
      setSelectedHistoryId(history[0].id);
    }
  }, [history, selectedHistoryId]);

  function handleContinueReview() {
    if (!activeReview) return;
    router.push(`/review/${activeReview.id}/${activeReview.currentStep}`);
  }

  async function handleReviewCreated(review: Omit<Review, 'totalIncome' | 'totalExpenses'>) {
    const full: Review = { ...review, totalIncome: 0, totalExpenses: 0 };
    setShowNewModal(false);
    setReviews((prev) => [full, ...prev]);
    reviewActions.setActiveReview(full);
    router.push(`/review/${full.id}/expense`);
  }

  if (loading) {
    return <Page><LoadingState centered /></Page>;
  }

  const greeting = `Welcome back, ${activeMemberName}`;

  return (
    <Page>
      {/* Welcome banner */}
      <WelcomeBanner>
        <WelcomeText>
          <span style={{ fontSize: font.size['3xl'] }}>👋</span>
          <WelcomeGreeting>{greeting}</WelcomeGreeting>
        </WelcomeText>
        {!activeReview && (
          <Button onClick={() => setShowNewModal(true)}>+ New Review</Button>
        )}
      </WelcomeBanner>

      {/* Active review + previous month side by side */}
      <CardRow>
        {/* Left: active review or empty state */}
        {activeReview ? (
          <ActiveCard padding="md">
            <ActiveBadgeRow>
              <Badge variant="primary">In Progress</Badge>
              <Badge variant={activeReview.type === 'QUARTERLY' ? 'quarterly' : 'default'}>
                {activeReview.type === 'QUARTERLY' ? 'Quarterly' : 'Monthly'}
              </Badge>
            </ActiveBadgeRow>
            <ReviewTitle>
              {MONTH_NAMES_LONG[activeReview.periodMonth - 1]} {activeReview.periodYear}
            </ReviewTitle>
            <div style={{ marginBottom: spacing[4] }}>
              {(() => {
                const done = activeReview.steps.filter((s) => s.status !== 'PENDING').length;
                const total = activeReview.steps.length;
                const pct = Math.round((done / total) * 100);
                const currentIdx = activeReview.steps.findIndex((s) => s.stepKey === activeReview.currentStep);
                const stepNum = currentIdx >= 0 ? currentIdx + 1 : done + 1;
                return (
                  <>
                    <ProgressBar value={pct} color={colors.primary} />
                    <span style={{ display: 'block', fontSize: font.size.sm, color: colors.textMuted, marginTop: 6 }}>
                      Step {stepNum} of {total} &nbsp;•&nbsp; {pct}% complete
                    </span>
                  </>
                );
              })()}
            </div>
            <Button onClick={handleContinueReview}>
              Continue Review →
            </Button>
          </ActiveCard>
        ) : (
          <EmptyCard padding="md">
            <EmptyIcon>📋</EmptyIcon>
            <EmptyTitle>No active review</EmptyTitle>
            <EmptySubtitle>Start a monthly or quarterly review to track your household finances.</EmptySubtitle>
            <Button size="lg" onClick={() => setShowNewModal(true)}>+ Start New Review</Button>
          </EmptyCard>
        )}

        {/* Right: review previous month */}
        <PrevCard padding="md">
          <PrevCardLabel>📂 Review Previous Month</PrevCardLabel>
          <p style={{ fontSize: font.size.sm, color: colors.textMuted, marginBottom: spacing[4] }}>
            Select a past month to view your completed financial review.
          </p>
          {history.length > 0 ? (
            <>
              <PrevSelect
                value={selectedHistoryId ?? ''}
                onChange={(e) => setSelectedHistoryId(Number(e.target.value))}
              >
                {history.map((r) => (
                  <option key={r.id} value={r.id}>
                    {MONTH_NAMES_LONG[r.periodMonth - 1]} {r.periodYear}
                  </option>
                ))}
              </PrevSelect>
              <Button
                variant="secondary"
                style={{ width: '100%' }}
                disabled={selectedHistoryId === null}
                onClick={() => selectedHistoryId && router.push(`/history/${selectedHistoryId}`)}
              >
                Open Review →
              </Button>
            </>
          ) : (
            <p style={{ fontSize: font.size.sm, color: colors.textMuted }}>No completed reviews yet.</p>
          )}
        </PrevCard>
      </CardRow>

      {/* History table */}
      <SectionTitle>Review History</SectionTitle>
      {history.length === 0 ? (
        <p style={{ color: colors.textMuted, fontSize: font.size.base }}>No completed reviews yet.</p>
      ) : (
        <Card padding="sm">
          <Table>
            <Thead>
              <tr>
                <Th>Month</Th>
                <Th>Type</Th>
                <Th>Net Change</Th>
                <Th>Completed</Th>
                <Th>Status</Th>
              </tr>
            </Thead>
            <tbody>
              {history.map((review) => {
                const net = review.totalIncome - review.totalExpenses;
                const positive = net >= 0;
                return (
                  <ClickableRow key={review.id} onClick={() => router.push(`/history/${review.id}`)}>
                    <Td style={{ fontWeight: font.weight.medium }}>
                      {MONTH_NAMES_SHORT[review.periodMonth - 1]} {review.periodYear}
                    </Td>
                    <Td>
                      <Badge variant={review.type === 'QUARTERLY' ? 'quarterly' : 'default'}>
                        {review.type === 'QUARTERLY' ? 'Quarterly' : 'Monthly'}
                      </Badge>
                    </Td>
                    <Td>
                      {review.totalIncome > 0 || review.totalExpenses > 0 ? (
                        <NetChange positive={positive}>
                          {positive ? '↗' : '↘'}
                          {positive ? '+' : ''}{formatDollars(net)}
                        </NetChange>
                      ) : (
                        <span style={{ color: colors.textMuted, fontSize: font.size.sm }}>—</span>
                      )}
                    </Td>
                    <Td>
                      {review.completedAt
                        ? new Date(review.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </Td>
                    <Td>
                      <Badge variant={review.status === 'COMPLETE' ? 'success' : 'default'}>
                        {review.status === 'COMPLETE' ? 'Complete' : 'Skipped'}
                      </Badge>
                    </Td>
                  </ClickableRow>
                );
              })}
            </tbody>
          </Table>
        </Card>
      )}

      <NewReviewModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={handleReviewCreated}
        existingMonths={reviews.map((r) => ({ year: r.periodYear, month: r.periodMonth }))}
      />
    </Page>
  );
}
