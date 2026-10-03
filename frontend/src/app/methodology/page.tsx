import { PageFade } from "@/components/PageFade";

export default function MethodologyPage() {
  return (
    <PageFade>
      <h1 className="font-serif text-3xl text-ink mb-2">Methodology</h1>
      <p className="text-dim text-[12px] mb-10">How DealFlow&apos;s numbers are actually calculated - no black boxes.</p>

      <div className="space-y-10 max-w-2xl">
        <section>
          <h2 className="text-ink text-[14px] mb-3">Fit score</h2>
          <p className="text-dim text-[13px] leading-relaxed mb-3">
            By default, each company gets an explainable, weighted score built from five criteria:
            Rule of 40 (30%), EV/Revenue affordability (20%), revenue growth (15%), gross margin (15%),
            and cash cushion (10%), plus a deal-size fit adjustment favoring $1B-$15B market caps.
            Each criterion is scored 0-1 against a reasonable range, weighted, and summed to 0-100.
          </p>
          <p className="text-dim text-[13px] leading-relaxed">
            When a trained model is available (shown as method &quot;xgboost&quot;), the score instead
            comes from a classifier trained on a small set of historical acquisitions. This is marked
            experimental in the app - with only a couple dozen real examples, treat it as a rough
            directional signal, not a precise probability.
          </p>
        </section>

        <section>
          <h2 className="text-ink text-[14px] mb-3">DCF valuation</h2>
          <p className="text-dim text-[13px] leading-relaxed">
            A standard discounted cash flow: free cash flow is projected five years forward using
            your growth and margin assumptions, each year discounted back at the WACC, plus a
            terminal value computed with the Gordon growth formula beyond year five. WACC defaults
            to a CAPM estimate using the company&apos;s beta; you can override every assumption with the sliders.
          </p>
        </section>

        <section>
          <h2 className="text-ink text-[14px] mb-3">Comparable companies</h2>
          <p className="text-dim text-[13px] leading-relaxed">
            Peers are drawn from the same sector universe. We compute EV/Revenue, EV/Gross Profit,
            and EV/EBITDA for each peer with usable data, take the 25th/50th/75th percentile, and
            apply those multiples to the target&apos;s own financials. Peers lacking the needed data
            (no revenue, no positive EBITDA) are excluded and listed separately so nothing is hidden.
          </p>
        </section>

        <section>
          <h2 className="text-ink text-[14px] mb-3">Data source and freshness</h2>
          <p className="text-dim text-[13px] leading-relaxed">
            Financials come from Yahoo Finance via the yfinance library. A committed snapshot backs
            up live data if a request fails or gets rate-limited, and refreshes automatically once a
            day. Figures can lag real-time by up to a day as a result.
          </p>
        </section>

        <section>
          <h2 className="text-ink text-[14px] mb-3">What this is not</h2>
          <p className="text-dim text-[13px] leading-relaxed">
            This is a research and educational tool. It does not predict announced M&amp;A deals,
            it is not investment advice, and none of its outputs should be relied on for an actual
            transaction without independent verification.
          </p>
        </section>
      </div>
    </PageFade>
  );
}