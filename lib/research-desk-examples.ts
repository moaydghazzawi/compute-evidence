import type { DeskExample } from './research-desk';

export const DESK_EXAMPLES: DeskExample[] = [
  {
    id: 'deepseek-cost',
    label: 'The $5.6m claim',
    query: 'DeepSeek-V3 cost only $5.576 million to develop.',
    note: 'The disclosed training estimate is not the full cost of developing the model.',
    matches: [
      { id: 'ev-deepseek-cost', role: 'challenges' },
      { id: 'ev-deepseek-compute', role: 'context' },
    ],
  },
  {
    id: 'domestic-training',
    label: 'Training without Nvidia',
    query:
      'China cannot complete very-large-model training without top U.S. accelerators.',
    note: 'Huawei’s reported Ascend run challenges this absolute claim. Independent replication and upstream dependencies remain unresolved.',
    matches: [
      { id: 'ev-pangu-training', role: 'challenges' },
      { id: 'ev-pangu-weights', role: 'qualifies' },
      { id: 'ev-pangu-upstream', role: 'qualifies' },
      { id: 'ev-pangu-codesign', role: 'context' },
    ],
  },
  {
    id: 'production-serving',
    label: 'Beyond a benchmark',
    query:
      'Later CloudMatrix disclosures extend the evidence to vendor-reported production serving.',
    note: 'The later paper reports production serving. It does not independently establish power use, total cost, or competitive parity.',
    matches: [
      { id: 'ev-cloudmatrix-production', role: 'supports' },
      { id: 'ev-cloudmatrix-deployment', role: 'qualifies' },
      { id: 'ev-cloudmatrix-power', role: 'qualifies' },
      { id: 'ev-cloudmatrix-performance', role: 'context' },
    ],
  },
  {
    id: 'diversion',
    label: 'Access through diversion',
    query:
      'Gatekeeper demonstrates material diversion, but does not establish a durable alternative supply route.',
    note: 'The record establishes material diversion. Delivered chip counts, resulting AI capability, and repeatability remain unresolved.',
    matches: [
      { id: 'ev-gatekeeper-volume', role: 'supports' },
      { id: 'ev-gatekeeper-method', role: 'qualifies' },
      { id: 'ev-bis-diversion-guidance', role: 'context' },
    ],
  },
  {
    id: 'subsidy',
    label: 'Who received the subsidy?',
    query: 'The 2025 Hangzhou support policy financed DeepSeek-V3.',
    note: 'The reviewed policy postdates DeepSeek-V3. No reviewed award record ties this policy to the model.',
    matches: [
      { id: 'ev-state-hangzhou', role: 'challenges' },
      { id: 'ev-state-tax', role: 'context' },
    ],
  },
];
