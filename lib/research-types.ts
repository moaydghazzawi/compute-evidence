export type Confidence = 'High' | 'Moderate' | 'Low';
export type Relationship = 'supports' | 'qualifies' | 'counters';

export interface TaxonomyItem {
  id: string;
  label: string;
  definition: string;
}

export interface CaseTest {
  id: string;
  label: string;
  status: string;
  answer: string;
}

export interface ResearchCase {
  id: string;
  title: string;
  shortTitle: string;
  date: string;
  period: string;
  responseTypes: string[];
  classification: string;
  confidence: Confidence;
  dependencyStatus: string;
  finding: string;
  tests: CaseTest[];
  evidenceIds: string[];
  uncertainties: string[];
}

export interface Evidence {
  id: string;
  caseIds: string[];
  claim: string;
  sourceId: string;
  sourceType: string;
  publicationDate: string | null;
  accessDate: string;
  quotationOrData: string;
  location: string;
  counterevidence: string;
  confidence: Confidence;
  remainingUncertainty: string;
  relationship: Relationship;
}

export interface Source {
  id: string;
  title: string;
  organization: string;
  url: string;
  sourceType: string;
  publicationDate: string | null;
  accessDate: string;
  primary: boolean;
}

export interface TimelineEvent {
  id: string;
  date: string;
  displayDate: string;
  title: string;
  summary: string;
  status: string;
  caveat: string;
  sourceIds: string[];
}

export interface ResearchData {
  meta: {
    title: string;
    subtitle: string;
    question: string;
    version: string;
    status: string;
    evidenceThrough: string;
    accessed: string;
    currentFinding: string;
    summary: string;
    conversationSummary: string;
  };
  responseTypes: TaxonomyItem[];
  classifications: TaxonomyItem[];
  methodology: {
    sixQuestions: string[];
    sourceHierarchy: string[];
    limitations: string[];
    whatWouldChangeMind: string[];
  };
  timeline: TimelineEvent[];
  cases: ResearchCase[];
  evidence: Evidence[];
  sources: Source[];
}
