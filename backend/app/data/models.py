from __future__ import annotations
from dataclasses import dataclass, field, asdict


@dataclass
class Financials:
    ticker: str
    name: str
    price: float
    market_cap: float
    shares: float
    revenue: float | None = None
    rev_growth: float | None = None
    gross_margin: float | None = None
    ebitda: float | None = None
    fcf: float | None = None
    debt: float = 0.0
    cash: float = 0.0
    beta: float | None = None
    hi52: float | None = None
    lo52: float | None = None
    history: list = field(default_factory=list)  # [{"year": 2023, "revenue": ...}]
    price_history: list = field(default_factory=list)  # [{"date": "2026-01-15", "close": 123.45}]
    as_of: str = ""

    @property
    def net_debt(self) -> float:
        return self.debt - self.cash

    @property
    def ev(self) -> float:
        return self.market_cap + self.net_debt

    @property
    def gross_profit(self) -> float | None:
        return self.revenue * self.gross_margin if self.revenue and self.gross_margin is not None else None

    @property
    def fcf_margin(self) -> float | None:
        return self.fcf / self.revenue if self.revenue and self.fcf is not None else None

    @property
    def ebitda_margin(self) -> float | None:
        return self.ebitda / self.revenue if self.revenue and self.ebitda is not None else None

    def to_dict(self) -> dict:
        d = asdict(self)
        d.update(net_debt=self.net_debt, ev=self.ev, gross_profit=self.gross_profit,
                 fcf_margin=self.fcf_margin, ebitda_margin=self.ebitda_margin)
        return d

    @classmethod
    def from_dict(cls, d: dict) -> "Financials":
        keys = cls.__dataclass_fields__.keys()
        return cls(**{k: v for k, v in d.items() if k in keys})