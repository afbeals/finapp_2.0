'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import styled from 'styled-components';
import { StepShell } from '@/components/review/StepShell';
import { useStepNav } from '@/lib/useStepNav';
import { useReviewStore } from '@/lib/store';
import { formatDollars, toCents } from '@/lib/money';
import { apiPatch, apiPost, apiPut, apiGet } from '@/lib/api';
import { colors, font, spacing, radius } from '@/styles/tokens';
import { LoadingState } from '@/components/shared/LoadingState';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { KpiGrid, KpiCard } from '@/components/shared/KpiGrid';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AccountCard, type HistoricalSnapshotWithBalance, type ReviewPeriod } from './AccountCard';
import type { SavingsAccount, SavingsSnapshot, HistoricalSnapshot } from '@/types/entities';

// ─── Add account modal form fields ───────────────────────────────────────────

const FieldLabel = styled.label`
  display: block;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: ${spacing[1]};
`;

const FieldInput = styled.input`
  width: 100%;
  padding: ${spacing[2]} ${spacing[3]};
  font-size: ${font.size.sm};
  font-family: inherit;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface};
  color: ${colors.textPrimary};
  margin-bottom: ${spacing[3]};
  outline: none;
  &:focus { border-color: ${colors.primary}; box-shadow: 0 0 0 2px ${colors.primaryLight}; }
`;

const FieldSelect = styled.select`
  width: 100%;
  padding: ${spacing[2]} ${spacing[3]};
  font-size: ${font.size.sm};
  font-family: inherit;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface};
  color: ${colors.textPrimary};
  margin-bottom: ${spacing[3]};
  outline: none;
  &:focus { border-color: ${colors.primary}; }
`;

