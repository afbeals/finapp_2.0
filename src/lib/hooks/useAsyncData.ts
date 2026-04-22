'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ApiError } from '@/lib/api';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | Error | null;
}

/**
 * Minimal data-fetching hook: fire `fetcher` on mount (and whenever `key` changes),
 * expose { data, loading, error, refetch }.
 *
 * `fetcher` should be stable (wrapped in useCallback at the call site) or the
 * dep array will trigger re-fetches. Passing a string `key` alongside a constant
 * `fetcher` is the simplest pattern when the key drives the URL.
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });
  const counter = useRef(0);

  const run = useCallback(() => {
    const id = ++counter.current;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    fetcher()
      .then((data) => {
        if (id === counter.current) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (id === counter.current)
          setState({ data: null, loading: false, error: err instanceof Error ? err : new Error(String(err)) });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);

  return { ...state, refetch: run };
}
