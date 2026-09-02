# Data and source dictionary

This document defines the canonical research dataset, generated exports, controlled vocabulary, reference rules, and validation boundaries.

## Dataset snapshot

Version 0.1.0 contains:

| Collection | Records |
|---|---:|
| Timeline events | 8 |
| Cases | 5 |
| Evidence records | 19 |
| Sources | 32 |
| Sources marked primary | 30 |
| Sources marked non-primary | 2 |

The evidence cutoff and common access date are 2 September 2026.

## Files and authority

| File | Role | Edit directly? |
|---|---|---|
| `data/research.json` | Canonical research dataset | Yes |
| `public/data/research-dataset.json` | Generated public JSON | No |
| `public/data/evidence.csv` | Generated evidence export | No |
| `scripts/research-data.mjs` | Schema, citation, and transformation rules | Only when changing the contract |
| `scripts/build-dataset.mjs` | Deterministic export generator | Only when changing output behavior |
| `tests/research-data.test.mjs` | Integrity and transformation tests | When behavior changes |

The public JSON mirrors the canonical dataset. The CSV contains one row per evidence record, enriched with case and source information.

## Top-level object

| Field | Type | Meaning |
|---|---|---|
| `meta` | object | Dataset identity, cutoff, status, and public summaries |
| `responseTypes` | array | Controlled taxonomy of response mechanisms |
| `classifications` | array | Controlled taxonomy of research judgments |
| `methodology` | object | Common test, hierarchy, limits, and falsifiers |
| `timeline` | array | Chronological U.S. policy events |
| `cases` | array | Structured response cases |
| `evidence` | array | Claim-sized evidence records |
| `sources` | array | Source registry |

All top-level collections are required and non-empty.

## `meta`

| Field | Type | Meaning |
|---|---|---|
| `title` | string | Short public project title |
| `subtitle` | string | Descriptive subtitle |
| `question` | string | Central research question |
| `version` | string | Dataset release version |
| `status` | string | Research maturity label |
| `evidenceThrough` | ISO date | Latest date covered by review |
| `accessed` | ISO date | Common review/access date |
| `currentFinding` | string | Headline judgment |
| `summary` | string | Short public abstract |
| `conversationSummary` | string | Two-minute explanation |

`evidenceThrough` is a cutoff, not a claim that every document published before that date was reviewed.

## `responseTypes`

Each item has a stable `id`, public `label`, and scoped `definition`.

| ID | Label |
|---|---|
| `domestic-substitutes` | Domestic substitutes |
| `compute-efficiency` | Compute efficiency |
| `systems-engineering` | Systems engineering |
| `rerouted-access` | Rerouted access |
| `state-support-stockpiling` | Stockpiling & state support |

Every response type must appear in at least one case.

## `classifications`

Each item has a stable `id`, public `label`, and decision-rule `definition`.

| ID | Meaning |
|---|---|
| `genuine-weakening` | Capability is restored at useful scale while dependence falls at the targeted control point |
| `adaptation-cost` | Capability is real, but added resource costs or outside dependence remain |
| `circumvention` | Enforcement is bypassed without technological independence |
| `insufficient-evidence` | Public evidence cannot establish capability, scale, or rule linkage |

Every classification must appear in at least one case.

## `methodology`

| Field | Type | Meaning |
|---|---|---|
| `sixQuestions` | exactly six strings | Canonical test applied to each case |
| `sourceHierarchy` | string array | Preferred order of source authority |
| `limitations` | string array | Known limits of the data and inference |
| `whatWouldChangeMind` | string array | Evidence that would revise the finding |

## `timeline`

Timeline records appear in ascending date order.

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Stable event identifier |
| `date` | ISO date | Analytic event date |
| `displayDate` | string | Human-readable date |
| `title` | string | Short event title |
| `summary` | string | Scope and effect |
| `status` | string | Current or historical implementation status |
| `caveat` | string | Qualification needed to avoid overstatement |
| `sourceIds` | string array | References into `sources` |

`date` can be an announcement, issuance, or effective date. `status` and `caveat` preserve the distinction when those dates differ.

## `cases`

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Stable case identifier |
| `title` | string | Full display title |
| `shortTitle` | string | Compact selector/table title |
| `date` | ISO date | Anchor date for filtering |
| `period` | string | Human-readable period covered |
| `responseTypes` | string array | References into `responseTypes` |
| `classification` | string | Reference into `classifications` |
| `confidence` | enum | Overall case confidence |
| `dependencyStatus` | string | Concise outside-dependence finding |
| `finding` | string | Case-level conclusion |
| `tests` | six objects | Answers to the common test |
| `evidenceIds` | string array | References into `evidence` |
| `uncertainties` | string array | Major unresolved questions |

### Case-test object

| Field | Type | Meaning |
|---|---|---|
| `id` | enum | Canonical question identifier |
| `label` | string | Compact display label |
| `status` | string | Short qualitative result |
| `answer` | string | Evidence-bounded answer |

Required identifiers:

| ID | Dimension |
|---|---|
| `capability` | Capability restored and tasks |
| `scale` | Repeatability at useful scale |
| `penalty` | Added hardware, power, money, time, or engineering |
| `dependency` | Dependence on U.S.- or allied-controlled technology |
| `enforcement` | Susceptibility to a realistic enforcement change |
| `future` | Later-generation relevance rather than current needs only |

Each case must contain all six exactly once.

## `evidence`

