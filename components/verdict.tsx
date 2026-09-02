import type { TaxonomyItem } from '@/lib/research-types';

const verdictClasses: Record<string, string> = {
  'genuine-weakening': 'verdict-teal',
  'adaptation-cost': 'verdict-amber',
  circumvention: 'verdict-red',
  'insufficient-evidence': 'verdict-slate',
};

export function Verdict({ classification, compact = false }: { classification: TaxonomyItem; compact?: boolean }) {
  return (
    <span className={`verdict ${verdictClasses[classification.id] ?? 'verdict-slate'} ${compact ? 'verdict-compact' : ''}`}>
      {classification.label}
    </span>
  );
}
