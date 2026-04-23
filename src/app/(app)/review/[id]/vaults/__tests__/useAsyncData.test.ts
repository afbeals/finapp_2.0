import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAsyncData } from '@/lib/hooks/useAsyncData';

vi.mock('@/lib/api', () => ({}));

describe('useAsyncData', () => {
  it('starts in loading state', () => {
    const fetcher = vi.fn(() => new Promise(() => {}));
    const { result } = renderHook(() => useAsyncData(fetcher));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('resolves to data after promise settles', async () => {
    const fetcher = vi.fn(() => Promise.resolve({ value: 42 }));
    const { result } = renderHook(() => useAsyncData(fetcher));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ value: 42 });
    expect(result.current.error).toBeNull();
  });

  it('surfaces errors instead of swallowing them', async () => {
    const err = new Error('network fail');
    const fetcher = vi.fn(() => Promise.reject(err));
    const { result } = renderHook(() => useAsyncData(fetcher));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('network fail');
  });

  it('refetch triggers a new fetch and returns updated data', async () => {
    let call = 0;
    const fetcher = vi.fn(() => Promise.resolve({ call: ++call }));
    const { result } = renderHook(() => useAsyncData(fetcher));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ call: 1 });

    act(() => { result.current.refetch(); });
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect((result.current.data as { call: number } | null)?.call).toBe(2);
    });
  });

  it('ignores stale response when refetch fires before first settles', async () => {
    let resolve1!: (v: unknown) => void;
    const stale = new Promise((r) => { resolve1 = r; });
    let callCount = 0;
    const fetcher = vi.fn(() => {
      callCount++;
      if (callCount === 1) return stale as Promise<{ val: number }>;
      return Promise.resolve({ val: 2 });
    });

    const { result } = renderHook(() => useAsyncData(fetcher));
    // Kick off second fetch before first resolves
    result.current.refetch();
    // Second fetch resolves first
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ val: 2 });

    // Now resolve the stale first fetch — result should not change
    resolve1({ val: 1 });
    // Give it a tick to (not) apply
    await new Promise((r) => setTimeout(r, 10));
    expect(result.current.data).toEqual({ val: 2 });
  });
});
