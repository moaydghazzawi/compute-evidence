# License recommendation

## Recommendation

After publication is approved, use a dual-license structure:

- **MIT License** for original source code, build configuration, validation scripts, tests, and interface code
- **Creative Commons Attribution 4.0 International (CC BY 4.0)** for original research prose and structured data

Do not add either license until the repository owner approves publication and reuse terms.

## Why two licenses

Software and research content have different licensing conventions. MIT is short and familiar for reusable software. Creative Commons is better suited to prose and datasets, and CC BY preserves a useful attribution requirement.

A single MIT license across the repository would make the treatment of prose and data unclear. A Creative Commons license is not recommended for software.

## Proposed scope

| Material | Recommended treatment |
|---|---|
| `app/`, `components/`, `lib/` | MIT |
| `scripts/`, `tests/`, build and CI configuration | MIT |
| Original README and methodology prose | CC BY 4.0 |
| Original structured research data | CC BY 4.0 |
| Short third-party quotations | Excluded; rights remain with original owners |
| Linked rules, reports, papers, filings, and repositories | Not redistributed or relicensed |
| Generated social image and screenshots | Confirm intended terms before licensing |
| Private background or planning material | Must never be included |

## Suggested files after approval

```text
LICENSE-CODE
LICENSE-CONTENT
NOTICE
```

`LICENSE-CODE` should contain the unmodified MIT License text.

`LICENSE-CONTENT` should identify Creative Commons Attribution 4.0 International and link to its [summary](https://creativecommons.org/licenses/by/4.0/) and [legal code](https://creativecommons.org/licenses/by/4.0/legalcode).

`NOTICE` should state which paths fall under each license and clarify that third-party quotations, trademarks, linked materials, and source documents are excluded.

Suggested notice language:

> Unless otherwise stated, original software in this repository is licensed under the MIT License. Original research text and structured data are licensed under Creative Commons Attribution 4.0 International. Third-party quotations, trademarks, and linked source materials are excluded and remain subject to their owners’ rights.

## Attribution suggestion

> Moayd Ghazzawi, *When Controls Raise the Cost: China’s Responses to U.S. Advanced-Compute Restrictions*, version 0.1.0, 2026, with a link to the repository or published project.

The final author form, canonical URL, version, and year should be confirmed at publication.

## Why not CC0

CC0 would maximize downstream reuse, but attribution is substantively useful for a research product in which evidence selection, caveats, and classification judgments are original work. CC BY 4.0 preserves that connection.

## Why no license is applied now

Repository visibility and licensing are separate decisions. A private repository can grant reuse rights, while a public repository without a license does not automatically grant them.

Before licensing, the owner should:

1. Approve publication.
2. Review every tracked file.
3. Confirm ownership and intended terms for screenshots and generated artwork.
4. Check that third-party quotations are brief, necessary, and attributed.
5. Choose exact attribution language.
6. Add the license files and path-level scope notice.

Until then, no permission to copy, modify, or redistribute should be inferred.

This is practical project guidance, not legal advice.
