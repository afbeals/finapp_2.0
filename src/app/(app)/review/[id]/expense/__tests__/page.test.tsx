import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpensePage from '../page';
import { apiGet, apiPatch, createExpenseEntry, createIncomeEntry, getReviewExpenses } from '@/lib/api';

vi.mock('next/navigation', () => ({ useParams: () => ({ id: '2' }) }));
vi.mock('@/lib/useStepNav', () => ({ useStepNav: () => ({ goNext: vi.fn().mockResolvedValue(undefined), saving: false }) }));
vi.mock('@/lib/store', () => ({
  useReviewStore: () => ({ state: { activeReview: { id: 2, periodYear: 2027, periodMonth: 1, status: 'IN_PROGRESS' } } }),
  useSessionStore: () => ({ state: { memberId: 1, members: [{ id: 1, name: 'Alice', color: '#123456' }] } }),
}));
vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(), apiPatch: vi.fn(), createExpenseEntry: vi.fn(), createIncomeEntry: vi.fn(),
  getReviewExpenses: vi.fn(), getReviewIncome: vi.fn(async () => ({ entries: [] })),
  getExpenseCategories: vi.fn(async () => ({ categories: [{ id: 1, name: 'Groceries', color: '#123456', icon: 'G', sortOrder: 0 }] })),
  deleteExpenseEntry: vi.fn(), deleteIncomeEntry: vi.fn(),
}));
const category = { id: 1, name: 'Groceries', color: '#123456', icon: 'G', sortOrder: 0 };
const member = { id: 1, name: 'Alice', color: '#123456' };
const expense = { id: 8, name: 'Copy me', amount: 2500, date: '2026-12-01', category, member: null };
const salary = { id: 7, name: 'Salary', amount: 10000, member };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getReviewExpenses).mockResolvedValue({ entries: [{ ...expense, id: 2, name: 'Manual entry' }] });
  vi.mocked(apiGet).mockImplementation(async (url) => {
    if (url === '/api/reviews') return { reviews: [{ id: 1, periodYear: 2026, periodMonth: 12 }] } as never;
    return { entries: url.endsWith('/income') ? [salary] : [expense] } as never;
  });
  vi.mocked(createExpenseEntry).mockResolvedValue({ entry: { ...expense, id: 20 } });
  vi.mocked(createIncomeEntry).mockResolvedValue({ entry: { ...salary, id: 21 } });
  vi.mocked(apiPatch).mockResolvedValue({ entry: { ...expense, id: 20, amount: 3000 } });
});

async function copyEntries() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: /Copy from Previous Month/ }));
  await user.click(await screen.findByRole('checkbox', { name: /Copy me.*Shared/ }));
  await user.click(screen.getByRole('checkbox', { name: /Salary.*Alice/ }));
  await user.click(screen.getByRole('button', { name: 'Copy 2 Selected' }));
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  await user.click(screen.getByRole('button', { name: /Groceries/ }));
  return user;
}

describe('expense copying and temporary row highlights', () => {
  it('copies across the year boundary, displays ownership, and highlights only new copies', async () => {
    render(<ExpensePage />);
    await copyEntries();
    expect(createExpenseEntry).toHaveBeenCalledWith('2', expect.objectContaining({ memberId: null, amount: 2500 }));
    expect(screen.getByText('Copy me').closest('tr')).toHaveAttribute('title', 'Copied from previous month');
    expect(screen.getByText('Salary').closest('tr')).toHaveAttribute('title', 'Copied from previous month');
    expect(screen.getByText('Manual entry').closest('tr')).not.toHaveAttribute('title');
  });

  it('keeps a cancelled/failed edit highlighted and clears the highlight only after a successful change', async () => {
    render(<ExpensePage />);
    const user = await copyEntries();
    const row = screen.getByText('Copy me').closest('tr')!;
    await user.click(within(row).getByText('$25.00'));
    await user.keyboard('{Escape}');
    expect(row).toHaveAttribute('title', 'Copied from previous month');
    vi.mocked(apiPatch).mockRejectedValueOnce(new Error('offline'));
    await user.click(within(row).getByText('$25.00'));
    const amount = within(row).getByRole('spinbutton');
    await user.clear(amount); await user.type(amount, '30'); await user.keyboard('{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not save');
    expect(row).toHaveAttribute('title', 'Copied from previous month');
    await user.click(within(row).getByText('$25.00'));
    await user.clear(within(row).getByRole('spinbutton'));
    await user.type(within(row).getByRole('spinbutton'), '30'); await user.keyboard('{Enter}');
    await waitFor(() => expect(row).not.toHaveAttribute('title'));
  });

  it('allows advancing unchanged and resets colors on a later visit', async () => {
    const { unmount } = render(<ExpensePage />);
    const user = await copyEntries();
    await user.click(screen.getByRole('button', { name: /Next Step/ }));
    await waitFor(() => expect(screen.queryAllByTitle('Copied from previous month')).toHaveLength(0));
    unmount();
    vi.mocked(getReviewExpenses).mockResolvedValue({ entries: [{ ...expense, id: 20 }] });
    render(<ExpensePage />);
    await user.click(await screen.findByRole('button', { name: /Groceries/ }));
    expect(screen.getByText('Copy me').closest('tr')).not.toHaveAttribute('title');
    expect(apiPatch).not.toHaveBeenCalled();
  });

  it('keeps successful copies during partial failure and retries only failures', async () => {
    render(<ExpensePage />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: /Copy from Previous Month/ }));
    await user.click(await screen.findByRole('checkbox', { name: /Copy me.*Shared/ }));
    await user.click(screen.getByRole('checkbox', { name: /Salary.*Alice/ }));
    vi.mocked(createExpenseEntry).mockRejectedValueOnce(new Error('offline'));
    await user.click(screen.getByRole('button', { name: 'Copy 2 Selected' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('successful copies were kept');
    await user.click(screen.getByRole('button', { name: 'Copy 1 Selected' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(createIncomeEntry).toHaveBeenCalledTimes(1);
    expect(createExpenseEntry).toHaveBeenCalledTimes(2);
  });
});
