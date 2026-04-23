import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpenseCategoriesSection } from '@/app/(app)/config/ExpenseCategoriesSection';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  createExpenseCategory: vi.fn(() => Promise.resolve(null)),
  updateExpenseCategory: vi.fn(() => Promise.resolve(null)),
  deleteExpenseCategory: vi.fn(() => Promise.resolve({ ok: true })),
}));

vi.mock('@/lib/store', () => ({
  useReviewStore: () => ({ state: { activeReview: null, isEditMode: false }, actions: {} }),
  useSessionStore: () => ({ state: {}, actions: {} }),
}));

describe('ExpenseCategoriesSection', () => {
  it('renders the "Expense Categories" heading', () => {
    render(<ExpenseCategoriesSection expenseCategories={[]} setExpenseCategories={vi.fn()} />);
    expect(screen.getByText('Expense Categories')).toBeInTheDocument();
  });

  it('renders the "Add Category" button', () => {
    render(<ExpenseCategoriesSection expenseCategories={[]} setExpenseCategories={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add category/i })).toBeInTheDocument();
  });

  it('shows empty state message when no categories', () => {
    render(<ExpenseCategoriesSection expenseCategories={[]} setExpenseCategories={vi.fn()} />);
    expect(screen.getByText('No categories yet.')).toBeInTheDocument();
  });
});
