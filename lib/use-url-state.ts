'use client';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

const changeEvent = 'research-url-state';
function subscribe(notify: () => void) {
  window.addEventListener('popstate', notify);
  window.addEventListener(changeEvent, notify);
  return () => {
    window.removeEventListener('popstate', notify);
    window.removeEventListener(changeEvent, notify);
  };
}
const getSearch = () => window.location.search;
const serverSearch = () => null;

export function useUrlState<T extends Record<string, string>>(
  defaults: T,
  options: Partial<Record<keyof T, string[]>>,
) {
  const search = useSyncExternalStore(subscribe, getSearch, serverSearch);
  const read = useCallback(
    (value: string) => {
      const params = new URLSearchParams(value);
      const next = { ...defaults };
      for (const key of Object.keys(defaults) as (keyof T)[]) {
        const candidate = params.get(String(key));
        if (
          candidate !== null &&
          (!options[key] || options[key]!.includes(candidate))
        ) {
          next[key] = candidate as T[keyof T];
        }
      }
      return next;
    },
    [defaults, options],
  );
  const state = useMemo(() => read(search ?? ''), [read, search]);
  const update = useCallback(
    (changes: Partial<T>, replace = false, clearHash = false) => {
      const url = new URL(window.location.href);
      const next = { ...read(url.search), ...changes };
      if (clearHash) url.hash = '';
      for (const key of Object.keys(defaults) as (keyof T)[]) {
        if (next[key] === defaults[key]) url.searchParams.delete(String(key));
        else url.searchParams.set(String(key), next[key]);
      }
      if (url.href !== window.location.href) {
        window.history[replace ? 'replaceState' : 'pushState'](
          window.history.state,
          '',
          url,
        );
        window.dispatchEvent(new Event(changeEvent));
      }
    },
    [defaults, read],
  );
  return { state, update, ready: search !== null };
}
