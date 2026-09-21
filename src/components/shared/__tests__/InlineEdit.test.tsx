import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InlineEdit } from '@/components/shared/InlineEdit';

describe('InlineEdit delta mode', () => {
  it('does not show a delta affordance when allowDelta is not set', () => {
    render(<InlineEdit value="100.00" onSave={vi.fn()} />);
    expect(screen.queryByTitle('Add or subtract an amount')).not.toBeInTheDocument();
  });

  it('clicking the ± button opens a delta input instead of the normal edit input', async () => {
    const user = userEvent.setup();
    render(<InlineEdit value="100.00" onSave={vi.fn()} allowDelta />);
    await user.click(screen.getByTitle('Add or subtract an amount'));
    expect(screen.getByPlaceholderText('+/- amount')).toBeInTheDocument();
  });

  it('adds a positive delta to the current value and calls onSave with the new total', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<InlineEdit value="100.00" onSave={onSave} allowDelta />);
    await user.click(screen.getByTitle('Add or subtract an amount'));
    const input = screen.getByPlaceholderText('+/- amount');
    await user.type(input, '25.50');
    await user.keyboard('{Enter}');
    expect(onSave).toHaveBeenCalledWith('125.5');
  });

  it('subtracts a negative delta from the current value', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<InlineEdit value="100.00" onSave={onSave} allowDelta />);
    await user.click(screen.getByTitle('Add or subtract an amount'));
    const input = screen.getByPlaceholderText('+/- amount');
    await user.type(input, '-40');
    await user.keyboard('{Enter}');
    expect(onSave).toHaveBeenCalledWith('60');
  });

  it('Escape cancels delta mode without calling onSave', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<InlineEdit value="100.00" onSave={onSave} allowDelta />);
    await user.click(screen.getByTitle('Add or subtract an amount'));
    const input = screen.getByPlaceholderText('+/- amount');
    await user.type(input, '25');
    await user.keyboard('{Escape}');
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText('+/- amount')).not.toBeInTheDocument();
  });

  it('leaving the delta input empty does not call onSave', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<InlineEdit value="100.00" onSave={onSave} allowDelta />);
    await user.click(screen.getByTitle('Add or subtract an amount'));
    await user.keyboard('{Enter}');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('respects a parser when applying the delta, matching normal-edit behavior', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(
      <InlineEdit
        value="100.00"
        onSave={onSave}
        allowDelta
        parser={(v) => String(Math.round(parseFloat(v) * 100))}
      />
    );
    await user.click(screen.getByTitle('Add or subtract an amount'));
    const input = screen.getByPlaceholderText('+/- amount');
    await user.type(input, '10');
    await user.keyboard('{Enter}');
    // (100 + 10) * 100 = 11000
    expect(onSave).toHaveBeenCalledWith('11000');
  });
});
