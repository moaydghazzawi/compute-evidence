'use client';
import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CopyLink({
  path,
  label = 'Copy link',
}: {
  path?: string;
  label?: string;
}) {
  const [result, setResult] = useState<{
    path?: string;
    copied: boolean;
    fallback: string;
  }>({ copied: false, fallback: '' });
  const copied = result.path === path && result.copied;
  const fallback = result.path === path ? result.fallback : '';
  async function copy() {
    const url = path
      ? new URL(path, window.location.origin).href
      : window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setResult({ path, copied: true, fallback: '' });
    } catch {
      setResult({ path, copied: false, fallback: url });
    }
  }
  return (
    <span className="copy-control">
      <Button variant="outline" className="utility-button" onClick={copy}>
        {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
        {copied ? 'Copied' : label}
      </Button>
      <output className="sr-only">
        {copied
          ? 'Link copied'
          : fallback
            ? 'Copying was unavailable. Select and copy the link below.'
            : ''}
      </output>
      {fallback ? (
        <label className="copy-fallback">
          Select and copy this link
          <input
            aria-label="Link to copy"
            readOnly
            value={fallback}
            onFocus={(event) => event.target.select()}
          />
        </label>
      ) : null}
    </span>
  );
}
