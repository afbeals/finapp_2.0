import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoansPage from '@/app/(app)/review/[id]/loans/page';
import { makeLoan, makeLoanSnapshot } from '@/test/fixtures';

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

const schoolLoan = makeLoan({ id: 1, name: 'Student Loan A', category: 'SCHOOL', principal: 2500000, rate: 0.05, termMonths: 120 });
const mortgageLoan = makeLoan({ id: 2, name: 'Home Mortgage', category: 'MORTGAGE', principal: 30000000, rate: 0.065, termMonths: 360 });

vi.mock('@/lib/api', () => ({
  getReviewLoans: vi.fn(() =>
    Promise.resolve({
      loans: [schoolLoan, mortgageLoan],
      snapshots: [
        makeLoanSnapshot({ loanId: 1 }),
        makeLoanSnapshot({ loanId: 2, balance: 30000000, paymentsMade: 0 }),
      ],
    })
  ),
  patchLoanSnapshot: vi.fn(() => Promise.resolve({ snapshot: makeLoanSnapshot() })),
  patchLoan: vi.fn(() => Promise.resolve({ loan: schoolLoan })),
}));

global.fetch = vi.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
) as unknown as typeof fetch;

describe('LoansPage', () => {
  it('mounts without throwing', async () => {
    render(<LoansPage />);
    expect(document.body).toBeTruthy();
  });

  it('renders the school loans section heading after load', async () => {
    render(<LoansPage />);
    const heading = await screen.findByText('🎓 School Loans');
    expect(heading).toBeInTheDocument();
  });

  it('renders the page title from STEP_META', async () => {
    render(<LoansPage />);
    // StepShell renders the title from STEP_META.loans.title
    const title = await screen.findByRole('heading', { level: 1 });
    expect(title).toBeInTheDocument();
  });

  it('renders the school loan name', async () => {
    render(<LoansPage />);
    const loan = await screen.findByText('Student Loan A');
    expect(loan).toBeInTheDocument();
  });
});
