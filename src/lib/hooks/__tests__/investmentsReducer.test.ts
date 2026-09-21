import { describe, it, expect } from 'vitest';
import { investmentsReducer, initialInvestmentsState } from '@/lib/hooks/investmentsReducer';

describe('investmentsReducer — retirement modal', () => {
  it('OPEN_RETIREMENT_MODAL sets mode and accountId together in one action', () => {
    const state = investmentsReducer(initialInvestmentsState, {
      type: 'OPEN_RETIREMENT_MODAL',
      mode: 'edit',
      accountId: 42,
    });
    expect(state.retirementModalMode).toBe('edit');
    expect(state.retirementModalAccountId).toBe(42);
  });

  it('CLOSE_RETIREMENT_MODAL resets both fields to null regardless of prior state', () => {
    const opened = investmentsReducer(initialInvestmentsState, {
      type: 'OPEN_RETIREMENT_MODAL',
      mode: 'edit',
      accountId: 42,
    });
    const closed = investmentsReducer(opened, { type: 'CLOSE_RETIREMENT_MODAL' });
    expect(closed.retirementModalMode).toBeNull();
    expect(closed.retirementModalAccountId).toBeNull();
  });

  // Regression: closing used to be implemented as two separate dispatches
  // (one for mode, one for accountId), each rebuilding a full OPEN_RETIREMENT_MODAL
  // action from state captured in a stale closure. The second dispatch would silently
  // re-open the modal with the pre-close mode. Closing must be a single action.
  it('closing after opening in edit mode does not leave the modal reopened', () => {
    const opened = investmentsReducer(initialInvestmentsState, {
      type: 'OPEN_RETIREMENT_MODAL',
      mode: 'edit',
      accountId: 7,
    });
    const closed = investmentsReducer(opened, { type: 'CLOSE_RETIREMENT_MODAL' });
    expect(closed.retirementModalMode).not.toBe('edit');
    expect(closed.retirementModalMode).not.toBe('add');
    expect(closed).toEqual({ ...opened, retirementModalMode: null, retirementModalAccountId: null });
  });

  it('opening in add mode carries a null accountId', () => {
    const state = investmentsReducer(initialInvestmentsState, {
      type: 'OPEN_RETIREMENT_MODAL',
      mode: 'add',
      accountId: null,
    });
    expect(state.retirementModalMode).toBe('add');
    expect(state.retirementModalAccountId).toBeNull();
  });
});
