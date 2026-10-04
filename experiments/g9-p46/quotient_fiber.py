#!/usr/bin/env python3
"""KSGT G9-P46 quotient-fiber representation kernel.

This module does not alter EDF-v0.1. It provides:
- exact Jensen-Shannon quotient/fiber accounting for deterministic marker->class maps;
- a separate exclusive marker-event representation for overlap robustness;
- no linguistic or mechanism authority by itself.
"""
from __future__ import annotations

import math
from collections import Counter
from typing import Iterable, Mapping, Sequence


def _normalize(counts: Mapping[str, float]) -> dict[str, float]:
    total = float(sum(v for v in counts.values() if v > 0))
    if total <= 0:
        return {}
    return {k: float(v) / total for k, v in counts.items() if v > 0}


def weighted_js(
    p: Mapping[str, float],
    q: Mapping[str, float],
    alpha: float = 0.5,
) -> float:
    """Weighted Jensen-Shannon divergence in nats.

    p and q are probability-like mappings; they are normalized internally.
    alpha is the P mixture weight and must lie in [0,1].
    """
    if not 0.0 <= alpha <= 1.0:
        raise ValueError("alpha must be in [0,1]")
    pp = _normalize(p)
    qq = _normalize(q)
    if not pp and not qq:
        return 0.0
    keys = set(pp) | set(qq)
    mix = {k: alpha * pp.get(k, 0.0) + (1.0 - alpha) * qq.get(k, 0.0) for k in keys}

    def kl(a: Mapping[str, float], b: Mapping[str, float]) -> float:
        out = 0.0
        for k, av in a.items():
            if av <= 0:
                continue
            bv = b.get(k, 0.0)
            if bv <= 0:
                raise ValueError("mixture support failure")
            out += av * math.log(av / bv)
        return out

    return alpha * kl(pp, mix) + (1.0 - alpha) * kl(qq, mix)


def coarse_counts(
    fine_counts: Mapping[str, float],
    marker_to_class: Mapping[str, str],
) -> dict[str, float]:
    out: Counter[str] = Counter()
    for marker, value in fine_counts.items():
        if value <= 0:
            continue
        if marker not in marker_to_class:
            raise KeyError(f"unmapped positive marker: {marker}")
        out[marker_to_class[marker]] += float(value)
    return dict(out)


def quotient_fiber_decomposition(
    p_counts: Mapping[str, float],
    q_counts: Mapping[str, float],
    marker_to_class: Mapping[str, str],
) -> dict[str, object]:
    """Exact JS chain decomposition for a deterministic marker->class map."""
    p = _normalize(p_counts)
    q = _normalize(q_counts)
    for marker in set(p) | set(q):
        if marker not in marker_to_class:
            raise KeyError(f"unmapped marker: {marker}")

    pc = coarse_counts(p, marker_to_class)
    qc = coarse_counts(q, marker_to_class)
    dq = weighted_js(pc, qc, 0.5)

    fiber_terms: dict[str, float] = {}
    df = 0.0
    classes = sorted(set(pc) | set(qc))
    for cls in classes:
        p_mass = pc.get(cls, 0.0)
        q_mass = qc.get(cls, 0.0)
        r_mass = 0.5 * (p_mass + q_mass)
        if r_mass <= 0:
            fiber_terms[cls] = 0.0
            continue
        alpha = p_mass / (p_mass + q_mass)
        p_cond = {m: v / p_mass for m, v in p.items()
                  if marker_to_class[m] == cls} if p_mass > 0 else {}
        q_cond = {m: v / q_mass for m, v in q.items()
                  if marker_to_class[m] == cls} if q_mass > 0 else {}
        term = r_mass * weighted_js(p_cond, q_cond, alpha)
        fiber_terms[cls] = term
        df += term

    dt = weighted_js(p, q, 0.5)
    return {
        "quotient_motion": dq,
        "fiber_motion": df,
        "total_motion": dt,
        "identity_residual": dt - (dq + df),
        "fiber_terms": fiber_terms,
    }


def legacy_substring_counts(text: str, markers: Sequence[str]) -> dict[str, int]:
    """Exact Python str.count semantics used by legacy EDF-style marker counts."""
    return {m: text.count(m) for m in markers}


def all_marker_hits(text: str, markers: Sequence[str]) -> list[tuple[int, int, int, str]]:
    """Return overlapping hits as (start,end,frozen_order,marker)."""
    hits: list[tuple[int, int, int, str]] = []
    for order, marker in enumerate(markers):
        if not marker:
            raise ValueError("empty marker")
        start = 0
        while True:
            i = text.find(marker, start)
            if i < 0:
                break
            hits.append((i, i + len(marker), order, marker))
            start = i + 1
    return hits


def exclusive_marker_events(text: str, markers: Sequence[str]) -> list[tuple[int, int, str]]:
    """Deterministically choose non-overlapping lexical marker events.

    Priority:
    1) earliest start;
    2) longest span at equal start;
    3) frozen marker order.
    An accepted event blocks every overlapping later hit.
    """
    hits = all_marker_hits(text, markers)
    hits.sort(key=lambda x: (x[0], -(x[1] - x[0]), x[2]))
    accepted: list[tuple[int, int, str]] = []
    occupied_until = -1
    for start, end, _order, marker in hits:
        if start < occupied_until:
            continue
        accepted.append((start, end, marker))
        occupied_until = end
    return accepted


def exclusive_marker_counts(text: str, markers: Sequence[str]) -> dict[str, int]:
    counts = Counter(marker for _s, _e, marker in exclusive_marker_events(text, markers))
    return {m: counts.get(m, 0) for m in markers}
