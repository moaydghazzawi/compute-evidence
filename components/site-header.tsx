import { ArrowDownToLine, Database, Menu } from 'lucide-react';

const nav = [
  { href: '/#cases', label: 'Cases' },
  { href: '/#matrix', label: 'Matrix' },
  { href: '/#timeline', label: 'Timeline' },
  { href: '/evidence', label: 'Evidence' },
  { href: '/methodology', label: 'Method' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-[1480px] items-center justify-between gap-4 px-5 py-3 lg:px-10">
        <a className="flex min-w-0 items-center gap-3" href="/" aria-label="When Controls Raise the Cost, home">
          <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-primary text-[10px] font-bold tracking-[0.16em] text-primary-foreground">
            C/P
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Advanced-compute evidence ledger
            </span>
            <span className="block truncate text-sm font-semibold tracking-tight">When Controls Raise the Cost</span>
          </span>
        </a>
        <nav className="hidden items-center gap-6 text-xs font-semibold text-muted-foreground lg:flex" aria-label="Primary">
          {nav.map((item) => <a className="transition-colors hover:text-foreground" href={item.href} key={item.href}>{item.label}</a>)}
        </nav>
        <div className="flex items-center gap-2">
          <a className="hidden min-h-8 items-center gap-2 border border-border bg-background px-3 text-xs font-bold transition-colors hover:bg-muted sm:inline-flex" href="/data/evidence.csv" download>
            <ArrowDownToLine className="size-3.5" /> CSV
          </a>
          <a aria-label="Download JSON research dataset" className="inline-flex min-h-8 items-center gap-2 bg-primary px-3 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-85" href="/data/research-dataset.json" download>
            <Database className="size-3.5" /> <span className="hidden sm:inline">Dataset</span>
          </a>
          <details className="group relative lg:hidden">
            <summary
              aria-label="Open navigation menu"
              className="grid size-8 cursor-pointer list-none place-items-center border border-border bg-card transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden"
            >
              <Menu aria-hidden="true" className="size-4" />
            </summary>
            <nav
              aria-label="Mobile primary"
              className="absolute right-0 top-[calc(100%+0.5rem)] z-50 grid min-w-52 border border-border bg-card p-2 shadow-xl"
            >
              {nav.map((item) => (
                <a className="px-3 py-2.5 text-xs font-semibold text-foreground hover:bg-muted" href={item.href} key={item.href}>
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
