"use client";
import { useState } from "react";

const DEFINITIONS: Record<string, string> = {
  "Rule of 40": "Revenue growth rate plus profit margin (usually FCF margin). A SaaS company above 40% is considered healthy - fast growth can offset lower profitability, and vice versa.",
  "EV/Revenue": "Enterprise value divided by revenue - how many times revenue the market (or a deal) is paying for the business. Lower often means cheaper, but context on growth and margin matters.",
  "EV/Rev": "Enterprise value divided by revenue - how many times revenue the market (or a deal) is paying for the business. Lower often means cheaper, but context on growth and margin matters.",
  "FCF margin": "Free cash flow divided by revenue - the share of each revenue dollar that converts to cash the business actually keeps, after operating and capital costs.",
  "Gross margin": "Revenue minus cost of goods sold, divided by revenue - how much is left after the direct cost of delivering the product, before operating expenses.",
  "WACC": "Weighted Average Cost of Capital - the blended return a company must earn to satisfy both its lenders and shareholders. Used as the discount rate in a DCF.",
  "Terminal growth": "The assumed growth rate forever after the explicit forecast period ends in a DCF - usually set close to long-run GDP or inflation, since nothing grows fast forever.",
  "DCF": "Discounted Cash Flow - a valuation method that estimates a company's value as the sum of its future cash flows, discounted back to today's dollars.",
  "Enterprise value": "Market cap plus debt minus cash - the theoretical price to buy the entire business outright, including paying off its debts.",
  "Comps": "Comparable companies - similar public businesses used as a reference point, applying their trading multiples (like EV/Revenue) to value the target.",
};

export function Term({ children, align = "center" }: { children: string; align?: "center" | "right" | "left" }) {
  const [open, setOpen] = useState(false);
  const def = DEFINITIONS[children];
  if (!def) return <>{children}</>;
  const pos = align === "right" ? "right-0" : align === "left" ? "left-0" : "left-1/2 -translate-x-1/2";

  // No underline and no help cursor: the label keeps whatever click behaviour its parent has (sorting, links).
  // The definition appears below on hover or keyboard focus and never blocks the click.
  return (
    <span
      className="relative inline-block"
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span role="tooltip" className={`pointer-events-none absolute z-30 top-full ${pos} mt-2 w-60 bg-surface border border-line rounded-lg p-2.5 text-[11px] text-ink normal-case font-normal text-left leading-relaxed shadow-lg`}>
          {def}
        </span>
      )}
    </span>
  );
}
