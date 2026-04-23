'use client';

import { useEffect, useMemo, useState } from 'react';
import { getReviewInvestments, getReviewIncome, getReviewExpenses, getReviewSavings, getReviewLoans, apiGet } from '@/lib/api';
import { fireNumber } from '@/lib/fire';
import { theme } from '@/styles/tokens';

const { colors } = theme;

interface AllocationItem { label: string; value: number; color: string }

export function usePortfolioData(reviewId: string) {
  const [totalPortfolio, setTotalPortfolio] = useState(0);
  const [hysa, setHysa] = useState(0);
  const [totalLoanBalance, setTotalLoanBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [ytdIncome, setYtdIncome] = useState(0);
  const [ytdSaved, setYtdSaved] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    Promise.all([
      getReviewInvestments(reviewId),
      getReviewIncome(reviewId),
      getReviewExpenses(reviewId),
      getReviewSavings(reviewId),
      getReviewLoans(reviewId),
      apiGet<{ reviews: { periodYear: number; totalIncome: number }[] }>('/api/reviews'),
    ]).then(([inv, inc, exp, sav, loanData, allReviews]) => {
      const taxableValue = (inv.snapshots ?? []).reduce((s, sn) => s + sn.value, 0);
      const retirementValue = (inv.retirementSnapshots ?? []).reduce((s, sn) => s + sn.balance, 0);
      setTotalPortfolio(taxableValue + retirementValue);
      const loanBalances = (loanData.snapshots ?? []).reduce((s, sn) => s + sn.balance, 0);
      setTotalLoanBalance(loanBalances);
      setTotalIncome((inc.entries ?? []).reduce((s, e) => s + e.amount, 0));
      setTotalExpenses((exp.entries ?? []).reduce((s, e) => s + e.amount, 0));

      const savData = sav;
      const currentYear = savData.allReviews?.find((r) => r.id === Number(reviewId))?.periodYear ?? new Date().getFullYear();
      const ytdSnaps = (savData.allSnapshots ?? []).filter((s) => s.review.periodYear === currentYear);
      const hysaTotal = (savData.accounts ?? []).reduce((sum, acc) => {
        const acctSnaps = ytdSnaps.filter((s) => s.accountId === acc.id)
          .sort((a, b) => a.review.periodMonth - b.review.periodMonth);
        if (acctSnaps.length === 0) return sum;
        return sum + acctSnaps[acctSnaps.length - 1].endingBalance;
      }, 0);
      setHysa(hysaTotal);
      setYtdSaved(ytdSnaps.reduce((s, sn) => s + sn.deposits + sn.interest, 0));

      const yr = new Date().getFullYear();
      setYtdIncome((allReviews.reviews ?? [])
        .filter((r) => r.periodYear === yr)
        .reduce((s, r) => s + r.totalIncome, 0));
    }).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, [reviewId]);

  const netWorth = useMemo(() => totalPortfolio + hysa - totalLoanBalance, [totalPortfolio, hysa, totalLoanBalance]);

  const allocationItems = useMemo<AllocationItem[]>(() => [
    { label: 'Investments', value: totalPortfolio, color: colors.primary },
    { label: 'HYSA Savings', value: hysa, color: colors.success },
    { label: 'Yearly Income', value: ytdIncome, color: colors.warning },
  ].filter((a) => a.value > 0), [totalPortfolio, hysa, ytdIncome]);

  const actualYearlyExpenses = totalExpenses * 12;
  const fireTarget = fireNumber(actualYearlyExpenses);
  const fireProgressPct = Math.min(100, (totalPortfolio / Math.max(1, fireTarget)) * 100);

  const savingsRate = useMemo(
    () => totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0,
    [totalIncome, totalExpenses],
  );

  const ytdNetWorthGrowth = ytdSaved;

  return {
    loading,
    loadError,
    totalPortfolio,
    hysa,
    totalLoanBalance,
    totalIncome,
    totalExpenses,
    ytdIncome,
    netWorth,
    allocationItems,
    actualYearlyExpenses,
    fireTarget,
    fireProgressPct,
    savingsRate,
    ytdNetWorthGrowth,
  };
}
