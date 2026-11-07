'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { apiGet, createExpenseEntry, createIncomeEntry } from '@/lib/api';
import { MemberBadge } from './AccordionShared';
import { theme } from '@/styles/tokens';
import { formatDollars } from '@/lib/money';
import type { ExpenseEntry, IncomeEntry } from '@/types/entities';
import type { ReviewPeriod } from '@/types/review';
import {
  GroupHeader, SectionLabel, SelectAllBtn, EntryRow, EntryCheckbox,
  EntryName, EntryAmount, EmptyMessage,
} from './CopyFromPreviousMonthModal.styles';

interface CopyFromPreviousMonthModalProps {
  reviewId: string;
  periodYear: number;
  periodMonth: number;
  onClose: () => void;
  onCopied: (result: { income: IncomeEntry[]; expenses: ExpenseEntry[] }) => void;
}

function previousPeriod(year: number, month: number) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

function toggleId(set: Set<number>, id: number): Set<number> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id); else next.add(id);
  return next;
}

export function CopyFromPreviousMonthModal({
  reviewId, periodYear, periodMonth, onClose, onCopied,
}: CopyFromPreviousMonthModalProps) {
  const { year: prevYear, month: prevMonth } = previousPeriod(periodYear, periodMonth);

  const [loading, setLoading] = useState(true);
  const [prevReviewFound, setPrevReviewFound] = useState(false);
  const [income, setIncome] = useState<IncomeEntry[]>([]);
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [selectedIncome, setSelectedIncome] = useState<Set<number>>(new Set());
  const [selectedExpenses, setSelectedExpenses] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { reviews } = await apiGet<{ reviews: ReviewPeriod[] }>('/api/reviews');
      const prev = reviews.find((r) => r.periodYear === prevYear && r.periodMonth === prevMonth);
      if (!prev) {
        if (!cancelled) setLoading(false);
        return;
      }
      if (cancelled) return;
      setPrevReviewFound(true);
      const [incData, expData] = await Promise.all([
        apiGet<{ entries: IncomeEntry[] }>(`/api/reviews/${prev.id}/income`),
        apiGet<{ entries: ExpenseEntry[] }>(`/api/reviews/${prev.id}/expenses`),
      ]);
      if (cancelled) return;
      setIncome(incData.entries ?? []);
      setExpenses(expData.entries ?? []);
      setLoading(false);
    })().catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [prevYear, prevMonth]);

  const categoryGroups = useMemo(() => {
    const map = new Map<number, { category: ExpenseEntry['category']; items: ExpenseEntry[] }>();
    for (const entry of expenses) {
      if (!map.has(entry.category.id)) map.set(entry.category.id, { category: entry.category, items: [] });
      map.get(entry.category.id)!.items.push(entry);
    }
    return Array.from(map.values());
  }, [expenses]);

  const totalSelected = selectedIncome.size + selectedExpenses.size;

  async function handleCopy() {
    setSaving(true);
    setError('');
    try {
      const copiedIncome = await Promise.allSettled(
        income.filter((e) => selectedIncome.has(e.id)).map((e) =>
          createIncomeEntry(reviewId, {
            memberId: e.member.id,
            name: e.name,
            notes: e.notes ?? undefined,
            amount: e.amount,
          }).then((d) => d.entry)
        )
      );
      const copiedExpenses = await Promise.allSettled(
        expenses.filter((e) => selectedExpenses.has(e.id)).map((e) =>
          createExpenseEntry(reviewId, {
            categoryId: e.category.id,
            memberId: e.member?.id ?? null,
            name: e.name,
            notes: e.notes ?? undefined,
            amount: e.amount,
            date: new Date().toISOString().slice(0, 10),
          }).then((d) => d.entry)
        )
      );
      const successfulIncome = copiedIncome.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
      const successfulExpenses = copiedExpenses.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
      onCopied({ income: successfulIncome, expenses: successfulExpenses });
      const sourceIncome = income.filter((e) => selectedIncome.has(e.id));
      const sourceExpenses = expenses.filter((e) => selectedExpenses.has(e.id));
      setSelectedIncome(new Set(sourceIncome.filter((_, i) => copiedIncome[i].status === 'rejected').map((e) => e.id)));
      setSelectedExpenses(new Set(sourceExpenses.filter((_, i) => copiedExpenses[i].status === 'rejected').map((e) => e.id)));
      if ([...copiedIncome, ...copiedExpenses].some((result) => result.status === 'rejected')) {
        setError('Some entries could not be copied. Your successful copies were kept; retry the remaining selections.');
      } else onClose();
    } finally {
      setSaving(false);
    }
  }

  const noEntries = !loading && prevReviewFound && income.length === 0 && expenses.length === 0;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Copy from Previous Month"
      width="520px"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleCopy} disabled={saving || totalSelected === 0}>
            {saving ? 'Copying…' : `Copy ${totalSelected} Selected`}
          </Button>
        </>
      }
    >
      {error && <p role="alert">{error}</p>}
      {loading ? (
        <EmptyMessage>Loading…</EmptyMessage>
      ) : !prevReviewFound ? (
        <EmptyMessage>No review found for the previous month.</EmptyMessage>
      ) : noEntries ? (
        <EmptyMessage>The previous month&apos;s review has no entries to copy.</EmptyMessage>
      ) : (
        <>
          {income.length > 0 && (
            <>
              <GroupHeader>
                <SectionLabel>💰 Income</SectionLabel>
                <SelectAllBtn
                  onClick={() => setSelectedIncome(
                    income.every((e) => selectedIncome.has(e.id)) ? new Set() : new Set(income.map((e) => e.id))
                  )}
                >
                  {income.every((e) => selectedIncome.has(e.id)) ? 'Deselect All' : 'Select All'}
                </SelectAllBtn>
              </GroupHeader>
              {income.map((e) => (
                <EntryRow key={e.id}>
                  <EntryCheckbox
                    type="checkbox"
                    checked={selectedIncome.has(e.id)}
                    onChange={() => setSelectedIncome(toggleId(selectedIncome, e.id))}
                  />
                  <EntryName>{e.name}</EntryName>
                  <MemberBadge memberColor={e.member?.color ?? theme.colors.textMuted}>{e.member?.name ?? 'Shared'}</MemberBadge>
                  <EntryAmount>{formatDollars(e.amount)}</EntryAmount>
                </EntryRow>
              ))}
            </>
          )}

          {categoryGroups.map(({ category, items }) => (
            <div key={category.id}>
              <GroupHeader>
                <SectionLabel>{category.icon} {category.name}</SectionLabel>
                <SelectAllBtn
                  onClick={() => setSelectedExpenses((prev) => {
                    const ids = items.map((e) => e.id);
                    const allSelected = ids.every((id) => prev.has(id));
                    const next = new Set(prev);
                    ids.forEach((id) => allSelected ? next.delete(id) : next.add(id));
                    return next;
                  })}
                >
                  {items.every((e) => selectedExpenses.has(e.id)) ? 'Deselect All' : 'Select All'}
                </SelectAllBtn>
              </GroupHeader>
              {items.map((e) => (
                <EntryRow key={e.id}>
                  <EntryCheckbox
                    type="checkbox"
                    checked={selectedExpenses.has(e.id)}
                    onChange={() => setSelectedExpenses(toggleId(selectedExpenses, e.id))}
                  />
                  <EntryName>{e.name}</EntryName>
                  <MemberBadge memberColor={e.member?.color ?? theme.colors.textMuted}>{e.member?.name ?? 'Shared'}</MemberBadge>
                  <EntryAmount>{formatDollars(e.amount)}</EntryAmount>
                </EntryRow>
              ))}
            </div>
          ))}
        </>
      )}
    </Modal>
  );
}
