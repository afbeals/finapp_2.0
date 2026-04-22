'use client';

import { useEffect, useState } from 'react';
import {
  getMembers,
  getExpenseCategories,
  getInvestmentCategories,
  getInvestmentAccounts,
} from '@/lib/api';
import type { ExpenseCategory, InvestmentCategory, InvestmentAccount, Member } from '@/types/entities';

interface MemberWithEmail extends Member { email: string | null }

type InvCategory = InvestmentCategory;

interface ConfigData {
  members: MemberWithEmail[];
  expenseCategories: ExpenseCategory[];
  invCategories: InvCategory[];
  accounts: InvestmentAccount[];
  loading: boolean;
  setMembers: React.Dispatch<React.SetStateAction<MemberWithEmail[]>>;
  setExpenseCategories: React.Dispatch<React.SetStateAction<ExpenseCategory[]>>;
  setInvCategories: React.Dispatch<React.SetStateAction<InvCategory[]>>;
  setAccounts: React.Dispatch<React.SetStateAction<InvestmentAccount[]>>;
}

export function useConfigData(): ConfigData {
  const [members, setMembers] = useState<MemberWithEmail[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
  const [invCategories, setInvCategories] = useState<InvCategory[]>([]);
  const [accounts, setAccounts] = useState<InvestmentAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getMembers(),
      getExpenseCategories(),
      getInvestmentCategories(),
      getInvestmentAccounts(),
    ]).then(([m, c, ic, a]) => {
      setMembers((m.members ?? []) as MemberWithEmail[]);
      setExpenseCategories(c.categories ?? []);
      setInvCategories(ic.categories ?? []);
      setAccounts(a.accounts ?? []);
    }).finally(() => setLoading(false));
  }, []);

  return {
    members,
    expenseCategories,
    invCategories,
    accounts,
    loading,
    setMembers,
    setExpenseCategories,
    setInvCategories,
    setAccounts,
  };
}
