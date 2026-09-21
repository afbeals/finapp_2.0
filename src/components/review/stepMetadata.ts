export interface StepMeta {
  title: string;
  subtitle: string;
}

export const STEP_META: Record<string, StepMeta> = {
  expense:     { title: 'Income / Expense Entry',  subtitle: 'Enter your income and expenses for the month' },
  monthly:     { title: 'Monthly Summary',         subtitle: 'Review spending patterns • Select months to compare' },
  savings:     { title: 'Savings Accounts',        subtitle: 'Track HYSA accounts, deposits, and interest earned' },
  loans:       { title: '💳 Loans & Credit',       subtitle: 'Track school loans, mortgage payments, and payoff progress' },
  investments: { title: 'Investments',             subtitle: 'Track and manage investment portfolio' },
  portfolio:   { title: 'Portfolio Overview',      subtitle: 'Net worth summary and retirement planning' },
  vaults:      { title: 'Vault Distribution',      subtitle: 'Allocate funds across your bank vaults for the month' },
  finalize:    { title: 'Finalize Review',         subtitle: 'Summary and completion.' },
};
