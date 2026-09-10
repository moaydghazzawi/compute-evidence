'use client';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Verdict } from '@/components/verdict';
import type { ResearchCase, TaxonomyItem } from '@/lib/research-types';

export function ComparisonMatrix({
  cases,
  classifications,
}: {
  cases: ResearchCase[];
  classifications: TaxonomyItem[];
}) {
  const dimensions = cases[0]?.tests ?? [];
  const [dimension, setDimension] = useState(dimensions[0]?.id ?? '');
  const label = dimensions.find((test) => test.id === dimension)?.label;
  return (
    <div className="comparison-workspace">
      <div
        className="dimension-controls"
        role="group"
        aria-label="Comparison dimension"
      >
        {dimensions.map((test, index) => (
          <button
            type="button"
            key={test.id}
            onClick={() => setDimension(test.id)}
            aria-pressed={dimension === test.id}
          >
            <span>{String(index + 1).padStart(2, '0')}</span>
            {test.label}
          </button>
        ))}
      </div>
      <div className="comparison-table-wrap">
        <table className="comparison-table">
          <caption className="sr-only">
            Compare {label?.toLowerCase()} across all research cases
          </caption>
          <thead>
            <tr>
              <th scope="col">Response case</th>
              <th scope="col">{label}</th>
              <th scope="col">Overall judgment</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((item) => {
              const test = item.tests.find((t) => t.id === dimension);
              return (
                <tr key={item.id}>
                  <th scope="row">
                    <a href={'/?case=' + item.id + '#cases'}>
                      {item.shortTitle}
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                    <span className="table-period">{item.period}</span>
                  </th>
                  <td>
                    <span className="status-tag">{test?.status}</span>
                    <p>{test?.answer}</p>
                  </td>
                  <td>
                    <Verdict
                      classification={classifications.find(
                        (c) => c.id === item.classification,
                      )!}
                    />
                    <p className="table-confidence">
                      {item.confidence} confidence
                    </p>
                    <a className="text-link" href={'/evidence?case=' + item.id}>
                      {item.evidenceIds.length} evidence records{' '}
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="comparison-note">
        Judgments are provisional. “Narrow control-point weakening” applies to a
        targeted control point and does not establish independence across the
        supply chain.
      </p>
    </div>
  );
}
