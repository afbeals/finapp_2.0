import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FixedSection } from '@/app/(app)/review/[id]/vaults/FixedSection';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  updateVault: vi.fn(() => Promise.resolve(null)),
  deleteVault: vi.fn(() => Promise.resolve({ ok: true })),
  createVault: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@/lib/store', () => ({
  useReviewStore: () => ({ state: { activeReview: null, isEditMode: false }, actions: {} }),
  useSessionStore: () => ({ state: {}, actions: {} }),
}));

const defaultProps = {
  category: 'Housing',
  groupOrder: 1,
  vaults: [],
  members: [],
  readOnly: true,
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
  onAdd: vi.fn(),
};

describe('FixedSection', () => {
  it('mounts without throwing', () => {
    render(<FixedSection {...defaultProps} />);
    expect(document.body).toBeTruthy();
  });

  it('renders the category label', () => {
    render(<FixedSection {...defaultProps} />);
    expect(screen.getByText('Housing')).toBeInTheDocument();
  });

  it('renders the subtotal badge', () => {
    render(<FixedSection {...defaultProps} />);
    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
  });

  it('does not render "Add row" button when readOnly=true', () => {
    render(<FixedSection {...defaultProps} readOnly={true} />);
    expect(screen.queryByText(/add row/i)).not.toBeInTheDocument();
  });
});
