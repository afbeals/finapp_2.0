import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PortfolioPage from '@/app/(app)/review/[id]/portfolio/page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/lib/store', () => ({
  useReviewStore: () => ({
    state: { activeReview: { id: 1, type: 'QUARTERLY', status: 'IN_PROGRESS' }, isEditMode: false },
    actions: { setCurrentStep: vi.fn(), updateStepStatus: vi.fn() },
  }),
}));

vi.mock('@/lib/api', () => ({
  getReviewIncome: vi.fn(() => Promise.resolve({ entries: [] })),
  getReviewExpenses: vi.fn(() => Promise.resolve({ entries: [] })),
  getReviewInvestments: vi.fn(() =>
    Promise.resolve({ accounts: [], snapshots: [], retirementSnapshots: [] })
  ),
  getReviewSavings: vi.fn(() => Promise.resolve({ accounts: [], snapshots: [] })),
  getReviewLoans: vi.fn(() => Promise.resolve({ loans: [], snapshots: [] })),
  apiGet: vi.fn(() => Promise.resolve({ reviews: [] })),
}));

global.fetch = vi.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
) as unknown as typeof fetch;

describe('PortfolioPage', () => {
  it('mounts without throwing', async () => {
    render(<PortfolioPage />);
    expect(document.body).toBeTruthy();
  });

  it('renders the Net Worth KPI label after load', async () => {
    render(<PortfolioPage />);
    const label = await screen.findByText('Net Worth');
    expect(label).toBeInTheDocument();
  });

  it('renders the Savings Rate KPI label after load', async () => {
    render(<PortfolioPage />);
    const label = await screen.findByText('Savings Rate');
    expect(label).toBeInTheDocument();
  });

  it('renders the FIRE Progress KPI label after load', async () => {
    render(<PortfolioPage />);
    const label = await screen.findByText('FIRE Progress');
    expect(label).toBeInTheDocument();
  });
});
