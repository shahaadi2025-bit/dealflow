def wacc(rf: float, beta: float, erp: float, cost_debt: float, tax: float, debt_w: float) -> float:
    ke = rf + beta * erp
    return (1 - debt_w) * ke + debt_w * cost_debt * (1 - tax)


def project_fcfs(revenue0: float, growth_path: list[float], margin0: float, margin_target: float) -> list[float]:
    """Revenue grows along growth_path; FCF margin moves linearly from margin0 to margin_target."""
    rev, out, n = revenue0, [], len(growth_path)
    for i, g in enumerate(growth_path):
        rev *= 1 + g
        out.append(rev * (margin0 + (margin_target - margin0) * (i + 1) / n))
    return out


def dcf_from_fcfs(fcfs: list[float], wacc_: float, terminal_g: float, net_debt: float, shares: float) -> dict:
    if wacc_ <= terminal_g:
        raise ValueError("WACC must exceed terminal growth")
    disc = [(1 + wacc_) ** -(i + 1) for i in range(len(fcfs))]
    pv_fcf = sum(c * d for c, d in zip(fcfs, disc))
    tv = fcfs[-1] * (1 + terminal_g) / (wacc_ - terminal_g)
    pv_tv = tv * disc[-1]
    ev = pv_fcf + pv_tv
    equity = ev - net_debt
    return {"ev": ev, "equity": equity, "per_share": equity / shares,
            "tv_share": pv_tv / ev if ev > 0 else None, "fcfs": fcfs}


def dcf(fcf0, growth_path, wacc_, terminal_g, net_debt, shares) -> dict:
    fcfs, f = [], fcf0
    for g in growth_path:
        f *= 1 + g
        fcfs.append(f)
    return dcf_from_fcfs(fcfs, wacc_, terminal_g, net_debt, shares)
