'use client';
import { useEffect, useRef } from 'react';
import { ArrowDownToLine, Menu, ArrowUpRight } from 'lucide-react';
import { TOOL_NAME } from '@/lib/site-identity';
const nav = [
  { href: '/', label: 'Home' },
  { href: '/desk', label: 'Research desk' },
  { href: '/research', label: 'Research' },
  { href: '/evidence', label: 'Evidence' },
  { href: '/methodology', label: 'Method' },
];
export function SiteHeader({
  current,
}: {
  current?: 'home' | 'overview' | 'desk' | 'evidence' | 'methodology';
}) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menuRef.current?.open) {
        menuRef.current.open = false;
        menuRef.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);
  return (
    <header className="site-header">
      <div className="page-width header-inner">
        <a className="site-brand" href="/" aria-label={`${TOOL_NAME}, home`}>
          <span className="brand-mark" aria-hidden="true">
            ce
          </span>
          <span className="brand-title">
            {TOOL_NAME}
            <span className="brand-caption">Chips · AI · Policy</span>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Primary">
          {nav.map((item) => (
            <a
              href={item.href}
              key={item.href}
              aria-current={
                item.href ===
                (current === 'home'
                  ? '/'
                  : current === 'overview'
                    ? '/research'
                    : '/' + current)
                  ? 'page'
                  : undefined
              }
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <a
            className="header-download"
            href="/data/research-dataset.json"
            download
            aria-label="Download JSON research dataset"
          >
            <ArrowDownToLine size={16} aria-hidden="true" />
            <span>Dataset</span>
          </a>
          <a
            className="author-link"
            href="https://github.com/moaydghazzawi/when-controls-raise-the-cost"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
            <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          <details className="mobile-menu" ref={menuRef}>
            <summary aria-label="Open navigation menu">
              <Menu size={21} aria-hidden="true" />
            </summary>
            <nav aria-label="Mobile primary">
              {nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (menuRef.current) menuRef.current.open = false;
                  }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
