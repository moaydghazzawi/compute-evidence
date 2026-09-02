# Website summary

## Proposed title

When Controls Raise the Cost

## Subtitle

China’s Responses to U.S. Advanced-Compute Restrictions

## Short description

An evidence-led comparison of whether Chinese AI responses have weakened U.S. advanced-compute controls—or made progress costlier and more dependent.

## Central question

Since October 2022, which Chinese responses have actually weakened U.S. controls on advanced AI chips, and which have only made Chinese AI development more expensive, slower, or more dependent on outside technology?

## Two-minute summary

Chinese AI progress is real, but progress and control failure are not synonyms.

DeepSeek-V3 shows that efficient model and systems design can stretch a restricted Nvidia H800 fleet. Huawei’s Pangu Ultra shows that thousands of domestic Ascend accelerators can complete a very-large-model training run, weakening the narrow claim that top U.S. accelerators are indispensable. CloudMatrix384 shows that system design can recover useful inference performance by pooling many weaker devices. A U.S. prosecution also shows that restricted H100 and H200 chips moved through a diversion network.

Each case has a different implication. DeepSeek remained dependent on controlled foreign hardware. The Huawei cases reduce dependence at the accelerator layer but leave fabrication, high-bandwidth memory, power, networking, production volume, and economics unresolved. Smuggling is an enforcement failure, not technological independence. Public subsidy programs show support exists but do not yet connect a named recipient, restored capability, and net cost.

The current finding is that one response weakens a narrow control point, while none proves system-wide independence. The evidence is more consistent with controls imposing friction and shifting costs than with either an absolute technological blockade or complete policy failure.

## Why it matters

Debate about export controls often treats visible Chinese AI progress as proof that the controls failed. That skips the central policy question: what additional hardware, energy, money, engineering, delay, foreign dependence, or enforcement risk was required to produce the result?

This project separates capability from cost and independence from circumvention.

## Method

Every case receives the same six-question test:

1. What AI capability was restored, and on which tasks?
2. Can it work repeatedly at useful scale?
3. What extra hardware, electricity, money, engineering, or time does it require?
4. Does it reduce dependence on technology controlled by the United States or its allies?
5. Could a realistic enforcement change break the workaround?
6. Can it support the next generation of development, or only current needs?

Evidence is classified as genuine weakening, adaptation with a continuing cost penalty, circumvention without technological independence, or insufficient evidence. Every record includes its source, dates, quotation/data, locator, counterevidence, confidence, and remaining uncertainty.

## Current status

- Version: 0.1.0
- Status: defensible MVP
- Evidence reviewed through: 2 September 2026
- Policy timeline events: 8
- Cases: 5
- Evidence records: 19
- Sources: 32
- Primary sources for the recorded proposition: 30
- Publication status: private pending review

## Key evidence and links

### DeepSeek-V3: compute efficiency with continuing dependence

DeepSeek disclosed a 671-billion-parameter mixture-of-experts model trained on 14.8 trillion tokens using 2.788 million Nvidia H800 GPU-hours. Its widely repeated $5.576 million figure is a rental-equivalent estimate for the disclosed final training run, not a complete program cost. METR found performance broadly comparable to leading models released roughly six months earlier.

- [DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437)
- [METR DeepSeek-V3 Evaluation Report](https://evals.alignment.org/evaluations/deepseek-v3-report/)
- [NVIDIA fiscal 2024 Form 10-K](https://www.sec.gov/Archives/edgar/data/1045810/000104581024000029/nvda-20240128.htm)

### Pangu Ultra: narrow domestic substitution

Huawei reported completing all training stages for a 718-billion-parameter model on 6,000 Ascend 910B NPUs. That weakens the direct claim that controlled U.S. accelerators are indispensable for a large run. It does not resolve fleet availability, energy, capital cost, HBM, fabrication, packaging, or upstream dependence.

- [Pangu Ultra MoE technical preprint](https://arxiv.org/html/2505.04519)
- [openPangu Ultra MoE model repository](https://huggingface.co/openpangu/openPangu-Ultra-MoE-718B-model)
- [BIS guidance on PRC advanced-computing ICs](https://www.bis.gov/media/documents/general-prohibition-10-guidance-may-13-2025.pdf)

### CloudMatrix384: systems engineering shifts the constraint

Huawei and SiliconFlow described a system connecting 384 Ascend NPUs and 192 Kunpeng CPUs. Their DeepSeek-R1 test reported useful inference throughput, but comparisons vary with latency target, batch size, and implementation. Independent, metered cost, power, reliability, and full supply-chain provenance remain unavailable.

- [Serving Large Language Models on Huawei CloudMatrix384](https://arxiv.org/html/2506.12708v3)
- [SemiAnalysis CloudMatrix384 assessment](https://newsletter.semianalysis.com/p/huawei-ai-cloudmatrix-384-chinas-answer-to-nvidia-gb200-nvl72)

### Operation Gatekeeper: diversion without independence

A company and its owner pleaded guilty in a scheme involving at least $160 million in exported and attempted H100 and H200 shipments. The case demonstrates material enforcement leakage, but not how many chips reached end users or which AI capability they produced.

- [U.S. Department of Justice Operation Gatekeeper release](https://www.justice.gov/opa/pr/us-authorities-shut-down-major-china-linked-ai-tech-smuggling-network)
- [BIS counter-diversion guidance](https://media.bis.gov/media/documents/ai-counter-diversion-industry-guidance-may-13-2025.pdf)

### State support and stockpiling: policy exists, causal evidence does not

National tax preferences and a Hangzhou compute-support policy show that public support mechanisms exist. The reviewed evidence does not identify relevant recipients, actual disbursements, hardware origin, or capability produced per yuan. A GAO report records stockpiling as a regulatory concern, not proof of a particular Chinese inventory.

- [2024 integrated-circuit and software tax-preference notice](https://www.ndrc.gov.cn/xwdt/tzgg/202403/t20240322_1365170.html)
- [Hangzhou artificial-intelligence support measures](https://z.hangzhou.com.cn/sdx/content/content_9022081.html)
- [GAO-25-107386](https://www.gao.gov/products/gao-25-107386)

## What would change the finding

- Independently audited frontier-scale training on domestically fabricated accelerators, repeated at useful volume with disclosed HBM, yield, power, and cost
- Metered CloudMatrix deployments showing total-cost and power parity
- Durable next-generation chip or cloud access after realistic customer, ownership, and data-center checks
- Audited firm-level evidence showing no material delay, redesign, inventory drawdown, or cost increase after a matched rule change
- Sustained shortages, unmet demand, delayed projects, or falling training scale would strengthen the opposite conclusion

## Links for a future portfolio entry

Keep the repository and any live deployment private until publication is approved.

- Proposed repository: `https://github.com/moaydghazzawi/when-controls-raise-the-cost`
- Live research product: add only after publication approval
- JSON dataset: `/data/research-dataset.json`
- CSV evidence export: `/data/evidence.csv`
- Methodology: `/methodology`
- Evidence ledger: `/evidence`
- Social preview: `/og.png`

## Suggested portfolio call to action

**Explore the evidence ledger.** Compare five response mechanisms, inspect the evidence behind each judgment, and download the research data.

## Publication checklist

- Recheck rule status against current authoritative sources
- Review vendor-authored performance claims and caveats
- Preserve the narrow scope of the Pangu “genuine weakening” judgment
- Confirm accessibility and responsive-layout results
- Confirm screenshot and social-image rights
- Refresh access dates where material has been rereviewed
- Approve repository licensing
- Audit every tracked file for private or unrelated material
