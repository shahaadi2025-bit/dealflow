"""Small dependency-free BM25 ranker (no embeddings, no model downloads: fits the free tier)."""
from __future__ import annotations
import math, re
from collections import Counter

STOP = set("a an and are as at be by for from has have in is it its of on or that the to was were will with this these those not but about into over after before than then they their he she we you i our your who what which when where why how can could should would may might also more most new says said".split())
_TOK = re.compile(r"[a-z0-9$&]+")


def stem(w: str) -> str:
    for suf in ("ing", "ed", "es", "s"):
        if len(w) > len(suf) + 3 and w.endswith(suf):
            return w[: -len(suf)]
    return w


def tokenize(text: str) -> list[str]:
    return [stem(t) for t in _TOK.findall(text.lower()) if t not in STOP and len(t) > 1]


class BM25:
    def __init__(self, docs: list[list[str]], k1: float = 1.5, b: float = 0.75):
        self.k1, self.b = k1, b
        self.tf = [Counter(d) for d in docs]
        self.len = [len(d) for d in docs]
        self.avg = (sum(self.len) / len(docs)) if docs else 0.0
        df: Counter = Counter()
        for c in self.tf:
            df.update(c.keys())
        n = len(docs)
        self.idf = {t: math.log(1 + (n - v + 0.5) / (v + 0.5)) for t, v in df.items()}
        self.inv: dict[str, list[int]] = {}
        for i, c in enumerate(self.tf):
            for t in c:
                self.inv.setdefault(t, []).append(i)

    def scores(self, query: list[str]) -> dict[int, float]:
        out: dict[int, float] = {}
        for t in set(query):
            idf = self.idf.get(t)
            if idf is None:
                continue
            for i in self.inv[t]:
                f = self.tf[i][t]
                denom = f + self.k1 * (1 - self.b + self.b * self.len[i] / (self.avg or 1))
                out[i] = out.get(i, 0.0) + idf * f * (self.k1 + 1) / denom
        return out
