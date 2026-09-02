import rawData from '@/data/research.json';

import type { ResearchData } from '@/lib/research-types';

export const researchData = rawData as ResearchData;

export const sourceById = new Map(researchData.sources.map((source) => [source.id, source]));
export const evidenceById = new Map(researchData.evidence.map((item) => [item.id, item]));
export const classificationById = new Map(researchData.classifications.map((item) => [item.id, item]));
export const responseTypeById = new Map(researchData.responseTypes.map((item) => [item.id, item]));
