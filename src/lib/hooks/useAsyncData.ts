'use client';

import { useEffect, useState, useCallback } from 'react';
import { ApiError } from '@/lib/api';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | Error | null;
}

/** Fetch on mount and when the stable fetcher changes; refetch ignores superseded responses. */
export function useAsyncData<T>(fetcher: () => Promise<T>): AsyncState<T> & { refetch: () => void } {
  const [revision, setRevision] = useState(0);
  const [settled, setSettled] = useState<{ fetcher: typeof fetcher; revision: number; data: T | null; error: Error | null } | null>(null);
  useEffect(() => {
    let active = true;
    fetcher().then((data) => {
      if (active) setSettled({ fetcher, revision, data, error: null });
    }).catch((error: unknown) => {
      if (active) setSettled({ fetcher, revision, data: null, error: error instanceof Error ? error : new Error(String(error)) });
    });
    return () => { active = false; };
  }, [fetcher, revision]);
  const refetch = useCallback(() => setRevision((current) => current + 1), []);
  const loading = settled?.fetcher !== fetcher || settled.revision !== revision;
  return { data: settled?.data ?? null, error: loading ? null : settled.error, loading, refetch };
}
