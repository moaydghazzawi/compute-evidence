# Compute Evidence: research desk

Compute Evidence is a public research workbench created by Moayd Ghazzawi. Its first collection, *When Controls Raise the Cost*, covers five Chinese responses to U.S. advanced-compute restrictions. It is a selective evidence collection, not a general-purpose chatbot, live search engine, or automated truth authority.

## Visitor workflows

- **Test a claim:** curated examples work immediately; custom Jev checks assess each selected evidence record relative to the visitor’s exact claim.
- **Challenge my view:** brings qualifying and challenging records forward without discarding supporting records.
- **Assess a new source:** accepts a public text excerpt, title, HTTPS link, and optional date. Jev assesses excerpt support, novelty within the selected collection, and six research dimensions. The link is retained for the visitor’s brief; the server does not fetch it or send it to Jev.
- **Build a brief:** keyword matches work offline; Jev can rank relevance. Visitors select evidence themselves. Markdown downloads preserve citations, counterevidence, uncertainty, the question each selection belonged to, and whether its relationship came from a saved editorial example, a model assessment, or a manual selection.

The primary Find evidence action and live keyword results work without a provider. Optional Jev settings remain separate. Visitor-authored text in downloaded Markdown is escaped to prevent embedded image or HTML execution in downstream viewers.

All working state is kept in the current tab. Refreshing clears the key and the brief. Users should download a brief before leaving. New source assessments never overwrite the canonical research.

## Account and data boundary

The connector is bring-your-own API key, not an OAuth account-linking flow. A masked input holds the visitor’s key in page memory, never localStorage, sessionStorage, a URL, a cookie, or a database. The add-key action sends no request. Each explicit Run sends one same-origin HTTPS POST, and the server forwards that request’s credential only to `https://api.typesafe.ai/v1/systemone`. There is no environment credential, Keychain integration, background inference, retry, or owner-key fallback in this path.

The browser and site server necessarily handle the entered credential. In-memory handling does not protect against malicious browser extensions or a compromised same-origin script. Use a dedicated, revocable TypeSafe key. The UI explains what is sent and that provider usage belongs to the visitor’s account. Clearing or canceling cannot retract work already received by the provider or guarantee no charge.

The application does not persist or log keys, questions, excerpts, or provider responses. This is an application-level statement, not a promise about infrastructure logging or TypeSafe retention. Hosting observability may record request metadata; TypeSafe’s privacy and data-processing terms apply. Never enable request-body or Authorization-header capture on this route. Public source links, the research’s author attribution, and citation data are intentionally public.

The private maintenance audit is separate. Its Keychain helper, local configuration, captured sources, and reports are ignored by Git and excluded from public assets. Vite denies private-file access and raw imports during development.

## Request controls

- Same-origin POST, JSON content type, explicit action header, HTTPS except loopback development, no query-string inputs.
- Strictly validated action, case, source-filter strings, and source metadata; no visitor-selected endpoint, model, arbitrary model questions, or provider options.
- Up to 1,200 question characters, 6,000 excerpt characters, 32 KB incoming bytes, and at most 30 evidence records.
- Ten-second input-read deadline, 35-second upstream deadline, and 160 KB upstream-response limit.
- Fixed version `jev-1.13.0`, no redirects, no automatic retries, and sanitized errors.
- Responses are no-store and checked against every expected question, option, distribution, model ID, and usage field. The UI checks known evidence IDs and suppresses results for changed inputs.
- A visitor-controlled tab request limit and duplicate-run guard. This is not an account-wide spending cap or a distributed server rate limit. Origin checks protect browser cross-origin use; they do not authenticate scripts outside a browser. Hosting and abuse costs remain the operator’s responsibility. Apply host-level request limits as traffic warrants.
- Clickjacking, content-type, referrer, permissions, and content-security headers. The CSP allows inline scripts required by this renderer; it is defense in depth, not a guarantee against XSS. No third-party page scripts are added.

The source filter “independent evaluations” selects that exact source category (currently METR); it never means all underlying claims were independently verified. Company-authored sources are identified explicitly. Filtering changes the visible record and model input, not the published judgment. Saved example conclusions are not reused as newly assessed conclusions after filtering.

## Routes and design

`/` introduces Compute Evidence and links to the working research desk at `/desk`; `/research` contains the original cases, matrix, and timeline; `/evidence` is the complete ledger; `/methodology` documents limitations; `/about` redirects to the homepage. Legacy case and section links continue to work. The shared visual system uses neutral surfaces, system typography, progressive disclosures, and motion for loading, evidence entry, pinning, and state changes. Reduced-motion preferences disable animated movement.

## Validation and publication

Run `pnpm verify`, then the desktop/mobile browser suite. API contract tests call the real handler with a mocked TypeSafe transport; UI provider-success tests intercept requests using fictional keys. The real local endpoint is exercised only on validation paths that cannot contact TypeSafe. These tests verify the integration contract and behavior, not live provider availability or domain calibration of Jev judgments. No real credential or paid inference is required by the test suite.

Publish the Worker build, including `/api/research-desk`; a static-only upload cannot run the optional connector. No new storage bindings or owner credential are required. Confirm the production HTTPS origin and response headers during the normal post-publication smoke test. Keep the site’s configured public URL and existing domain until an explicit domain change is requested.

Official references checked for this implementation: [API](https://docs.typesafe.ai/api), [models and context limits](https://docs.typesafe.ai/models), [confidence](https://docs.typesafe.ai/confidence), [citation assessment](https://docs.typesafe.ai/cookbooks/citation_check), [privacy](https://typesafe.ai/legal/privacy-policy).
