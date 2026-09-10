'use client';
import { useEffect, useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CopyLink({
  path,
  label = 'Copy link',
}: {
  path?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [fallback, setFallback] = useState('');
  useEffect(() => {
    setCopied(false);
    setFallback('');
  }, [path]);
  async function copy() {
    const url = path
      ? new URL(path, window.location.origin).href
      : window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setFallback('');
    } catch {
      setCopied(false);
      setFallback(url);
    }
  }
  return (
    <span className="copy-control">
      <Button variant="outline" className="utility-button" onClick={copy}>
        {copied ? <Check aria-hidden="true" /> : <Link2 aria-hidden="true" />}
        {copied ? 'Copied' : label}
      </Button>
      <span className="sr-only" role="status">
        {copied
          ? 'Link copied'
          : fallback
            ? 'Copying was unavailable. Select and copy the link below.'
            : ''}
      </span>
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
