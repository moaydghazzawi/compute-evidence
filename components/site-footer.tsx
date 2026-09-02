export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-ink text-paper">
      <div className="mx-auto grid max-w-[1480px] gap-7 px-5 py-9 text-xs lg:grid-cols-[1fr_auto] lg:px-10">
        <div>
          <p className="font-heading text-xl">When Controls Raise the Cost</p>
          <p className="mt-2 max-w-2xl leading-relaxed text-paper/60">A living research product. Judgments describe the reviewed public record, not classified facts, legal advice, or a final estimate of policy impact.</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-paper/60">Research and analysis by Moayd Ghazzawi</p>
        </div>
        <div className="flex flex-wrap items-end gap-5 font-semibold text-paper/70">
          <a className="hover:text-paper" href="/methodology">Methodology</a>
          <a className="hover:text-paper" href="/evidence">Evidence ledger</a>
          <a className="hover:text-paper" href="/data/research-dataset.json" download>JSON</a>
          <a className="hover:text-paper" href="/data/evidence.csv" download>CSV</a>
        </div>
      </div>
    </footer>
  );
}