Evidence records are claim-level units, not general bibliographic notes.

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Stable evidence identifier |
| `caseIds` | string array | Cases to which the evidence applies |
| `claim` | string | Deliberately scoped proposition |
| `sourceId` | string | Reference into `sources` |
| `sourceType` | string | Display source category |
| `publicationDate` | ISO date or `null` | Verified publication date, when available |
| `accessDate` | ISO date | Date the source was reviewed |
| `quotationOrData` | string | Short excerpt or material data point |
| `location` | string | Page, section, table, paragraph, or repository location |
| `counterevidence` | string | Evidence or reasoning that limits the proposition |
| `confidence` | enum | Confidence in the scoped record |
| `remainingUncertainty` | string | Material unresolved issue |
| `relationship` | enum | `supports`, `qualifies`, or `counters` |

`publicationDate: null` means an exact date was not verified. It must not be replaced with an estimate for display convenience.

References are reciprocal: when a case lists an evidence ID, that evidence record must also list the case ID.

### Confidence

| Value | Working interpretation |
|---|---|
| `High` | Narrow factual claim is directly supported and its scope is clear |
| `Moderate` | Material evidence has vendor-reporting, disclosure, comparability, or allegation limits |
| `Low` | Evidence is indirect, estimated, or cannot establish the needed causal connection |

Confidence applies to the scoped record, not the general credibility of an organization.

### Relationship

| Value | Meaning |
|---|---|
| `supports` | Adds affirmative evidence for the finding |
| `qualifies` | Narrows or contextualizes a claim |
| `counters` | Adds evidence against a claim or classification |

## `sources`

| Field | Type | Meaning |
|---|---|---|
| `id` | string | Stable source identifier |
| `title` | string | Document or resource title |
| `organization` | string | Publisher or responsible organization |
| `url` | HTTPS URL | Direct source location |
| `sourceType` | string | Source category |
| `publicationDate` | ISO date or `null` | Verified publication date, if available |
| `accessDate` | ISO date | Date reviewed |
| `primary` | boolean | Whether original or official for the recorded claim |

`primary: true` does not mean neutral or independently verified. A company preprint is primary evidence of what the company reported.

Version 0.1.0 source categories:

| Source type | Count |
|---|---:|
| Federal rule | 12 |
| Government announcement | 5 |
| Government audit | 1 |
| Government enforcement | 1 |
| Government guidance | 2 |
| Government legal decision | 1 |
| Government policy | 2 |
| Regulatory filing | 1 |
| Technical preprint | 3 |
| Company repository | 2 |
| Independent evaluation | 1 |
| Specialist analysis | 1 |

## Reference graph

```text
timeline[].sourceIds ───────────────▶ sources[].id

cases[].responseTypes ──────────────▶ responseTypes[].id
cases[].classification ─────────────▶ classifications[].id
cases[].evidenceIds ◀───────────────▶ evidence[].caseIds
evidence[].sourceId ────────────────▶ sources[].id
```

Identifiers remain stable across releases unless the underlying subject changes.

## CSV export

`public/data/evidence.csv` has one row per evidence record. All cells are quoted, embedded quotation marks are doubled, and arrays are joined with semicolons.

| CSV column | Source |
|---|---|
| `evidence_id` | `evidence[].id` |
| `case_ids` | Semicolon-separated `evidence[].caseIds` |
| `case_titles` | Titles resolved from `caseIds` |
| `claim` | `evidence[].claim` |
| `source_id` | `evidence[].sourceId` |
| `source_title` | Resolved source title |
| `source_url` | Resolved source URL |
| `source_type` | `evidence[].sourceType` |
| `publication_date` | `evidence[].publicationDate`, blank when `null` |
| `access_date` | `evidence[].accessDate` |
| `quotation_or_data` | `evidence[].quotationOrData` |
| `source_location` | `evidence[].location` |
| `counterevidence` | `evidence[].counterevidence` |
| `confidence` | `evidence[].confidence` |
| `remaining_uncertainty` | `evidence[].remainingUncertainty` |
| `relationship` | `evidence[].relationship` |

## Automated validation

```bash
pnpm check:schema
pnpm check:citations
pnpm check:data
pnpm test
```

The validator checks required collections and fields, unique IDs, ISO dates, HTTPS URLs, controlled values, six canonical tests, valid source references, reciprocal case/evidence links, timeline order, taxonomy coverage, uncited sources, and deterministic exports.

## Manual review still required

Automation cannot determine whether:

- A claim accurately represents its source
- A quotation has enough context
- A locator remains correct
- A URL still resolves
- A rule remains in force
- A comparison is like-for-like
- A confidence or classification judgment is appropriate
- A short quotation is legally reusable

## Source-entry procedure

1. Open the original source, not a search-result snippet.
2. Verify publisher, title, date, and direct HTTPS URL.
3. Record the access date.
4. Decide whether it is primary for the narrow proposition.
5. Add a stable source ID.
6. Add evidence with a precise claim, short excerpt/data point, and locator.
7. Add counterevidence and remaining uncertainty.
8. Link evidence and case in both directions.
9. Run every automated check.
10. Inspect the generated JSON and CSV diff.

Do not infer an exact date, quantity, recipient, hardware provenance, or causal effect when the source does not establish it.

## Provenance and privacy

Only public research content belongs in the dataset. Private background documents, planning materials, notes, credentials, conversations, and unrelated files must not be added to the repository.
