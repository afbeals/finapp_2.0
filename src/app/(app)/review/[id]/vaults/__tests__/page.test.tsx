import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import VaultsPage from '@/app/(app)/review/[id]/vaults/page';
import { makeVault } from '@/test/fixtures';

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

const fixedVault = makeVault({ id: 1, type: 'FIXED', name: 'Rent', category: 'Bills', target: 150000, frequency: 'MONTHLY', rateMonths: 1 });
const variableVault = makeVault({ id: 2, type: 'VARIABLE', name: 'Vacation', category: 'Treasury', target: 300000 });

vi.mock('@/lib/api', () => ({
  getReviewVaults: vi.fn(() => Promise.resolve({ vaults: [fixedVault, variableVault] })),
  getMembers: vi.fn(() => Promise.resolve({ members: [] })),
  getVaultCategoryOrders: vi.fn(() => Promise.resolve({ orders: [] })),
  putReviewVaults: vi.fn(() => Promise.resolve({ snapshots: [] })),
  patchVault: vi.fn(() => Promise.resolve({ vault: fixedVault })),
  deleteVault: vi.fn(() => Promise.resolve({ ok: true })),
  createVault: vi.fn(() => Promise.resolve({ vault: makeVault({ id: 3 }) })),
  patchVaultCategoryOrder: vi.fn(() => Promise.resolve({})),
}));

global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })) as unknown as typeof fetch;

describe('VaultsPage', () => {
  it('mounts without throwing', async () => {
    render(<VaultsPage />);
    expect(document.body).toBeTruthy();
  });

  it('renders the Fixed Allocations section heading after load', async () => {
    render(<VaultsPage />);
    const heading = await screen.findByText('Fixed Allocations');
    expect(heading).toBeInTheDocument();
  });

  it('renders the Treasury Distribution section heading after load', async () => {
    render(<VaultsPage />);
    const heading = await screen.findByText('Treasury Distribution');
    expect(heading).toBeInTheDocument();
  });

  it('renders the Bills category from the fixture vault', async () => {
    render(<VaultsPage />);
    const cats = await screen.findAllByText('Bills');
    expect(cats.length).toBeGreaterThan(0);
  });

  it('renders the variable vault row name', async () => {
    render(<VaultsPage />);
    const row = await screen.findByText('Vacation');
    expect(row).toBeInTheDocument();
  });
});
