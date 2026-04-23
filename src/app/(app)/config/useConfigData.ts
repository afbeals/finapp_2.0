'use client';

import { useEffect, useState } from 'react';
import {
  getMembers,
  getExpenseCategories,
  getInvestmentCategories,
} from '@/lib/api';
import type { ExpenseCategory, InvestmentCategory, Member } from '@/types/entities';

interface MemberWithEmail extends Member { email: string | null }

type InvCategory = InvestmentCategory;

interface ConfigData {
  members: MemberWithEmail[];
  expenseCategories: ExpenseCategory[];
  invCategories: InvCategory[];
  loading: boolean;
  setMembers: React.Dispatch<React.SetStateAction<MemberWithEmail[]>>;
  setExpenseCategories: React.Dispatch<React.SetStateAction<ExpenseCategory[]>>;
  setInvCategories: React.Dispatch<React.SetStateAction<InvCategory[]>>;
}

export function useConfigData(): ConfigData {
  const [members, setMembers] = useState<MemberWithEmail[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [invCategories, setInvCategories] = useState<InvCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMembers(),
      getExpenseCategories(),
      getInvestmentCategories(),
    ]).then(([m, c, ic]) => {
      setMembers((m.members ?? []) as MemberWithEmail[]);
      setExpenseCategories(c.categories ?? []);
      setInvCategories(ic.categories ?? []);
    }).finally(() => setLoading(false));
  }, []);

  return {
    members,
    expenseCategories,
    invCategories,
    loading,
    setMembers,
    setExpenseCategories,
    setInvCategories,
  };
}
