'use client';
import { useEffect } from 'react';

export function LegacyResearchRedirect() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (
      ['#cases', '#matrix', '#timeline'].includes(url.hash) ||
      [
        'case',
        'judgment',
        'response',
        'year',
        'confidence',
        'dependency',
        'source',
        'q',
      ].some((key) => url.searchParams.has(key))
    ) {
      window.location.replace('/research' + url.search + url.hash);
    }
  }, []);
  return null;
}
