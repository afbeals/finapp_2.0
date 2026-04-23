import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InvestmentsPage from '@/app/(app)/review/[id]/investments/page';
import { makeInvestmentAccount } from '@/test/fixtures';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/lib/store', () => ({
  useReviewStore: () => ({
    state: { activeReview: { id: 1, type: 'MONTHLY', status: 'IN_PROGRESS' }, isEditMode: false },
    actions: { setCurrentStep: vi.fn(), updateStepStatus: vi.fn() },
  }),
}));

const taxableAccount = makeInvestmentAccount({ id: 1, name: 'My Brokerage', type: 'TAXABLE' });

vi.mock('@/lib/api', () => ({
  getReviewInvestments: vi.fn(() =>
    Promise.resolve({
      accounts: [taxableAccount],
      snapshots: [],
      retirementSnapshots: [],
      allRetirementSnapshots: [],
    })
  ),
  getInvestmentCategories: vi.fn(() => Promise.resolve({ categories: [] })),
  getMembers: vi.fn(() => Promise.resolve({ members: [] })),
  getMarketPrices: vi.fn(() => Promise.resolve({ prices: {}, names: {} })),
  apiPut: vi.fn(() => Promise.resolve({})),
  apiDelete: vi.fn(() => Promise.resolve({})),
  createInvestmentAccount: vi.fn(() => Promise.resolve({ account: taxableAccount })),
  updateInvestmentAccount: vi.fn(() => Promise.resolve({ account: taxableAccount })),
  deleteInvestmentAccount: vi.fn(() => Promise.resolve({ ok: true })),
  upsertRetirementSnapshot: vi.fn(() => Promise.resolve({ snapshot: {} })),
}));

global.fetch = vi.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
) as unknown as typeof fetch;

describe('InvestmentsPage', () => {
  it('mounts without throwing', async () => {
    render(<InvestmentsPage />);
    expect(document.body).toBeTruthy();
  });

  it('renders the taxable section heading after load', async () => {
    render(<InvestmentsPage />);
    const heading = await screen.findByText('Investment Accounts (Taxable)');
    expect(heading).toBeInTheDocument();
  });

  it('renders the Retirement Accounts section heading after load', async () => {
    render(<InvestmentsPage />);
    const heading = await screen.findByText('Retirement Accounts');
    expect(heading).toBeInTheDocument();
  });

  it('renders the Combined Portfolio Summary after load', async () => {
    render(<InvestmentsPage />);
    const heading = await screen.findByText('Combined Portfolio Summary');
    expect(heading).toBeInTheDocument();
  });
});
