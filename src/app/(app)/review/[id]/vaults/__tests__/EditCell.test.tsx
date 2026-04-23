import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditCell } from '@/app/(app)/review/[id]/vaults/EditCell';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/lib/store', () => ({
  useReviewStore: () => ({ state: { activeReview: null, isEditMode: false }, actions: {} }),
  useSessionStore: () => ({ state: {}, actions: {} }),
}));

describe('EditCell', () => {
  it('readOnly mode renders value as text with no input', () => {
    render(<EditCell value="Rent" onCommit={vi.fn()} readOnly={true} />);
    expect(screen.getByText('Rent')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('edit mode: clicking the value shows an input with the correct value', async () => {
    const user = userEvent.setup();
    render(<EditCell value="Rent" onCommit={vi.fn()} readOnly={false} />);
    await user.click(screen.getByText('Rent'));
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('Rent');
  });

  it('Escape in edit mode hides the input and does not call onCommit', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<EditCell value="Rent" onCommit={onCommit} readOnly={false} />);
    await user.click(screen.getByText('Rent'));
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'Mortgage');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('Enter in edit mode calls onCommit with the new value', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<EditCell value="Rent" onCommit={onCommit} readOnly={false} />);
    await user.click(screen.getByText('Rent'));
    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'Mortgage');
    await user.keyboard('{Enter}');
    expect(onCommit).toHaveBeenCalledWith('Mortgage');
  });
});
