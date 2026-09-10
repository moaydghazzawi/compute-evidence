'use client';
import { useCallback, useEffect, useState } from 'react';

export function useUrlState<T extends Record<string, string>>(
  defaults: T,
  options: Partial<Record<keyof T, string[]>>,
) {
  const [state, setState] = useState<T>(defaults);
  const [ready, setReady] = useState(false);
  const read = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const next = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const value = params.get(String(key));
      if (value !== null && (!options[key] || options[key]!.includes(value)))
        next[key] = value as T[keyof T];
    }
    return next;
  }, [defaults, options]);
  useEffect(() => {
    const restore = () => setState(read());
    restore();
    setReady(true);
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [read]);
  const update = useCallback(
    (changes: Partial<T>, replace = false, clearHash = false) => {
      const next = { ...state, ...changes };
      const url = new URL(window.location.href);
      if (clearHash) url.hash = '';
      for (const key of Object.keys(defaults) as (keyof T)[]) {
        if (next[key] === defaults[key]) url.searchParams.delete(String(key));
        else url.searchParams.set(String(key), next[key]);
      }
      setState(next);
      if (url.href !== window.location.href)
        window.history[replace ? 'replaceState' : 'pushState'](null, '', url);
    },
    [defaults, state],
  );
  return { state, update, ready };
}
