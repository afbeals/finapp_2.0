'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import styled from 'styled-components';
import { StepShell } from '@/components/review/StepShell';
import { useStepNav } from '@/lib/useStepNav';
import { useReviewStore } from '@/lib/store';
import { formatDollars, toCents, toDollars } from '@/lib/money';
import { colors, font, spacing, radius } from '@/styles/tokens';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface SavingsAccount { id: number; name: string; type: string; institution: string; rate: number; goal: number }
interface SavingsSnapshot { id: number; accountId: number; reviewId: number; startingBalance: number; deposits: number; interest: number; endingBalance: number }
interface HistoricalSnapshot extends SavingsSnapshot { review: { id: number; periodYear: number; periodMonth: number } }
interface ReviewPeriod { id: number; periodYear: number; periodMonth: number }

// ─── KPI grid ─────────────────────────────────────────────────────────────────

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${spacing[4]};
  margin-bottom: ${spacing[6]};
  @media (max-width: 900px) { grid-template-columns: repeat(2, 1fr); }
`;

const KpiCard = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.lg};
  padding: 16px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
`;

const KpiIcon = styled.span`
  font-size: 24px;
  flex-shrink: 0;
  margin-top: 2px;
`;

const KpiBody = styled.div`flex: 1;`;

const KpiLabel = styled.p`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
`;

const KpiValue = styled.p.withConfig({
  shouldForwardProp: (p) => p !== 'textColor',
})<{ textColor: string }>`
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.bold};
  color: ${({ textColor }) => textColor};
  line-height: 1;
  margin-bottom: 4px;
`;

const KpiSub = styled.p`
  font-size: ${font.size.xs};
  color: ${colors.textMuted};
`;

// ─── Section header ───────────────────────────────────────────────────────────

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[3]};
  margin-bottom: ${spacing[4]};
`;

const SectionTitle = styled.h2`
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
  white-space: nowrap;
`;

const SectionLine = styled.div`
  flex: 1;
  height: 1px;
  background: ${colors.border};
`;

// ─── Account row ──────────────────────────────────────────────────────────────

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
  background: ${({ expanded }) => expanded ? '#EFF6FF' : colors.surface};
  border: none;
  cursor: pointer;
  text-align: left;
  border-radius: ${({ expanded }) => expanded ? `${radius.lg} ${radius.lg} 0 0` : radius.lg};
  transition: background 120ms ease;
  &:hover { background: #F8FAFC; }
`;

const AccountIcon = styled.span`font-size: 22px; flex-shrink: 0;`;

const AccountName = styled.span`
  flex: 1;
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
  text-align: left;
`;

const AccountMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[5]};
`;

const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
`;

const MetaLabel = styled.span`
  font-size: ${font.size.xs};
  color: ${colors.textMuted};
`;

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

// ─── Expanded panel ───────────────────────────────────────────────────────────

const ExpandedPanel = styled.div`
  border-top: 1px solid ${colors.border};
  background: ${colors.bg};
`;

const EditingBadge = styled.span`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  padding: 2px 8px;
  border-radius: ${radius.full};
  background: #DBEAFE;
  color: #1E40AF;
  border: 1px solid #3B82F6;
  margin-left: ${spacing[2]};
`;

const SnapKpiRow = styled.div`
  display: flex;
  gap: ${spacing[3]};
  padding: 14px ${spacing[5]};
  flex-wrap: wrap;
`;

const SnapKpi = styled.div`
  background: ${colors.surface};
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  padding: 10px 14px;
  min-width: 120px;
  flex: 1;
`;

const SnapKpiLabel = styled.p`
  font-size: 10px;
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
`;

const SnapKpiValue = styled.div.withConfig({
  shouldForwardProp: (p) => p !== 'textColor',
})<{ textColor?: string }>`
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${({ textColor }) => textColor ?? colors.textPrimary};
`;

// ─── History table ────────────────────────────────────────────────────────────

const HistoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const HistoryThead = styled.thead`background: #F1F5F9;`;

const HistoryTh = styled.th`
  padding: 8px ${spacing[4]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-align: center;
  border-bottom: 1px solid ${colors.border};
  &:first-child { text-align: left; }
`;

const HistoryTr = styled.tr.withConfig({
  shouldForwardProp: (p) => p !== 'isCurrentMonth',
})<{ isCurrentMonth: boolean }>`
  background: ${({ isCurrentMonth }) => isCurrentMonth ? '#EFF6FF' : colors.surface};
  &:nth-child(even) { background: ${({ isCurrentMonth }) => isCurrentMonth ? '#EFF6FF' : '#F8FAFC'}; }
  &:last-child td { border-bottom: none; }
`;

