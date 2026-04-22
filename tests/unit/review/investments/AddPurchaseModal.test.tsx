import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AddPurchaseModal } from '@/app/(app)/review/[id]/investments/AddPurchaseModal';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  apiPost: vi.fn(() => Promise.resolve(null)),
  getMarketPrices: vi.fn(() => Promise.resolve({ prices: {}, names: {} })),
}));

vi.mock('@/lib/store', () => ({
  useReviewStore: () => ({ state: { activeReview: null, isEditMode: false }, actions: {} }),
  useSessionStore: () => ({ state: {}, actions: {} }),
}));

const defaultProps = {
  accounts: [],
  categories: [],
  onClose: vi.fn(),
  onAdded: vi.fn(),
};

describe('AddPurchaseModal', () => {
  it('renders the modal title "Add New Purchase"', () => {
    render(<AddPurchaseModal {...defaultProps} />);
    expect(screen.getByText('Add New Purchase')).toBeInTheDocument();
  });

  it('renders the Ticker Symbol label', () => {
    render(<AddPurchaseModal {...defaultProps} />);
    expect(screen.getByText(/ticker symbol/i)).toBeInTheDocument();
  });

  it('renders the Add Purchase submit button', () => {
    render(<AddPurchaseModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /add purchase/i })).toBeInTheDocument();
  });

  it('renders the Cancel button', () => {
    render(<AddPurchaseModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('mounts without throwing when defaultAccountId is provided', () => {
    render(<AddPurchaseModal {...defaultProps} defaultAccountId={42} />);
    expect(document.body).toBeTruthy();
  });
});