const ModalActions = styled.div`
  display: flex;
  gap: ${spacing[2]};
  justify-content: flex-end;
  margin-top: ${spacing[2]};
`;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SavingsPage() {
  const params = useParams();
  const reviewId = params.id as string;
  const { state: reviewState } = useReviewStore();
  const { goNext, goBack, goSkip, saving } = useStepNav('savings');
  const readOnly = reviewState.activeReview?.status === 'COMPLETE' && !reviewState.isEditMode;

  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [snapshots, setSnapshots] = useState<Record<number, SavingsSnapshot>>({});
  const [allSnapshots, setAllSnapshots] = useState<HistoricalSnapshot[]>([]);
  const [allReviews, setAllReviews] = useState<ReviewPeriod[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingAccount, setAddingAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', institution: '', type: 'HYSA' });

  useEffect(() => {
    apiGet<{ accounts: SavingsAccount[]; snapshots: SavingsSnapshot[]; allSnapshots: HistoricalSnapshot[]; allReviews: ReviewPeriod[] }>(`/api/reviews/${reviewId}/savings`)
      .then(({ accounts: accs, snapshots: snaps, allSnapshots: hist, allReviews: revs }) => {
        setAccounts(accs ?? []);
        setAllSnapshots(hist ?? []);
        setAllReviews(revs ?? []);
        const map: Record<number, SavingsSnapshot> = {};
        for (const s of snaps ?? []) map[s.accountId] = s;
        for (const a of accs ?? []) {
          if (!map[a.id]) map[a.id] = { id: 0, accountId: a.id, reviewId: Number(reviewId), startingBalance: 0, deposits: 0, interest: 0, endingBalance: 0 };
        }
        setSnapshots(map);
      })
      .finally(() => setLoading(false));
  }, [reviewId]);

  const saveRowField = useCallback(async (
    accountId: number,
    rowReviewId: number,
    field: 'startingBalance' | 'deposits' | 'interest',
    dollars: string,
  ) => {
    const cents = toCents(parseFloat(dollars) || 0);
    const data = await apiPut<{ snapshot: HistoricalSnapshot }>('/api/savings-snapshots', { accountId, reviewId: rowReviewId, [field]: cents });
    setAllSnapshots((prev) => {
      const exists = prev.some((s) => s.accountId === accountId && s.reviewId === rowReviewId);
      if (exists) return prev.map((s) => s.accountId === accountId && s.reviewId === rowReviewId ? { ...s, ...data.snapshot } : s);
      return [...prev, data.snapshot];
    });
    if (rowReviewId === Number(reviewId)) {
      setSnapshots((prev) => ({ ...prev, [accountId]: data.snapshot as unknown as SavingsSnapshot }));
    }
  }, [reviewId]);

  const addNewRow = useCallback(async (accountId: number, rowReviewId: number) => {
    const data = await apiPut<{ snapshot: HistoricalSnapshot }>('/api/savings-snapshots', { accountId, reviewId: rowReviewId, startingBalance: 0, deposits: 0, interest: 0 });
    setAllSnapshots((prev) => {
      const exists = prev.some((s) => s.accountId === accountId && s.reviewId === rowReviewId);
      if (exists) return prev;
      return [...prev, data.snapshot];
    });
  }, []);

  const saveAccountField = useCallback(async (accountId: number, field: 'rate' | 'goal', rawValue: string) => {
    const value = field === 'rate'
      ? parseFloat(rawValue) / 100
      : toCents(parseFloat(rawValue) || 0);
    const data = await apiPatch<{ account: SavingsAccount }>('/api/savings-accounts', { id: accountId, [field]: value });
    setAccounts((prev) => prev.map((a) => a.id === accountId ? { ...a, ...data.account } : a));
  }, []);

  const handleAddAccount = useCallback(async () => {
    if (!newAccount.name.trim()) return;
    setAddingAccount(true);
    const data = await apiPost<{ account: SavingsAccount }>('/api/savings-accounts', {
      name: newAccount.name.trim(),
      institution: newAccount.institution.trim(),
      type: newAccount.type,
      rate: 0,
    });
    setAccounts((prev) => [...prev, data.account]);
    setSnapshots((prev) => ({
      ...prev,
      [data.account.id]: { id: 0, accountId: data.account.id, reviewId: Number(reviewId), startingBalance: 0, deposits: 0, interest: 0, endingBalance: 0 },
    }));
    setAddingAccount(false);
    setShowAddModal(false);
    setNewAccount({ name: '', institution: '', type: 'HYSA' });
  }, [newAccount, reviewId]);

  const toggleExpand = useCallback((id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const currentYear = useMemo(
    () => allReviews.find((r) => r.id === Number(reviewId))?.periodYear ?? new Date().getFullYear(),
    [allReviews, reviewId],
  );

  const getAccountHistory = useCallback((accountId: number): HistoricalSnapshotWithBalance[] => {
    const snap = snapshots[accountId] ?? { startingBalance: 0, deposits: 0, interest: 0, endingBalance: 0, accountId, reviewId: Number(reviewId), id: 0 };
    const historyFromDb = allSnapshots
      .filter((s) => s.accountId === accountId)
      .sort((a, b) =>
        a.review.periodYear !== b.review.periodYear
          ? a.review.periodYear - b.review.periodYear
          : a.review.periodMonth - b.review.periodMonth,
      );
    const currentRev = allReviews.find((r) => r.id === Number(reviewId));
    const hasCurrentInDb = historyFromDb.some((s) => s.reviewId === Number(reviewId));
    const raw: HistoricalSnapshot[] = hasCurrentInDb
      ? historyFromDb
      : currentRev
        ? [...historyFromDb, { ...snap, review: currentRev }]
        : historyFromDb;
    let running = 0;
    return raw.map((row, i) => {
      const start = i === 0 ? row.startingBalance : running;
      running = start + row.deposits + row.interest;
      return { ...row, computedEndBalance: running };
    });
  }, [allSnapshots, allReviews, snapshots, reviewId]);

  const { totalInterest, totalDeposits, totalGrowth, monthCount, totalBalance } = useMemo(() => {
    const ytd = allSnapshots.filter((s) => s.review.periodYear === currentYear);
    const interest = ytd.reduce((s, sn) => s + sn.interest, 0);
    const deposits = ytd.reduce((s, sn) => s + sn.deposits, 0);
    const mc = allReviews.filter((r) => r.periodYear === currentYear).length || 1;
    const balance = accounts.reduce((sum, a) => {
      const hist = getAccountHistory(a.id);
      return sum + (hist.length > 0 ? hist[hist.length - 1].computedEndBalance : 0);
    }, 0);
    return { totalInterest: interest, totalDeposits: deposits, totalGrowth: interest + deposits, monthCount: mc, totalBalance: balance };
  }, [allSnapshots, allReviews, accounts, currentYear, getAccountHistory]);

  if (loading) return <LoadingState centered />;

  return (
    <StepShell
      title="Savings Accounts"
      subtitle="Track HYSA accounts, deposits, and interest earned"
      stepName="Savings"
      onBack={goBack}
      onSkip={goSkip}
      onNext={goNext}
      saving={saving}
      readOnly={readOnly}
    >
      <KpiGrid cols={4}>
        <KpiCard
          label="Total Balance"
          value={formatDollars(totalBalance)}
          sub={`across ${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
        />
        <KpiCard
          label="YTD Interest Earned"
          tone="success"
          value={formatDollars(totalInterest)}
          sub={`avg ${formatDollars(Math.round(totalInterest / monthCount))}/month`}
        />
        <KpiCard
          label="YTD Deposits"
          tone="primary"
          value={formatDollars(totalDeposits)}
          sub="net deposits this year"
        />
        <KpiCard
          label="YTD Total Growth"
          value={formatDollars(totalGrowth)}
          sub="deposits + interest combined"
        />
      </KpiGrid>

      <SectionHeader title="Accounts" />

      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          account={account}
          snap={snapshots[account.id] ?? { id: 0, accountId: account.id, reviewId: Number(reviewId), startingBalance: 0, deposits: 0, interest: 0, endingBalance: 0 }}
          isExpanded={expandedIds.has(account.id)}
          history={getAccountHistory(account.id)}
          allReviews={allReviews}
          currentReviewId={Number(reviewId)}
          readOnly={readOnly}
          onToggleExpand={toggleExpand}
          onSaveRowField={saveRowField}
          onSaveAccountField={saveAccountField}
          onAddNewRow={addNewRow}
        />
      ))}

      {accounts.length === 0 && (
        <p style={{ color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing[4] }}>
          No accounts yet. Add one below.
        </p>
      )}

      {!readOnly && (
        <Button onClick={() => setShowAddModal(true)} style={{ marginTop: spacing[4] }}>
          + Add New Account
        </Button>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Account" width="440px">
        <FieldLabel>Account Name</FieldLabel>
        <FieldInput
          autoFocus
          placeholder="e.g. HYSA Emergency Account (Everbank)"
          value={newAccount.name}
          onChange={(e) => setNewAccount((p) => ({ ...p, name: e.target.value }))}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAddAccount(); }}
        />

        <FieldLabel>Institution</FieldLabel>
        <FieldInput
          placeholder="e.g. Marcus by Goldman Sachs"
          value={newAccount.institution}
          onChange={(e) => setNewAccount((p) => ({ ...p, institution: e.target.value }))}
        />

        <FieldLabel>Account Type</FieldLabel>
        <FieldSelect value={newAccount.type} onChange={(e) => setNewAccount((p) => ({ ...p, type: e.target.value }))}>
          <option value="HYSA">HYSA</option>
          <option value="CHECKING">Checking</option>
          <option value="SAVINGS">Savings</option>
        </FieldSelect>

        <p style={{ fontSize: font.size.xs, color: colors.textMuted, marginBottom: spacing[3] }}>
          Interest rate and savings goal can be set after adding the account.
        </p>

        <ModalActions>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
          <Button onClick={handleAddAccount} disabled={addingAccount || !newAccount.name.trim()}>
            {addingAccount ? 'Adding…' : 'Add Account'}
          </Button>
        </ModalActions>
      </Modal>
    </StepShell>
  );
}
