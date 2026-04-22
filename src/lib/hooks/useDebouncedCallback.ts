'use client';

import { useRef, useCallback } from 'react';

/**
 * Returns a debounced version of `fn` that fires only after `delay` ms of
 * inactivity. The returned function is stable across renders.
 */
export function useDebouncedCallback<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay: number,
): (...args: TArgs) => void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return useCallback(
    (...args: TArgs) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { fnRef.current(...args); }, delay);
    },
    [delay],
  );
}
