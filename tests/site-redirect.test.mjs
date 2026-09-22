import test from 'node:test';
import assert from 'node:assert/strict';
import { redirectLegacyDomain } from '../lib/site-redirect.ts';

test('old-domain links preserve their path, repeated filters and URL encoding', () => {
  for (const method of ['GET', 'HEAD']) {
    const response = redirectLegacyDomain(
      new Request(
        'https://when-controls-raise-the-cost.moaydghazzawi.com/evidence?case=case-cloudmatrix&q=a%2Bb&q=c',
        { method },
      ),
    );
    assert.equal(response.status, 308);
    assert.equal(
      response.headers.get('Location'),
      'https://compute-evidence.moaydghazzawi.com/evidence?case=case-cloudmatrix&q=a%2Bb&q=c',
    );
  }
});

test('new, preview, local and lookalike hosts do not redirect', () => {
  for (const origin of [
    'https://compute-evidence.moaydghazzawi.com',
    'https://preview.example.org',
    'http://localhost:4317',
    'https://when-controls-raise-the-cost.moaydghazzawi.com.example.org',
  ]) {
    assert.equal(redirectLegacyDomain(new Request(`${origin}/desk`)), null);
  }
});

test('existing desk API requests stay on their original origin', () => {
  for (const method of ['POST', 'OPTIONS']) {
    assert.equal(
      redirectLegacyDomain(
        new Request(
          'https://when-controls-raise-the-cost.moaydghazzawi.com/api/research-desk',
          {
            method,
          },
        ),
      ),
      null,
    );
  }
});
