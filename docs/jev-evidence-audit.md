# Optional Jev evidence audit

The audit checks whether each evidence card's claim and displayed quotation/data are supported by captured source text. A separate question looks for omitted qualifications. It produces a private, linked Markdown report and machine-readable JSON. It never edits the research dataset, confidence ratings, publication dates, or public website.

The ordinary build and CI need no TypeSafe account. Live auditing is an explicit local command.

## Run it

```bash
# Capture public sources once. Python 3.9+; PDFs also need pypdf.
pnpm audit:sources

# Prepare requests and reuse available results, without calling the API.
pnpm audit:evidence

# Evaluate only records whose exact input has no cached response.
pnpm audit:evidence --live
```

For the live command, supply `TYPESAFE_API_KEY` through your environment, or pass `--helper /absolute/path/jev.py` to a trusted local TypeSafe Keychain helper. The helper reads its credential internally. You can save the helper path in the ignored `private/jev-audit/config.json` as `{"helper":"/absolute/path/jev.py"}`. Never put credentials in that file, requests, or source control. An environment key takes precedence over the saved helper; an explicit `--helper` takes precedence over both.

On this workstation the helper and bundled Python paths are already configured privately. No key needs to be copied. On another workstation, use a Python installation containing `pypdf` for PDF capture; set the optional `python` field in the same private config to that executable's absolute path. The default is `python3`. HTML capture requires no third-party Python package.

Open `private/jev-audit/report.md` for the latest full run. Each row links to its evidence card, cited source, exact source excerpts/questions, and raw Jev response. `report.json` retains the distributions, model version, source checksums, timestamps, token usage and dataset fingerprint. A single-record run writes its own report and preserves the full report:

```bash
pnpm audit:evidence --only ev-pangu-codesign --live
pnpm audit:sources --only pangu-ultra-paper --refresh
```

## How to interpret it

- **review:** a possible support mismatch, omitted qualification, or quotation not located in extracted text. Inspect the original source before editing anything.
- **uncertain:** the model has no substantive mismatch to report, but one or more judgments are uncertain. This is separate from a detected error.
- **no flag:** no issue detected in supplied text; not independent verification of the claim or source.
- **prepared:** inputs saved, but no cached answer and no live call requested.
- **unavailable / error:** the source or API could not be checked. These produce a nonzero exit code and remain visible in the report.

The default 0.8 cutoff prioritizes review, not automatic acceptance. It has not been calibrated as a domain accuracy guarantee. A Noul near 0.5 is uncertain yes/no evidence, not medium severity. Model confidence never replaces the project's High/Moderate/Low research confidence. No claims are automatically approved, rejected, or published.

Jev receives only the selected public record and public source text. The collector captures the 16 sources cited by the 21 evidence records; it does not audit timeline-only citations, case-level synthesis or the entire literature. Documents larger than 20,000 characters use deterministic relevance retrieval with surrounding lines. Missing context, HTML/PDF extraction, non-English documents, evolving repository contents and vendor assertions all require care. Excerpts are labeled; missing text is never called fabrication. The collector includes public weight-file metadata when inspecting Hugging Face model repositories.

Source snapshots record retrieval time. They do not prove the document is identical to the historical version used by the study. Historical cutoff and source publication dates are never advanced by the audit. Snapshot reuse is explicit: use `audit:sources --refresh` to retrieve again. Blocked sources are reported, not silently replaced. If you manually capture an official page, retain its URL, extraction scope, timestamp and SHA-256 in the source manifest; label selected material as `coverage: "selected excerpts"`.

## Repeatability and cost

The default model is pinned to `jev-1.13.0`. Each evidence record uses one request containing three independent questions. The response cache is keyed by the model, complete request, source checksum and audit version. Changed claims, rubrics, selected excerpts or source content invalidate the relevant result. Changing the review threshold reuses raw judgments. `--refresh --live` deliberately bypasses response caching.

Successful results survive partial failures, and API calls are not retried automatically. An interrupted run can resume from completed cache entries. The report counts new calls, cached results and successful-call tokens; failed-call billing may be unknown. Source snapshots, requests, responses and local configuration all stay under the repository's ignored `private/` folder.

The website does not import this audit client or access its local credential. Visitors cannot trigger audit requests or charge that configured account. The separate [public research desk](research-desk.md) accepts a visitor’s own key for an explicit, request-scoped Jev assessment; it has no fallback to an environment key or this workstation’s Keychain. Vite explicitly blocks `private/` files from local previews, including raw imports; Git ignore alone would not provide that protection. A browser regression check uses a harmless private fixture to verify the block.

The offline tests cover retrieval context, quotation matching, response validation, cache invalidation, uncertainty routing, and report semantics. Live outputs still need review on representative real records; these tests do not certify model accuracy.

Implementation follows TypeSafe's [citation-checking pattern](https://docs.typesafe.ai/cookbooks/citation_check), [HTTP API](https://docs.typesafe.ai/api), and [confidence guidance](https://docs.typesafe.ai/confidence).
