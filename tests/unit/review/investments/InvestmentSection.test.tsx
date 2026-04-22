import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { InvestmentSection } from '@/app/(app)/review/[id]/investments/InvestmentSection';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  getReviewInvestments: vi.fn(() => Promise.resolve({ positions: [], accounts: [] })),
  getMarketPrices: vi.fn(() => Promise.resolve({ prices: {}, names: {} })),
}));

vi.mock('@/lib/store', () => ({
  useReviewStore: () => ({ state: { activeReview: null, isEditMode: false }, actions: {} }),
  useSessionStore: () => ({ state: {}, actions: {} }),
}));

describe('InvestmentSection', () => {
  const defaultProps = {
    title: 'Taxable',
    isRetirement: false,
    accounts: [],
    positions: [],
    livePrices: {},
    pricesLoading: false,
    readOnly: true,
    categoryColorMap: {},
    onAddPurchase: vi.fn(),
  };

  it('mounts without throwing', () => {
    render(<InvestmentSection {...defaultProps} />);
    expect(document.body).toBeTruthy();
  });

  it('renders the section title', () => {
    const { getByText } = render(<InvestmentSection {...defaultProps} />);
    expect(getByText('Taxable')).toBeInTheDocument();
  });

  it('shows 0 positions badge', () => {
    const { getByText } = render(<InvestmentSection {...defaultProps} />);
    expect(getByText('0 positions')).toBeInTheDocument();
  });

  it('renders retirement section title when isRetirement=true', () => {
    const { getByText } = render(<InvestmentSection {...defaultProps} title="Retirement" isRetirement={true} />);
    expect(getByText('Retirement')).toBeInTheDocument();
  });
});
