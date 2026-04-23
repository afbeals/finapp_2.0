import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InvestmentsConfigSection } from '@/app/(app)/config/InvestmentsConfigSection';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  createInvestmentCategory: vi.fn(() => Promise.resolve(null)),
  updateInvestmentCategory: vi.fn(() => Promise.resolve(null)),
  deleteInvestmentCategory: vi.fn(() => Promise.resolve({ ok: true })),
  createInvestmentAccount: vi.fn(() => Promise.resolve(null)),
  updateInvestmentAccount: vi.fn(() => Promise.resolve(null)),
  deleteInvestmentAccount: vi.fn(() => Promise.resolve({ ok: true })),
}));

vi.mock('@/lib/store', () => ({
  useReviewStore: () => ({ state: { activeReview: null, isEditMode: false }, actions: {} }),
  useSessionStore: () => ({ state: {}, actions: {} }),
}));

describe('InvestmentsConfigSection', () => {
  const defaultProps = {
    invCategories: [],
    setInvCategories: vi.fn(),
    accounts: [],
    setAccounts: vi.fn(),
    members: [],
  };

  it('renders the "Investments" section heading', () => {
    render(<InvestmentsConfigSection {...defaultProps} />);
    expect(screen.getByText('Investments')).toBeInTheDocument();
  });

  it('renders the "+ Add" button for accounts', () => {
    render(<InvestmentsConfigSection {...defaultProps} />);
    expect(screen.getAllByText('+ Add').length).toBeGreaterThan(0);
  });

  it('renders the "Holdings Categories" column header', () => {
    render(<InvestmentsConfigSection {...defaultProps} />);
    expect(screen.getByText('Holdings Categories')).toBeInTheDocument();
  });
});
