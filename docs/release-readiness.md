# Compute Evidence release readiness

Verified locally and explicitly approved for publication on 22 September 2026. The hosting service records the deployment result for this source revision.

## Product

- The homepage introduces Compute Evidence. Its primary action opens `/desk`.
- `/research` retains the study, case explorer, comparison matrix, and timeline.
- `/evidence` provides the full source record and exports; `/methodology` explains the research standard.
- `/about` redirects to the homepage. Earlier case/filter/section links continue to resolve.
- Examples, keyword search, source filters, evidence inspection, manual source selection, and cited Markdown briefs need no account.
- Jev is an optional visitor-key integration. No ChatGPT sign-in is presented or required.
- Keys and workspace selections stay in tab memory. Briefs must be downloaded before leaving.

## Verification

- Schema and reciprocal citation validation passed; generated public datasets are current.
- 27 unit and API-contract tests passed, including request limits, cancellation, provider-response validation, redaction, selection provenance, and literal Markdown export.
- Lint, TypeScript validation, and the production Worker build passed.
- 52 applicable desktop/mobile production browser checks passed after the motion contrast fix was rerun. Four screenshot captures passed; two mobile-specific tests are intentionally skipped on desktop.
- All five rendered pages passed the serious/critical accessibility and page-overflow checks. No runtime errors or public sign-in prompts were detected.
- Development-only private-file refusal checks passed separately.
- Production HTML/API security headers, static-download content-type protection, and immutable caching for fingerprinted scripts were verified locally.
- Independent source and bundle review found no remaining concrete publication blocker or owner credential/private maintenance content in the client build.

Screenshots are in `docs/screenshots/home-{desktop,mobile}.png`, `desk-{desktop,mobile}.png`, and `overview-{desktop,mobile}.png`.

## Validation boundary

No live paid Jev request was made during this release verification. Provider success/error paths use fictional keys and mocked responses. This confirms the documented integration contract and application behavior, not live provider availability or the correctness of a particular model judgment. A visitor's explicit assessment uses that visitor's TypeSafe account; there is no owner-key fallback.

## Publication

Publish the complete Worker build, including `/api/research-desk`, using the project's existing hosting configuration. No owner API credential, database, or new storage binding is needed. Keep the existing public domain unless a domain change is requested. After publication, check the production HTTPS pages, navigation, downloads, and response headers. Do not enable request-body or Authorization-header logging. Additional architectural limits are documented in `docs/research-desk.md`.
