import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MembersSection } from '@/app/(app)/config/MembersSection';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/lib/api', () => ({
  createMember: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@/lib/store', () => ({
  useReviewStore: () => ({ state: { activeReview: null, isEditMode: false }, actions: {} }),
  useSessionStore: () => ({ state: {}, actions: {} }),
}));

describe('MembersSection', () => {
  it('renders the "Household Members" heading', () => {
    render(<MembersSection members={[]} setMembers={vi.fn()} />);
    expect(screen.getByText('Household Members')).toBeInTheDocument();
  });

  it('renders the "Add Member" button', () => {
    render(<MembersSection members={[]} setMembers={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add member/i })).toBeInTheDocument();
  });

  it('shows empty state message when no members', () => {
    render(<MembersSection members={[]} setMembers={vi.fn()} />);
    expect(screen.getByText('No members yet.')).toBeInTheDocument();
  });
});
