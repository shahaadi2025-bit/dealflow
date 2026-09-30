import { Valuation } from "./api";

export function valuationToCsv(v: Valuation): string {
  const c = v.company;
  const lines: string[] = [];
  lines.push(`DealFlow valuation export - ${c.name} (${c.ticker})`);
  lines.push(`As of,${c.as_of}`);
  lines.push("");
  lines.push("Company financials");
  lines.push(`Price,${c.price}`);
  lines.push(`Market cap,${c.market_cap}`);
  lines.push(`Revenue,${c.revenue ?? ""}`);
  lines.push(`Revenue growth,${c.rev_growth ?? ""}`);
  lines.push(`Gross margin,${c.gross_margin ?? ""}`);
  lines.push(`FCF margin,${c.fcf_margin ?? ""}`);
  lines.push(`Net debt,${c.net_debt}`);
  lines.push(`Enterprise value,${c.ev}`);
  lines.push("");
  lines.push("DCF assumptions");
  lines.push(`WACC,${v.assumptions.wacc}`);
  lines.push(`Terminal growth,${v.assumptions.terminal_g}`);
  lines.push(`Year-1 growth,${v.assumptions.growth_start}`);
  lines.push(`Year-5 growth,${v.assumptions.growth_end}`);
  lines.push(`Target FCF margin,${v.assumptions.fcf_margin_target}`);
  lines.push("");
  lines.push("DCF result");
  lines.push(`Enterprise value,${v.dcf.ev}`);
  lines.push(`Equity value,${v.dcf.equity}`);
  lines.push(`Value per share,${v.dcf.per_share}`);
  lines.push("");
  lines.push("Sensitivity grid (rows = WACC, cols = terminal growth)");
  lines.push(["WACC \\ g", ...v.sensitivity.tgs.map((g) => (g * 100).toFixed(1) + "%")].join(","));
  v.sensitivity.grid.forEach((row, i) => {
    lines.push([(v.sensitivity.waccs[i] * 100).toFixed(1) + "%", ...row.map((x) => (x != null ? x.toFixed(2) : ""))].join(","));
  });
  lines.push("");
  lines.push("Comparable companies");
  lines.push("Ticker,Name,Market cap,EV/Revenue,EV/Gross profit,EV/EBITDA");
  v.comps.peers.forEach((p) => {
    lines.push([p.ticker, `"${p.name}"`, p.market_cap, p.ev_rev ?? "", p.ev_gp ?? "", p.ev_ebitda ?? ""].join(","));
  });
  lines.push("");
  lines.push("Football field (valuation ranges per share)");
  lines.push("Label,Low,High");
  v.football.forEach((b) => lines.push([`"${b.label}"`, b.low.toFixed(2), b.high.toFixed(2)].join(",")));
  return lines.join("\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}