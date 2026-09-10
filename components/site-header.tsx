'use client';
import { useRef } from 'react';
import { ArrowDownToLine, Menu, ArrowUpRight } from 'lucide-react';
const nav = [
  { href: '/#cases', label: 'Cases' },
  { href: '/#matrix', label: 'Matrix' },
  { href: '/#timeline', label: 'Timeline' },
  { href: '/evidence', label: 'Evidence' },
  { href: '/methodology', label: 'Method' },
];
export function SiteHeader({
  current,
}: {
  current?: 'overview' | 'evidence' | 'methodology';
}) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  return (
    <header className="site-header">
      <div className="page-width header-inner">
        <a
          className="site-brand"
          href="/"
          aria-label="When Controls Raise the Cost, home"
        >
          <span className="brand-mark" aria-hidden="true">
            W<span>/</span>C
          </span>
          <span className="brand-title">
            When Controls
            <br />
            Raise the Cost
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Primary">
          {nav.map((item) => (
            <a
              href={item.href}
              key={item.href}
              aria-current={item.href === '/' + current ? 'page' : undefined}
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
          <details
            className="mobile-menu"
            ref={menuRef}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && menuRef.current) {
                menuRef.current.open = false;
                menuRef.current.querySelector('summary')?.focus();
              }
            }}
          >
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