const HistoryTd = styled.td`
  padding: 10px ${spacing[4]};
  font-size: ${font.size.sm};
  color: ${colors.textPrimary};
  border-bottom: 1px solid ${colors.border};
  text-align: center;
  &:first-child { text-align: left; font-weight: ${font.weight.medium}; }
`;

// ─── Inline editable field ────────────────────────────────────────────────────

const InlineEditWrap = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: text;
`;

const InlineValue = styled.span`
  border-radius: 4px;
  padding: 2px 5px;
  font-size: ${font.size.sm};
  &:hover { background: #E0EEFF; outline: 1px solid ${colors.primary}; }
`;

const InlineInput = styled.input`
  font-size: ${font.size.sm};
  font-family: inherit;
  font-weight: inherit;
  color: ${colors.textPrimary};
  background: ${colors.surface};
  border: 1.5px solid ${colors.primary};
  border-radius: 4px;
  padding: 2px 6px;
  width: 100px;
  outline: none;
  text-align: right;
  &:focus { box-shadow: 0 0 0 2px #BFDBFE; }
`;

// ─── Add row button ───────────────────────────────────────────────────────────

const AddRowBtn = styled.button`
  width: 100%;
  padding: 9px ${spacing[4]};
  border: none;
  border-top: 1px dashed ${colors.border};
  background: transparent;
  color: ${colors.primary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 6px;
  &:hover { background: #EFF6FF; }
`;

// ─── Add account button ───────────────────────────────────────────────────────

const AddAccountBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: ${spacing[4]};
  padding: 10px 20px;
  background: ${colors.primary};
  color: #fff;
  border: none;
  border-radius: ${radius.md};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
  &:hover { background: #2563EB; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

// ─── Add account modal ────────────────────────────────────────────────────────

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,0.4);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalBox = styled.div`
  background: ${colors.surface};
  border-radius: ${radius.xl};
  padding: ${spacing[6]};
  width: 440px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
`;

const ModalTitle = styled.h2`
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  color: ${colors.textPrimary};
  margin-bottom: ${spacing[4]};
`;

const FieldLabel = styled.label`
  display: block;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
`;

const FieldInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  font-size: ${font.size.sm};
  font-family: inherit;
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  background: ${colors.surface};
  color: ${colors.textPrimary};
  margin-bottom: ${spacing[3]};
  outline: none;
  &:focus { border-color: ${colors.primary}; box-shadow: 0 0 0 2px #BFDBFE; }
`;

const FieldSelect = styled.select`
  width: 100%;
  padding: 8px 12px;
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

const BtnPrimary = styled.button`
  padding: 8px 20px;
  background: ${colors.primary};
  color: #fff;
  border: none;
  border-radius: ${radius.md};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
  &:hover { background: #2563EB; }
  &:disabled { opacity: 0.5; cursor: default; }
`;

const BtnGhost = styled.button`
  padding: 8px 20px;
  background: transparent;
  color: ${colors.textMuted};
  border: 1px solid ${colors.border};
  border-radius: ${radius.md};
  font-size: ${font.size.sm};
  cursor: pointer;
  &:hover { background: ${colors.bg}; }
`;

// ─── InlineEditField component ────────────────────────────────────────────────

function InlineEditField({
  value,
  onSave,
  isAmount = false,
  readOnly = false,
  textColor,
  suffix,
  placeholder,
}: {
  value: string;
  onSave: (v: string) => void;
  isAmount?: boolean;
  readOnly?: boolean;
  textColor?: string;
  suffix?: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  function commit() {
    setEditing(false);
    if (draft !== value) onSave(draft);
  }

  if (readOnly) {
    return <span style={{ color: textColor }}>{value || '—'}{suffix}</span>;
  }

  const displayValue = value || placeholder || '—';

  return editing ? (
    <InlineInput
      ref={inputRef}
      value={draft}
      type={isAmount ? 'number' : 'text'}
      step={isAmount ? '0.01' : undefined}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') { setDraft(value); setEditing(false); }
      }}
    />
  ) : (
    <InlineEditWrap onClick={() => { setDraft(value); setEditing(true); }}>
      <InlineValue style={{ color: value ? textColor : colors.textMuted, fontStyle: value ? 'normal' : 'italic' }}>
        {displayValue}{value && suffix}
      </InlineValue>
      <span style={{ fontSize: '10px', color: colors.textMuted, opacity: 0.5 }}>✎</span>
    </InlineEditWrap>
  );
}

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
    fetch(`/api/reviews/${reviewId}/savings`)
      .then((r) => r.json())
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

  async function saveRowField(
    accountId: number,
    rowReviewId: number,
    field: 'startingBalance' | 'deposits' | 'interest',
    dollars: string,
  ) {
    const cents = toCents(parseFloat(dollars) || 0);
    const res = await fetch('/api/savings-snapshots', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, reviewId: rowReviewId, [field]: cents }),
    });
    if (res.ok) {
      const data = await res.json();
      // Keep allSnapshots in sync
      setAllSnapshots((prev) => {
        const exists = prev.some((s) => s.accountId === accountId && s.reviewId === rowReviewId);
        if (exists) return prev.map((s) => s.accountId === accountId && s.reviewId === rowReviewId ? { ...s, ...data.snapshot } : s);
        return [...prev, data.snapshot];
      });
      // Also keep current-review snapshots map in sync
      if (rowReviewId === Number(reviewId)) {
        setSnapshots((prev) => ({ ...prev, [accountId]: data.snapshot }));
      }
    }
  }

  async function addNewRow(accountId: number, rowReviewId: number) {
    const res = await fetch('/api/savings-snapshots', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, reviewId: rowReviewId, startingBalance: 0, deposits: 0, interest: 0 }),
    });
    if (res.ok) {
      const data = await res.json();
      setAllSnapshots((prev) => {
        const exists = prev.some((s) => s.accountId === accountId && s.reviewId === rowReviewId);
        if (exists) return prev;
        return [...prev, data.snapshot];
      });
    }
  }

  async function saveAccountField(accountId: number, field: 'rate' | 'goal', rawValue: string) {
    const value = field === 'rate'
      ? parseFloat(rawValue) / 100   // user enters %, store as decimal
      : toCents(parseFloat(rawValue) || 0);
    const res = await fetch('/api/savings-accounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: accountId, [field]: value }),
    });
    if (res.ok) {
      const data = await res.json();
      setAccounts((prev) => prev.map((a) => a.id === accountId ? { ...a, ...data.account } : a));
    }
  }

  async function handleAddAccount() {
    if (!newAccount.name.trim()) return;
    setAddingAccount(true);
    const res = await fetch('/api/savings-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newAccount.name.trim(),
        institution: newAccount.institution.trim(),
        type: newAccount.type,
        rate: 0,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setAccounts((prev) => [...prev, data.account]);
      setSnapshots((prev) => ({
        ...prev,
        [data.account.id]: { id: 0, accountId: data.account.id, reviewId: Number(reviewId), startingBalance: 0, deposits: 0, interest: 0, endingBalance: 0 },
      }));
    }
    setAddingAccount(false);
    setShowAddModal(false);
    setNewAccount({ name: '', institution: '', type: 'HYSA' });
  }

  function toggleExpand(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // Compute rolling end balances for an account's sorted history.
  // Row 0 seeds from its own startingBalance; each subsequent row starts where the prior row ended.
  function computeRollingHistory(history: HistoricalSnapshot[]): (HistoricalSnapshot & { computedEndBalance: number })[] {
    let running = 0;
    return history.map((row, i) => {
      const start = i === 0 ? row.startingBalance : running;
      running = start + row.deposits + row.interest;
      return { ...row, computedEndBalance: running };
    });
  }

  // Build per-account rolling histories so we can derive totalBalance from the last row of each.
  function getAccountHistory(accountId: number): (HistoricalSnapshot & { computedEndBalance: number })[] {
    const snap = snapshots[accountId] ?? { startingBalance: 0, deposits: 0, interest: 0, endingBalance: 0, accountId, reviewId: Number(reviewId), id: 0 };
    const historyFromDb = allSnapshots
      .filter((s) => s.accountId === accountId)
      .sort((a, b) =>
        a.review.periodYear !== b.review.periodYear
          ? a.review.periodYear - b.review.periodYear
          : a.review.periodMonth - b.review.periodMonth
      );
    const currentRev = allReviews.find((r) => r.id === Number(reviewId));
    const hasCurrentInDb = historyFromDb.some((s) => s.reviewId === Number(reviewId));
    const raw: HistoricalSnapshot[] = hasCurrentInDb
      ? historyFromDb
      : currentRev
        ? [...historyFromDb, { ...snap, review: currentRev }]
        : historyFromDb;
    return computeRollingHistory(raw);
  }

  const currentYear = allReviews.find((r) => r.id === Number(reviewId))?.periodYear ?? new Date().getFullYear();
  const ytdSnapshots = allSnapshots.filter((s) => s.review.periodYear === currentYear);
  const totalInterest = ytdSnapshots.reduce((s, snap) => s + snap.interest, 0);
  const totalDeposits = ytdSnapshots.reduce((s, snap) => s + snap.deposits, 0);
  const totalGrowth = totalInterest + totalDeposits;
  const monthCount = allReviews.filter((r) => r.periodYear === currentYear).length || 1;
  // totalBalance = sum of each account's last computed rolling end balance
  const totalBalance = accounts.reduce((sum, a) => {
    const hist = getAccountHistory(a.id);
    return sum + (hist.length > 0 ? hist[hist.length - 1].computedEndBalance : 0);
  }, 0);

  if (loading) return <p style={{ color: colors.textMuted }}>Loading…</p>;

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
      {/* ── KPI cards ── */}
      <KpiGrid>
        <KpiCard>
          <KpiIcon>🏦</KpiIcon>
          <KpiBody>
            <KpiLabel>Total Balance</KpiLabel>
            <KpiValue textColor={colors.textPrimary}>{formatDollars(totalBalance)}</KpiValue>
            <KpiSub>across {accounts.length} account{accounts.length !== 1 ? 's' : ''}</KpiSub>
          </KpiBody>
        </KpiCard>

        <KpiCard>
          <KpiIcon>📈</KpiIcon>
          <KpiBody>
            <KpiLabel>YTD Interest Earned</KpiLabel>
            <KpiValue textColor={colors.success}>{formatDollars(totalInterest)}</KpiValue>
            <KpiSub>avg {formatDollars(Math.round(totalInterest / monthCount))}/month</KpiSub>
          </KpiBody>
        </KpiCard>

        <KpiCard>
          <KpiIcon>💵</KpiIcon>
          <KpiBody>
            <KpiLabel>YTD Deposits</KpiLabel>
            <KpiValue textColor={colors.primary}>{formatDollars(totalDeposits)}</KpiValue>
            <KpiSub>net deposits this year</KpiSub>
          </KpiBody>
        </KpiCard>

        <KpiCard>
          <KpiIcon>🚀</KpiIcon>
          <KpiBody>
            <KpiLabel>YTD Total Growth</KpiLabel>
            <KpiValue textColor={colors.textPrimary}>{formatDollars(totalGrowth)}</KpiValue>
            <KpiSub>deposits + interest combined</KpiSub>
          </KpiBody>
        </KpiCard>
      </KpiGrid>

      {/* ── Account rows ── */}
      <SectionHeader>
        <SectionTitle>Accounts</SectionTitle>
        <SectionLine />
      </SectionHeader>

      {accounts.map((account) => {
        const snap = snapshots[account.id] ?? { startingBalance: 0, deposits: 0, interest: 0, endingBalance: 0, accountId: account.id, reviewId: Number(reviewId), id: 0 };
        const isExpanded = expandedIds.has(account.id);
        const rate = account.rate ?? 0;
        const goal = account.goal ?? 0;

        // Rolling history: computedEndBalance chains across rows in chronological order
        const history = getAccountHistory(account.id);
        const currentBalance = history.length > 0 ? history[history.length - 1].computedEndBalance : 0;
        // Starting balance = first row's startingBalance (the single seed input)
        const firstRow = history[0];
        const startingBalance = firstRow ? firstRow.startingBalance : snap.startingBalance;
        const firstRowReviewId = firstRow ? firstRow.reviewId : Number(reviewId);
        const currentReviewYear = allReviews.find((r) => r.id === Number(reviewId))?.periodYear ?? new Date().getFullYear();
        const ytdGrowth = history
          .filter((row) => row.review.periodYear === currentReviewYear)
          .reduce((sum, row) => sum + row.deposits + row.interest, 0);

        return (
          <AccountRow key={account.id}>
            <AccountRowHeader expanded={isExpanded} onClick={() => toggleExpand(account.id)}>
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
                {/* Snapshot KPIs — Starting Balance edits first row; Current Balance is rolling total */}
                <SnapKpiRow>
                  <SnapKpi>
                    <SnapKpiLabel>Starting Balance</SnapKpiLabel>
                    <SnapKpiValue>
                      {readOnly ? (
                        formatDollars(startingBalance)
                      ) : (
                        <InlineEditField
                          value={toDollars(startingBalance).toFixed(2)}
                          isAmount
                          onSave={(v) => saveRowField(account.id, firstRowReviewId, 'startingBalance', v)}
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
                        <InlineEditField
                          value={(rate * 100).toFixed(2)}
                          onSave={(v) => saveAccountField(account.id, 'rate', v)}
                          textColor={colors.success}
                          suffix="%"
                        />
                      )}
                    </SnapKpiValue>
                  </SnapKpi>
                  <SnapKpi>
                    <SnapKpiLabel>
                      Savings Goal
                      {goal > 0 && (
                        <span style={{ marginLeft: 8, color: colors.primary, fontWeight: 600 }}>
                          {((currentBalance / goal) * 100).toFixed(1)}%
                        </span>
                      )}
                    </SnapKpiLabel>
                    <SnapKpiValue>
                      {readOnly ? (
                        goal > 0 ? formatDollars(goal) : <span style={{ color: colors.textMuted }}>—</span>
                      ) : (
                        <InlineEditField
                          value={goal > 0 ? toDollars(goal).toFixed(2) : ''}
                          isAmount
                          placeholder="Set a goal…"
                          onSave={(v) => saveAccountField(account.id, 'goal', v)}
                        />
                      )}
                    </SnapKpiValue>
                  </SnapKpi>
                </SnapKpiRow>

                {/* History table */}
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
                      const isCurrent = row.reviewId === Number(reviewId);
                      const growth = row.deposits + row.interest;
                      return (
                        <HistoryTr key={`${row.accountId}-${row.reviewId}`} isCurrentMonth={isCurrent}>
                          <HistoryTd>
                            {MONTH_NAMES[row.review.periodMonth - 1]} {row.review.periodYear}
                            {isCurrent && <span style={{ marginLeft: 6, fontSize: '10px', color: colors.primary, fontWeight: 600 }}>● Current</span>}
                          </HistoryTd>
                          <HistoryTd>
                            {!readOnly ? (
                              <InlineEditField
                                value={toDollars(row.deposits).toFixed(2)}
                                isAmount
                                onSave={(v) => saveRowField(account.id, row.reviewId, 'deposits', v)}
                              />
                            ) : (
                              <span style={{ color: row.deposits === 0 ? colors.textMuted : colors.textPrimary }}>
                                {formatDollars(row.deposits)}
                              </span>
                            )}
                          </HistoryTd>
                          <HistoryTd>
                            {!readOnly ? (
                              <InlineEditField
                                value={toDollars(row.interest).toFixed(2)}
                                isAmount
                                textColor={colors.success}
                                onSave={(v) => saveRowField(account.id, row.reviewId, 'interest', v)}
                              />
                            ) : (
                              <span style={{ color: colors.success }}>{formatDollars(row.interest)}</span>
                            )}
                          </HistoryTd>
                          <HistoryTd>
                            <span style={{ color: growth >= 0 ? colors.success : colors.danger, fontWeight: 500 }}>
                              {growth >= 0 ? '+' : ''}{formatDollars(growth)}
                            </span>
                          </HistoryTd>
                          <HistoryTd style={{ fontWeight: 600 }}>{formatDollars(row.computedEndBalance)}</HistoryTd>
                        </HistoryTr>
                      );
                    })}
                    {history.length === 0 && (
                      <tr>
                        <HistoryTd colSpan={5} style={{ textAlign: 'center', color: colors.textMuted, fontStyle: 'italic' }}>
                          No entries yet — add a month below.
                        </HistoryTd>
                      </tr>
                    )}
                  </tbody>
                </HistoryTable>
                {!readOnly && (() => {
                  const coveredReviewIds = new Set(history.map((r) => r.reviewId));
                  const available = allReviews.filter((r) => !coveredReviewIds.has(r.id));
                  if (available.length === 0) return null;
                  return (
                    <AddRowBtn onClick={() => addNewRow(account.id, available[available.length - 1].id)}>
                      + Add Month ({MONTH_NAMES[available[available.length - 1].periodMonth - 1]} {available[available.length - 1].periodYear})
                    </AddRowBtn>
                  );
                })()}
              </ExpandedPanel>
            )}
          </AccountRow>
        );
      })}

      {accounts.length === 0 && (
        <p style={{ color: colors.textMuted, fontStyle: 'italic', marginBottom: spacing[4] }}>
          No accounts yet. Add one below.
        </p>
      )}

      {!readOnly && (
        <AddAccountBtn onClick={() => setShowAddModal(true)}>
          + Add New Account
        </AddAccountBtn>
      )}

      {/* ── Add account modal ── */}
      {showAddModal && (
        <ModalOverlay onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}>
          <ModalBox>
            <ModalTitle>Add New Account</ModalTitle>

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
              <BtnGhost onClick={() => setShowAddModal(false)}>Cancel</BtnGhost>
              <BtnPrimary onClick={handleAddAccount} disabled={addingAccount || !newAccount.name.trim()}>
                {addingAccount ? 'Adding…' : 'Add Account'}
              </BtnPrimary>
            </ModalActions>
          </ModalBox>
        </ModalOverlay>
      )}
    </StepShell>
  );
}
